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
    applications: []
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
      'count-applications': state.applications.length
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

    const [subsRes, msgsRes, toursRes, appsRes] = await Promise.all([
      sb.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
      sb.from('contact_messages').select('*').order('created_at', { ascending: false }),
      sb.from('tour_bookings').select('*').order('created_at', { ascending: false }),
      sb.from('admissions_applications').select('*').order('created_at', { ascending: false })
    ]);

    const firstError = subsRes.error || msgsRes.error || toursRes.error || appsRes.error;
    if (firstError) {
      showNotice(`Error loading data: ${firstError.message}`, true);
      return;
    }

    state.subscribers = subsRes.data || [];
    state.messages = msgsRes.data || [];
    state.tours = toursRes.data || [];
    state.applications = appsRes.data || [];
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

  const { data: initialSession } = await sb.auth.getSession();
  if (initialSession?.session?.user) {
    setSignedInView(initialSession.session.user);
    await loadAllData();
  } else {
    setSignedInView(null);
  }
}
