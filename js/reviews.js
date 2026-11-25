/* ==========================================================================
   Shining Stars Pre School & Academy — Parent Reviews & School Progress Stars
   Powers [data-review-form], [data-star-picker], [data-progress-summary],
   and [data-reviews-wall] across reviews.html and index.html.
   ========================================================================== */

(function initReviewsModule() {
  const STAR_LABELS = {
    5: '5 Stars — Outstanding School Progress!',
    4: '4 Stars — Very Good Progress',
    3: '3 Stars — Good Progress',
    2: '2 Stars — Needs Improvement',
    1: '1 Star — Needs Immediate Attention'
  };

  const SEED_REVIEWS = [];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderStars(count) {
    const n = Math.max(1, Math.min(5, Number(count) || 5));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function getLocalReviews() {
    try {
      return JSON.parse(localStorage.getItem('shining_stars_local_reviews') || '[]');
    } catch (_) {
      return [];
    }
  }

  function saveLocalReview(item) {
    try {
      const list = getLocalReviews();
      list.unshift(item);
      localStorage.setItem('shining_stars_local_reviews', JSON.stringify(list.slice(0, 30)));
    } catch (_) {}
  }

  async function fetchApprovedReviews() {
    const sb = window.shiningStarsSupabase;
    let dbRows = [];

    if (sb) {
      try {
        const { data, error } = await sb
          .from('parent_reviews')
          .select('id, parent_name, child_program, progress_stars, review_text, created_at')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && Array.isArray(data)) {
          dbRows = data;
        }
      } catch (_) {}
    }

    const localRows = getLocalReviews();
    const combined = [...dbRows];

    localRows.forEach((lr) => {
      const exists = combined.some(
        (r) => r.parent_name === lr.parent_name && r.review_text === lr.review_text
      );
      if (!exists) combined.unshift(lr);
    });

    SEED_REVIEWS.forEach((sr) => {
      const exists = combined.some(
        (r) => r.parent_name === sr.parent_name && r.review_text === sr.review_text
      );
      if (!exists) combined.push(sr);
    });

    return combined;
  }

  function renderProgressSummary(reviews) {
    const containers = document.querySelectorAll('[data-progress-summary]');
    if (!containers.length) return;

    const total = reviews.length || 1;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.progress_stars) || 5), 0);
    const avg = (sum / total).toFixed(1);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const s = Math.max(1, Math.min(5, Number(r.progress_stars) || 5));
      counts[s] += 1;
    });

    containers.forEach((box) => {
      box.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 2rem; align-items: center;">
          <div style="text-align: center; padding-right: 1.5rem; border-right: 1.5px dashed #E5C878;">
            <div class="progress-big-score">${avg}</div>
            <div class="stars-row" style="font-size: 1.25rem; margin: 0.35rem 0;" aria-label="${avg} out of 5 stars">★★★★★</div>
            <span style="font-size: 0.84rem; font-weight: 700; color: var(--muted);">Based on ${reviews.length} Parent Reviews</span>
          </div>
          <div style="display: grid; gap: 0.45rem;">
            ${[5, 4, 3, 2, 1].map((star) => {
              const c = counts[star];
              const pct = Math.round((c / total) * 100);
              return `
                <div class="progress-bar-row">
                  <span>${star} ★</span>
                  <div class="progress-track"><div class="progress-fill" style="width: ${pct}%;"></div></div>
                  <span>${c}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });
  }

  function renderReviewsWall(reviews) {
    const walls = document.querySelectorAll('[data-reviews-wall]');
    if (!walls.length) return;

    walls.forEach((wall) => {
      const limit = Number(wall.getAttribute('data-limit') || 0);
      const list = limit > 0 ? reviews.slice(0, limit) : reviews;

      if (!list.length) {
        wall.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <p style="color: var(--muted); margin-bottom: 0;">No parent reviews submitted yet. Be the first to rate our school progress and share your feedback!</p>
          </div>
        `;
        return;
      }

      wall.innerHTML = list.map((r) => `
        <article class="quote-card">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <div class="stars-row" aria-label="${Number(r.progress_stars) || 5} out of 5 stars">${renderStars(r.progress_stars)}</div>
            <span class="eyebrow mint" style="margin-bottom: 0; font-size: 0.7rem; padding: 0.2rem 0.6rem;">${Number(r.progress_stars) || 5}.0 / 5 Progress</span>
          </div>
          <blockquote>“${escapeHtml(r.review_text)}”</blockquote>
          <div class="quote-author">
            <strong>${escapeHtml(r.parent_name)}</strong>
            <span>${escapeHtml(r.child_program || 'Shining Stars Family')}</span>
          </div>
        </article>
      `).join('');
    });
  }

  function initStarPickers() {
    const pickers = document.querySelectorAll('[data-star-picker]');
    pickers.forEach((picker) => {
      const hiddenInput = picker.querySelector('input[name="progressStars"]');
      const labelEl = picker.querySelector('[data-star-label]');
      const buttons = Array.from(picker.querySelectorAll('[data-star-value]'));

      function setRating(val) {
        const rating = Math.max(1, Math.min(5, Number(val) || 5));
        if (hiddenInput) hiddenInput.value = String(rating);
        buttons.forEach((btn) => {
          const btnVal = Number(btn.getAttribute('data-star-value'));
          const active = btnVal <= rating;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', String(btnVal === rating));
        });
        if (labelEl) {
          labelEl.textContent = STAR_LABELS[rating] || `${rating} Stars`;
        }
      }

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          setRating(btn.getAttribute('data-star-value'));
        });
      });

      setRating(hiddenInput?.value || 5);
    });
  }

  function initReviewForms(refreshWall) {
    const forms = document.querySelectorAll('[data-review-form]');
    forms.forEach((form) => {
      const wrapper = form.closest('[data-review-wrapper]') || form.parentElement;
      const confirmBox = wrapper ? wrapper.querySelector('[data-review-confirmation]') : null;
      const summaryEl = confirmBox ? confirmBox.querySelector('[data-review-summary]') : null;
      const resetBtn = confirmBox ? confirmBox.querySelector('[data-review-reset]') : null;
      const submitBtn = form.querySelector('button[type="submit"]');
      const defaultBtnText = submitBtn ? submitBtn.textContent : 'Submit Review & Suggestions';

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        form.querySelectorAll('[required]').forEach((input) => {
          const fieldWrap = input.closest('.form-field');
          const val = input.value.trim();
          let ok = Boolean(val);
          if (ok && input.type === 'email') {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          }
          if (fieldWrap) fieldWrap.classList.toggle('invalid', !ok);
          if (!ok) valid = false;
        });

        if (!valid) return;

        const data = new FormData(form);
        const refCode = 'REV-' + Math.floor(100000 + Math.random() * 900000);
        const payload = {
          reference_code: refCode,
          parent_name: String(data.get('parentName') || '').trim(),
          email: String(data.get('email') || '').trim(),
          phone: String(data.get('phone') || '').trim(),
          child_program: String(data.get('childProgram') || '').trim(),
          progress_stars: Math.max(1, Math.min(5, Number(data.get('progressStars')) || 5)),
          review_text: String(data.get('reviewText') || '').trim(),
          suggestions: String(data.get('suggestions') || '').trim()
        };

        const waLines = [
          '*New Parent Review — Shining Stars Pre School & Academy*',
          `*Ref:* #${refCode}`,
          `*Parent:* ${payload.parent_name}`,
          `*Program:* ${payload.child_program}`,
          `*School Progress Rating:* ${renderStars(payload.progress_stars)} (${payload.progress_stars}/5)`,
          `*Phone:* ${payload.phone}`,
          `*Email:* ${payload.email}`,
          `*Review:* ${payload.review_text}`
        ];
        if (payload.suggestions) {
          waLines.push(`*Suggestions for Improvement:* ${payload.suggestions}`);
        }
        const whatsappUrl = `https://wa.me/923479912072?text=${encodeURIComponent(waLines.join('\n'))}`;

        // Automatically open WhatsApp forwarding to 0347-9912072 within the click gesture
        try {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        } catch (_) {}

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting Review...';
        }

        const sb = window.shiningStarsSupabase;
        if (sb) {
          try {
            await sb.from('parent_reviews').insert([payload]);
          } catch (_) {}
        }

        saveLocalReview({
          id: refCode,
          parent_name: payload.parent_name,
          child_program: payload.child_program,
          progress_stars: payload.progress_stars,
          review_text: payload.review_text,
          created_at: new Date().toISOString()
        });

        if (summaryEl) {
          summaryEl.textContent = `Thank you, ${payload.parent_name}! Your ${payload.progress_stars}-star review for ${payload.child_program} is now displayed on the website and forwarded to our WhatsApp (0347-9912072) under reference #${refCode}.`;
        }

        if (confirmBox) {
          let waBtn = confirmBox.querySelector('[data-review-whatsapp]');
          if (!waBtn) {
            waBtn = document.createElement('a');
            waBtn.setAttribute('data-review-whatsapp', '');
            waBtn.className = 'btn btn-gold btn-sm';
            waBtn.target = '_blank';
            waBtn.rel = 'noopener noreferrer';
            waBtn.style.marginRight = '0.5rem';
            waBtn.textContent = '📲 Send on WhatsApp (0347-9912072)';
            if (resetBtn) {
              resetBtn.insertAdjacentElement('beforebegin', waBtn);
            } else {
              confirmBox.appendChild(waBtn);
            }
          }
          waBtn.href = whatsappUrl;
        }

        form.style.display = 'none';
        if (confirmBox) confirmBox.classList.add('visible');

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultBtnText;
        }

        await refreshWall();
      });

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          form.reset();
          form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
          const firstStarBtn = form.querySelector('[data-star-value="5"]');
          if (firstStarBtn) firstStarBtn.click();
          form.style.display = '';
          if (confirmBox) confirmBox.classList.remove('visible');
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initStarPickers();

    async function refreshWall() {
      const reviews = await fetchApprovedReviews();
      renderProgressSummary(reviews);
      renderReviewsWall(reviews);
    }

    initReviewForms(refreshWall);
    await refreshWall();
  });
})();
