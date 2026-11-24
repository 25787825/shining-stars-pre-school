/* ==========================================================================
   Shining Stars Pre School & Academy — Staff Admin Portal
   Uses Supabase Auth + Row-Level Security (public.staff_admins).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAdminPortal();
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function downloadCsv(filename, headers, rows) {
  const escapeCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escapeCell).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCell).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function initAdminPortal() {
  const sb = window.shiningStarsSupabase;
  const authSection = document.getElementById('admin-auth-section');
  const dashboardSection = document.getElementById('admin-dashboard-section');
  const loginForm = document.getElementById('admin-login-form');
  const loginError = document.getElementById('admin-login-error');
  const signOutBtn = document.getElementById('admin-signout-btn');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const userEmailEl = document.getElementById('admin-user-email');
  const searchInput = document.getElementById('admin-search-input');
  const dashboardNotice = document.getElementById('admin-dashboard-notice');

  const state = {
    subscribers: [],
    messages: [],
    tours: [],
    applications: [],
    reviews: [],
    sspCategories: []
  };

  function showNotice(msg, isError) {
    if (!dashboardNotice) return;
    if (!msg) {
      dashboardNotice.style.display = 'none';
      dashboardNotice.textContent = '';
      return;
    }
    dashboardNotice.style.display = 'block';
    dashboardNotice.style.background = isError ? '#FFE9E6' : '#E4F6EE';
    dashboardNotice.style.borderColor = isError ? '#EE6A59' : '#2DA378';
    dashboardNotice.style.color = isError ? '#C94B3B' : '#166549';
    dashboardNotice.textContent = msg;
  }

  function setSignedInView(user) {
    if (authSection) authSection.style.display = user ? 'none' : '';
    if (dashboardSection) dashboardSection.style.display = user ? '' : 'none';
    if (userEmailEl) userEmailEl.textContent = user ? user.email : '';
  }

  function renderCounts() {
    const map = {
      'count-subscribers': state.subscribers.length,
      'count-messages': state.messages.length,
      'count-tours': state.tours.length,
      'count-applications': state.applications.length,
      'count-reviews': state.reviews.length,
      'count-ssp': state.sspCategories.length
    };
    Object.entries(map).forEach(([id, count]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(count);
    });
  }

  function matchesQuery(row, query) {
    if (!query) return true;
    return Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(query)
    );
  }

  async function updateRowStatus(table, id, newStatus) {
    if (!sb) return;
    const { error } = await sb.from(table).update({ status: newStatus }).eq('id', id);
    if (error) {
      showNotice(`Could not update status: ${error.message}`, true);
      return;
    }
    showNotice(`Updated status to "${newStatus}".`, false);
    await loadAllData();
  }

  function bindStatusSelects(container, table) {
    container.querySelectorAll('[data-status-id]').forEach((selectEl) => {
      selectEl.addEventListener('change', () => {
        const id = Number(selectEl.getAttribute('data-status-id'));
        updateRowStatus(table, id, selectEl.value);
      });
    });
  }

  function renderTables() {
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

    // 1. Newsletter Subscribers
    const subBody = document.getElementById('tbody-subscribers');
    if (subBody) {
      const rows = state.subscribers.filter((r) => matchesQuery(r, query));
      subBody.innerHTML = rows.length
        ? rows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${escapeHtml(r.email)}</strong></td>
              <td>${escapeHtml(formatDateTime(r.subscribed_at))}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="3">No newsletter subscribers found.</td></tr>';
    }

    // 2. Contact Messages
    const msgBody = document.getElementById('tbody-messages');
    if (msgBody) {
      const rows = state.messages.filter((r) => matchesQuery(r, query));
      msgBody.innerHTML = rows.length
        ? rows.map((r) => `
            <tr>
              <td><code>${escapeHtml(r.reference_code)}</code></td>
              <td><strong>${escapeHtml(r.sender_name)}</strong><br><small>${escapeHtml(r.email)}${r.phone ? ' • ' + escapeHtml(r.phone) : ''}</small></td>
              <td><strong>${escapeHtml(r.subject)}</strong><br><span style="color:var(--muted);">${escapeHtml(r.message)}</span></td>
              <td>
                <select class="status-select" data-status-id="${r.id}" aria-label="Message status">
                  <option value="new" ${r.status === 'new' ? 'selected' : ''}>New</option>
                  <option value="replied" ${r.status === 'replied' ? 'selected' : ''}>Replied</option>
                  <option value="archived" ${r.status === 'archived' ? 'selected' : ''}>Archived</option>
                </select>
              </td>
              <td>${escapeHtml(formatDateTime(r.created_at))}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="5">No contact messages found.</td></tr>';
      bindStatusSelects(msgBody, 'contact_messages');
    }

    // 3. Tour Bookings
    const tourBody = document.getElementById('tbody-tours');
    if (tourBody) {
      const rows = state.tours.filter((r) => matchesQuery(r, query));
      tourBody.innerHTML = rows.length
        ? rows.map((r) => `
            <tr>
              <td><code>${escapeHtml(r.reference_code)}</code></td>
              <td><strong>${escapeHtml(r.parent_name)}</strong><br><small>${escapeHtml(r.email)} • ${escapeHtml(r.phone)}</small></td>
              <td><strong>${escapeHtml(r.child_name)}</strong><br><small>${escapeHtml(r.program)}</small></td>
              <td>${escapeHtml(r.preferred_date)}${r.notes ? '<br><small style="color:var(--muted);">' + escapeHtml(r.notes) + '</small>' : ''}</td>
              <td>
                <select class="status-select" data-status-id="${r.id}" aria-label="Tour status">
                  <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                  <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
              <td>${escapeHtml(formatDateTime(r.created_at))}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="6">No campus tour bookings found.</td></tr>';
      bindStatusSelects(tourBody, 'tour_bookings');
    }

    // 4. Admissions Inquiries
    const appBody = document.getElementById('tbody-applications');
    if (appBody) {
      const rows = state.applications.filter((r) => matchesQuery(r, query));
      appBody.innerHTML = rows.length
        ? rows.map((r) => `
            <tr>
              <td><code>${escapeHtml(r.reference_code)}</code></td>
              <td><strong>${escapeHtml(r.parent_name)}</strong><br><small>${escapeHtml(r.email)} • ${escapeHtml(r.phone)}</small></td>
              <td><strong>${escapeHtml(r.child_name)}</strong><br><small>${escapeHtml(r.program)} • DOB: ${escapeHtml(r.date_of_birth)}</small></td>
              <td>${escapeHtml(r.previous_school || '—')}</td>
              <td>
                <select class="status-select" data-status-id="${r.id}" aria-label="Application status">
                  <option value="submitted" ${r.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                  <option value="under_review" ${r.status === 'under_review' ? 'selected' : ''}>Under Review</option>
                  <option value="accepted" ${r.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                  <option value="waitlisted" ${r.status === 'waitlisted' ? 'selected' : ''}>Waitlisted</option>
                </select>
              </td>
              <td>${escapeHtml(formatDateTime(r.created_at))}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="6">No admissions inquiries found.</td></tr>';
      bindStatusSelects(appBody, 'admissions_applications');
    }

    // 5. Parent Reviews & Suggestions
    const revBody = document.getElementById('tbody-reviews');
    if (revBody) {
      const rows = state.reviews.filter((r) => matchesQuery(r, query));
      revBody.innerHTML = rows.length
        ? rows.map((r) => `
            <tr>
              <td><code>${escapeHtml(r.reference_code)}</code></td>
              <td>
                <strong>${escapeHtml(r.parent_name)}</strong><br>
                <small>${escapeHtml(r.email)} • ${escapeHtml(r.phone)}</small>
              </td>
              <td>
                <span style="color:var(--gold-dark); font-weight:700;">${'★'.repeat(Number(r.progress_stars) || 5)} (${Number(r.progress_stars) || 5}/5)</span><br>
                <small>${escapeHtml(r.child_program)}</small>
              </td>
              <td>
                <strong>Review:</strong> ${escapeHtml(r.review_text)}
                ${r.suggestions ? '<br><small style="color:var(--sky-dark);"><strong>Suggestion:</strong> ' + escapeHtml(r.suggestions) + '</small>' : ''}
              </td>
              <td>
                <span class="status-badge ${r.is_published !== false && r.is_approved !== false ? 'confirmed' : 'archived'}">${r.is_approved !== false ? 'Approved' : 'Hidden'}</span>
              </td>
              <td>${escapeHtml(formatDateTime(r.created_at))}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="6">No parent reviews submitted yet.</td></tr>';
    }

    // 5. SSP SPEECH & HOPE Categories
    const sspBody = document.getElementById('tbody-ssp');
    if (sspBody) {
      const rows = state.sspCategories.filter((r) => matchesQuery(r, query));
      sspBody.innerHTML = rows.length
        ? rows.map((r) => `
            <tr>
              <td><strong>#${escapeHtml(r.sort_order)}</strong></td>
              <td>
                <strong>${escapeHtml(r.icon || '★')} ${escapeHtml(r.title)}</strong><br>
                <small style="color:var(--muted);"><code>${escapeHtml(r.slug)}</code></small>
              </td>
              <td>
                <span class="status-badge">${escapeHtml(r.badge)}</span><br>
                <small style="color:var(--muted);">${escapeHtml(r.session_format)}</small>
              </td>
              <td>
                <span class="status-badge ${r.is_published ? 'confirmed' : 'archived'}">${r.is_published ? 'Published' : 'Hidden'}</span>
              </td>
              <td>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                  <button class="btn btn-outline btn-sm" type="button" data-ssp-edit="${r.id}">Edit</button>
                  <a class="btn btn-outline btn-sm" href="ssp-service.html?slug=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">View</a>
                  <button class="btn btn-outline btn-sm" type="button" data-ssp-delete="${r.id}" style="color:#C94B3B; border-color:#EE6A59;">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')
        : '<tr><td colspan="5">No categories in Supabase yet. Click "Seed Default 8 Categories" or "+ Add New Category".</td></tr>';

      sspBody.querySelectorAll('[data-ssp-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-ssp-edit'));
          const cat = state.sspCategories.find((c) => c.id === id);
          if (cat) openSspEditor(cat);
        });
      });

      sspBody.querySelectorAll('[data-ssp-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.getAttribute('data-ssp-delete'));
          const cat = state.sspCategories.find((c) => c.id === id);
          if (!cat || !window.confirm(`Delete "${cat.title}"? This removes its dedicated page from the site.`)) return;
          const { error } = await sb.from('ssp_categories').delete().eq('id', id);
          if (error) {
            showNotice(`Could not delete category: ${error.message}`, true);
            return;
          }
          showNotice(`Deleted "${cat.title}".`, false);
          await loadAllData();
        });
      });
    }
  }

  function openSspEditor(cat) {
    const card = document.getElementById('ssp-editor-card');
    const heading = document.getElementById('ssp-editor-heading');
    if (!card) return;
    document.getElementById('ssp-edit-id').value = cat ? String(cat.id) : '';
    document.getElementById('ssp-title').value = cat?.title || '';
    document.getElementById('ssp-slug').value = cat?.slug || '';
    document.getElementById('ssp-badge').value = cat?.badge || 'SSP Support';
    document.getElementById('ssp-accent').value = cat?.accent_color || 'sky';
    document.getElementById('ssp-icon').value = cat?.icon || '★';
    document.getElementById('ssp-format').value = cat?.session_format || '1-on-1 & Small Group • Ages 2–12';
    document.getElementById('ssp-order').value = String(cat?.sort_order ?? (state.sspCategories.length + 1));
    document.getElementById('ssp-published').checked = cat ? Boolean(cat.is_published) : true;
    document.getElementById('ssp-summary').value = cat?.summary || '';
    document.getElementById('ssp-hero-subtitle').value = cat?.hero_subtitle || '';
    document.getElementById('ssp-overview').value = cat?.overview || '';
    document.getElementById('ssp-who').value = cat?.who_its_for || '';
    document.getElementById('ssp-strategies').value = cat?.support_strategies || '';
    document.getElementById('ssp-parent-tips').value = cat?.parent_tips || '';
    if (heading) heading.textContent = cat ? `Edit: ${cat.title}` : 'Add New SSP Category';
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function loadAllData() {
    if (!sb) return;
    showNotice('', false);

    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      setSignedInView(null);
      return;
    }

    const { data: adminRow, error: adminErr } = await sb
      .from('staff_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminErr) {
      showNotice(`Admin check failed: ${adminErr.message}. Make sure supabase/schema.sql has been executed.`, true);
      return;
    }

    if (!adminRow) {
      showNotice(`Signed in as ${user.email}, but this user is not yet listed in public.staff_admins. Add your user_id in Supabase SQL Editor to view records.`, true);
      return;
    }

    const [subsRes, msgsRes, toursRes, appsRes, revsRes, sspRes] = await Promise.all([
      sb.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
      sb.from('contact_messages').select('*').order('created_at', { ascending: false }),
      sb.from('tour_bookings').select('*').order('created_at', { ascending: false }),
      sb.from('admissions_applications').select('*').order('created_at', { ascending: false }),
      sb.from('parent_reviews').select('*').order('created_at', { ascending: false }),
      sb.from('ssp_categories').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true })
    ]);

    const firstError = subsRes.error || msgsRes.error || toursRes.error || appsRes.error;
    if (firstError) {
      showNotice(`Error loading data: ${firstError.message}`, true);
      return;
    }

    if (sspRes.error) {
      showNotice(`SSP Speech & Hope table note: ${sspRes.error.message}. Run supabase/ssp-speech-hope.sql in Supabase SQL Editor to enable live editing.`, true);
    }

    state.subscribers = subsRes.data || [];
    state.messages = msgsRes.data || [];
    state.tours = toursRes.data || [];
    state.applications = appsRes.data || [];
    state.reviews = revsRes.data || [];
    state.sspCategories = sspRes.data || [];
    renderCounts();
    renderTables();
  }

  if (!sb) {
    if (loginError) {
      loginError.textContent = 'Supabase client failed to load. Please check your internet connection.';
      loginError.style.display = 'block';
    }
    return;
  }

  if (loginForm) {
    const loginSuccess = document.getElementById('admin-login-success');
    const forgotBtn = document.getElementById('admin-forgot-btn');
    const recoveryForm = document.getElementById('admin-recovery-form');
    const recoveryStatus = document.getElementById('admin-recovery-status');
    const recoveryEmailInput = document.getElementById('admin-recovery-email');
    const otpWrap = document.getElementById('admin-otp-wrap');
    const otpInput = document.getElementById('admin-otp-code');
    const backLoginBtn = document.getElementById('admin-back-login-btn');
    let hasActiveRecoverySession = false;

    function setRecoveryStatus(msg, isError) {
      if (!recoveryStatus) return;
      if (!msg) {
        recoveryStatus.style.display = 'none';
        recoveryStatus.textContent = '';
        return;
      }
      recoveryStatus.textContent = msg;
      recoveryStatus.style.cssText = isError
        ? 'display:block; color:#C94B3B; background:#FFE9E6; border:1px solid #EE6A59; border-radius:10px; padding:0.75rem 1rem; font-size:0.9rem; font-weight:600; margin:1rem 0 0;'
        : 'display:block; color:#166549; background:#E4F6EE; border:1px solid #2DA378; border-radius:10px; padding:0.75rem 1rem; font-size:0.9rem; font-weight:600; margin:1rem 0 0;';
    }

    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && recoveryForm) {
        hasActiveRecoverySession = true;
        setSignedInView(null);
        loginForm.style.display = 'none';
        recoveryForm.style.display = 'block';
        if (recoveryEmailInput && session?.user?.email) {
          recoveryEmailInput.value = session.user.email;
        }
        if (otpWrap) otpWrap.style.display = 'none';
        setRecoveryStatus('Recovery link verified! Enter your new password below.', false);
      }
    });

    if (backLoginBtn && recoveryForm) {
      backLoginBtn.addEventListener('click', () => {
        hasActiveRecoverySession = false;
        recoveryForm.style.display = 'none';
        loginForm.style.display = '';
        setRecoveryStatus('', false);
        if (otpWrap) otpWrap.style.display = '';
      });
    }

    if (forgotBtn) {
      forgotBtn.addEventListener('click', async () => {
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
        const email = String(document.getElementById('admin-email')?.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (loginError) {
            loginError.textContent = 'Enter your Staff Email Address above first, then click "Forgot Password? Send 6-Digit Code".';
            loginError.style.display = 'block';
          }
          return;
        }
        forgotBtn.disabled = true;
        forgotBtn.textContent = 'Sending 6-digit code...';
        try {
          const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href.split('#')[0]
          });
          if (error) throw error;
          hasActiveRecoverySession = false;
          if (recoveryForm) {
            loginForm.style.display = 'none';
            recoveryForm.style.display = 'block';
            if (recoveryEmailInput) recoveryEmailInput.value = email;
            if (otpWrap) otpWrap.style.display = '';
            if (otpInput) otpInput.value = '';
            setRecoveryStatus(`6-digit recovery code sent to ${email}. Check your inbox (and spam folder).`, false);
          }
        } catch (err) {
          if (loginError) {
            loginError.textContent = err.message || 'Could not send 6-digit recovery code.';
            loginError.style.display = 'block';
          }
        } finally {
          forgotBtn.disabled = false;
          forgotBtn.textContent = 'Forgot Password? Send 6-Digit Code';
        }
      });
    }

    if (recoveryForm) {
      recoveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setRecoveryStatus('', false);
        const email = String(recoveryEmailInput?.value || '').trim();
        const otpCode = String(otpInput?.value || '').replace(/\s+/g, '');
        const newPassword = String(document.getElementById('admin-new-password')?.value || '');

        if (!hasActiveRecoverySession && !/^\d{6}$/.test(otpCode)) {
          setRecoveryStatus('Please enter the 6-digit numeric recovery code from your email.', true);
          return;
        }
        if (newPassword.length < 6) {
          setRecoveryStatus('Password must be at least 6 characters.', true);
          return;
        }

        const saveBtn = recoveryForm.querySelector('button[type="submit"]');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Verifying & saving...';
        }

        try {
          if (!hasActiveRecoverySession) {
            const { error: otpError } = await sb.auth.verifyOtp({
              email,
              token: otpCode,
              type: 'recovery'
            });
            if (otpError) throw otpError;
          }

          const { data, error } = await sb.auth.updateUser({ password: newPassword });
          if (error) throw error;

          hasActiveRecoverySession = false;
          recoveryForm.style.display = 'none';
          loginForm.style.display = '';
          if (data?.user) {
            setSignedInView(data.user);
            await loadAllData();
          }
        } catch (err) {
          setRecoveryStatus(err.message || 'Could not verify code or update password.', true);
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Verify 6-Digit Code & Save Password';
          }
        }
      });
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginError) loginError.style.display = 'none';
      if (loginSuccess) loginSuccess.style.display = 'none';
      const email = String(document.getElementById('admin-email')?.value || '').trim();
      const password = String(document.getElementById('admin-password')?.value || '');
      if (!email || !password) {
        if (loginError) {
          loginError.textContent = 'Please enter both your staff email and password.';
          loginError.style.display = 'block';
        }
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSignedInView(data.user);
        await loadAllData();
      } catch (err) {
        if (loginError) {
          loginError.textContent = err.message || 'Sign-in failed.';
          loginError.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In to Staff Portal';
        }
      }
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      setSignedInView(null);
      if (loginForm) loginForm.reset();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadAllData());
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderTables());
  }

  // Export CSV buttons
  document.getElementById('export-subscribers-btn')?.addEventListener('click', () => {
    downloadCsv(
      'shining-stars-newsletter-subscribers.csv',
      ['ID', 'Email', 'Subscribed At'],
      state.subscribers.map((r) => [r.id, r.email, r.subscribed_at])
    );
  });

  document.getElementById('export-messages-btn')?.addEventListener('click', () => {
    downloadCsv(
      'shining-stars-contact-messages.csv',
      ['Reference', 'Sender', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Created At'],
      state.messages.map((r) => [r.reference_code, r.sender_name, r.email, r.phone, r.subject, r.message, r.status, r.created_at])
    );
  });

  document.getElementById('export-tours-btn')?.addEventListener('click', () => {
    downloadCsv(
      'shining-stars-tour-bookings.csv',
      ['Reference', 'Parent', 'Phone', 'Email', 'Child', 'Program', 'Preferred Date', 'Notes', 'Status', 'Created At'],
      state.tours.map((r) => [r.reference_code, r.parent_name, r.phone, r.email, r.child_name, r.program, r.preferred_date, r.notes, r.status, r.created_at])
    );
  });

  document.getElementById('export-applications-btn')?.addEventListener('click', () => {
    downloadCsv(
      'shining-stars-admissions-inquiries.csv',
      ['Reference', 'Parent', 'Phone', 'Email', 'Child', 'DOB', 'Program', 'Previous School', 'Status', 'Created At'],
      state.applications.map((r) => [r.reference_code, r.parent_name, r.phone, r.email, r.child_name, r.date_of_birth, r.program, r.previous_school, r.status, r.created_at])
    );
  });

  document.getElementById('export-reviews-btn')?.addEventListener('click', () => {
    downloadCsv(
      'shining-stars-parent-reviews.csv',
      ['Reference', 'Parent', 'Email', 'Phone', 'Program', 'Progress Stars', 'Review', 'Suggestions', 'Approved', 'Created At'],
      state.reviews.map((r) => [r.reference_code, r.parent_name, r.email, r.phone, r.child_program, r.progress_stars, r.review_text, r.suggestions, r.is_approved, r.created_at])
    );
  });

  // SSP SPEECH & HOPE Category Editor Controls
  const sspEditorCard = document.getElementById('ssp-editor-card');
  const sspEditorForm = document.getElementById('ssp-editor-form');
  const sspTitleInput = document.getElementById('ssp-title');
  const sspSlugInput = document.getElementById('ssp-slug');

  if (sspTitleInput && sspSlugInput) {
    sspTitleInput.addEventListener('input', () => {
      const editId = document.getElementById('ssp-edit-id')?.value;
      if (!editId && window.sspUtils) {
        sspSlugInput.value = window.sspUtils.slugify(sspTitleInput.value);
      }
    });
  }

  document.getElementById('ssp-new-btn')?.addEventListener('click', () => openSspEditor(null));
  document.getElementById('ssp-editor-cancel')?.addEventListener('click', () => {
    if (sspEditorCard) sspEditorCard.style.display = 'none';
  });

  document.getElementById('ssp-seed-btn')?.addEventListener('click', async () => {
    const defaults = (window.SSP_DEFAULT_CATEGORIES || []).map(({ id, ...rest }) => rest);
    if (!defaults.length) return;
    const { error } = await sb.from('ssp_categories').upsert(defaults, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) {
      showNotice(`Could not seed categories: ${error.message}`, true);
      return;
    }
    showNotice('Seeded default SSP Speech & Hope categories!', false);
    await loadAllData();
  });

  if (sspEditorForm) {
    sspEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('ssp-edit-id')?.value;
      const title = String(sspTitleInput?.value || '').trim();
      const slug = window.sspUtils ? window.sspUtils.slugify(sspSlugInput?.value || title) : String(sspSlugInput?.value || '').trim();
      const summary = String(document.getElementById('ssp-summary')?.value || '').trim();

      if (title.length < 2 || slug.length < 2 || summary.length < 10) {
        showNotice('Please enter a valid Title, Slug, and Summary (at least 10 characters).', true);
        return;
      }

      const payload = {
        title,
        slug,
        badge: String(document.getElementById('ssp-badge')?.value || 'SSP Support').trim(),
        accent_color: document.getElementById('ssp-accent')?.value || 'sky',
        icon: String(document.getElementById('ssp-icon')?.value || '★').trim(),
        session_format: String(document.getElementById('ssp-format')?.value || 'Ages 2–12').trim(),
        sort_order: Number(document.getElementById('ssp-order')?.value || 10),
        is_published: Boolean(document.getElementById('ssp-published')?.checked),
        summary,
        hero_subtitle: String(document.getElementById('ssp-hero-subtitle')?.value || '').trim(),
        overview: String(document.getElementById('ssp-overview')?.value || '').trim(),
        who_its_for: String(document.getElementById('ssp-who')?.value || '').trim(),
        support_strategies: String(document.getElementById('ssp-strategies')?.value || '').trim(),
        parent_tips: String(document.getElementById('ssp-parent-tips')?.value || '').trim(),
        updated_at: new Date().toISOString()
      };

      const res = editId
        ? await sb.from('ssp_categories').update(payload).eq('id', Number(editId))
        : await sb.from('ssp_categories').insert([payload]);

      if (res.error) {
        showNotice(`Could not save category: ${res.error.message}`, true);
        return;
      }

      if (sspEditorCard) sspEditorCard.style.display = 'none';
      showNotice(`Saved "${title}" successfully!`, false);
      await loadAllData();
    });
  }

  const { data: initialSession } = await sb.auth.getSession();
  if (initialSession?.session?.user) {
    setSignedInView(initialSession.session.user);
    await loadAllData();
  } else {
    setSignedInView(null);
  }
}
