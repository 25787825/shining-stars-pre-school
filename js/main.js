/* ==========================================================================
   Shining Stars Pre School & Academy — Interactive Scripts
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initTabs();
  initFilters();
  initGalleryLightbox();
  initEventReminders();
  initFaqAccordion();
  initAdmissionsForm();
  initNewsletterForm();
  initPrincipalSlideshow();
});

function initPrincipalSlideshow() {
  const shows = document.querySelectorAll('[data-principal-slideshow]');
  shows.forEach((show) => {
    const slides = Array.from(show.querySelectorAll('.principal-slide'));
    const dots = Array.from(show.querySelectorAll('.principal-dot'));
    if (slides.length <= 1) return;

    const intervalMs = Number(show.getAttribute('data-interval-ms')) || 45000;
    let current = 0;

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
      dots.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        goTo(idx);
        restartTimer();
      });
    });

    let timerId = setInterval(() => goTo(current + 1), intervalMs);

    function restartTimer() {
      clearInterval(timerId);
      timerId = setInterval(() => goTo(current + 1), intervalMs);
    }
  });
}

function initHeader() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('[data-menu-toggle]');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }, { passive: true });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = header.classList.toggle('menu-open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('menu-open')) {
        header.classList.remove('menu-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

function initTabs() {
  const tabGroups = document.querySelectorAll('[data-tab-group]');
  tabGroups.forEach((group) => {
    const buttons = group.querySelectorAll('[data-tab-target]');
    const panels = group.querySelectorAll('[data-tab-panel]');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab-target');

        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });

        panels.forEach((panel) => {
          const match = panel.getAttribute('data-tab-panel') === target;
          panel.classList.toggle('active', match);
        });
      });
    });
  });
}

function initFilters() {
  const filterGroups = document.querySelectorAll('[data-filter-group]');
  filterGroups.forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter-value]');
    const items = group.querySelectorAll('[data-category]');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-filter-value');
        buttons.forEach((b) => b.classList.toggle('active', b === btn));

        items.forEach((item) => {
          const categories = (item.getAttribute('data-category') || '').split(/\s+/);
          const show = value === 'all' || categories.includes(value);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  });
}

function initGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const imgEl = lightbox.querySelector('#lightbox-img');
  const titleEl = lightbox.querySelector('#lightbox-title');
  const catEl = lightbox.querySelector('#lightbox-category');
  const closeBtn = lightbox.querySelector('[data-lightbox-close]');
  const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
  const nextBtn = lightbox.querySelector('[data-lightbox-next]');
  let currentIndex = 0;

  function visibleItems() {
    return items.filter((item) => item.style.display !== 'none');
  }

  function showSlide(index) {
    const list = visibleItems();
    if (!list.length) return;
    currentIndex = (index + list.length) % list.length;
    const item = list[currentIndex];
    const img = item.querySelector('img');
    const title = item.querySelector('h3');
    const cat = item.querySelector('.gallery-caption span');

    if (img && imgEl) {
      imgEl.src = img.src;
      imgEl.alt = img.alt;
    }
    if (title && titleEl) titleEl.textContent = title.textContent;
    if (cat && catEl) catEl.textContent = cat.textContent;
  }

  function openAt(item) {
    const list = visibleItems();
    const idx = list.indexOf(item);
    showSlide(idx >= 0 ? idx : 0);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeBox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  items.forEach((item) => {
    item.addEventListener('click', () => openAt(item));
  });

  if (closeBtn) closeBtn.addEventListener('click', closeBox);
  if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeBox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeBox();
    if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
    if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
  });
}

function initEventReminders() {
  const buttons = document.querySelectorAll('[data-save-event]');
  if (!buttons.length) return;

  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('shining_stars_saved_events') || '[]');
  } catch (_) {
    saved = [];
  }

  function renderBtn(btn, isSaved) {
    btn.classList.toggle('saved', isSaved);
    btn.textContent = isSaved ? '✓ Reminder Saved' : '+ Save Reminder';
    btn.setAttribute('aria-pressed', String(isSaved));
  }

  buttons.forEach((btn) => {
    const id = btn.getAttribute('data-save-event');
    renderBtn(btn, saved.includes(id));

    btn.addEventListener('click', () => {
      if (saved.includes(id)) {
        saved = saved.filter((item) => item !== id);
      } else {
        saved.push(id);
      }
      try {
        localStorage.setItem('shining_stars_saved_events', JSON.stringify(saved));
      } catch (_) {}
      renderBtn(btn, saved.includes(id));
    });
  });
}

function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });
}

function initAdmissionsForm() {
  const forms = document.querySelectorAll('[data-admissions-form]');
  forms.forEach((form) => {
    const container = form.closest('[data-form-wrapper]');
    const confirmBox = container ? container.querySelector('[data-confirmation]') : null;
    const summaryEl = confirmBox ? confirmBox.querySelector('[data-confirm-summary]') : null;
    const resetBtn = confirmBox ? confirmBox.querySelector('[data-reset-form]') : null;
    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultBtnText = submitBtn ? submitBtn.textContent : 'Submit';

    let errorBanner = form.querySelector('[data-submit-error]');
    if (!errorBanner && submitBtn) {
      errorBanner = document.createElement('p');
      errorBanner.setAttribute('data-submit-error', '');
      errorBanner.setAttribute('role', 'alert');
      errorBanner.style.cssText = 'display:none; color:#C94B3B; background:#FFE9E6; border:1px solid #EE6A59; border-radius:10px; padding:0.75rem 1rem; font-size:0.9rem; font-weight:600; margin:1rem 0 0;';
      submitBtn.parentElement.insertAdjacentElement('beforebegin', errorBanner);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBanner) {
        errorBanner.style.display = 'none';
        errorBanner.textContent = '';
      }

      let valid = true;
      const requiredFields = form.querySelectorAll('[required]');
      requiredFields.forEach((input) => {
        const fieldWrap = input.closest('.form-field');
        const val = input.value.trim();
        let fieldValid = Boolean(val);

        if (fieldValid && input.type === 'email') {
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }

        if (fieldWrap) {
          fieldWrap.classList.toggle('invalid', !fieldValid);
        }
        if (!fieldValid) valid = false;
      });

      if (!valid) return;

      const data = new FormData(form);
      const requestType = form.getAttribute('data-form-type') || 'Request';
      const refCode = 'SS-' + Math.floor(100000 + Math.random() * 900000);

      const sb = window.shiningStarsSupabase;
      if (!sb) {
        if (errorBanner) {
          errorBanner.textContent = 'Supabase client is unavailable. Please check your internet connection and try again.';
          errorBanner.style.display = 'block';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      const submissionConfigs = {
        'Campus Tour Booking': {
          table: 'tour_bookings',
          buildRow: () => ({
            reference_code: refCode,
            parent_name: String(data.get('parentName') || '').trim(),
            phone: String(data.get('phone') || '').trim(),
            email: String(data.get('email') || '').trim(),
            child_name: String(data.get('childName') || '').trim(),
            program: String(data.get('program') || '').trim(),
            preferred_date: String(data.get('preferredDate') || '').trim(),
            notes: String(data.get('notes') || '').trim()
          }),
          formatSummary: (row) =>
            `Thank you, ${row.parent_name}! Your Campus Tour Booking for ${row.child_name} (${row.program}) (Preferred Date: ${row.preferred_date}) has been saved under reference #${refCode}. Our Admissions Coordinator will reach out within 1 school business day.`
        },
        'Admissions Application': {
          table: 'admissions_applications',
          buildRow: () => ({
            reference_code: refCode,
            parent_name: String(data.get('parentName') || '').trim(),
            phone: String(data.get('phone') || '').trim(),
            email: String(data.get('email') || '').trim(),
            child_name: String(data.get('childName') || '').trim(),
            date_of_birth: String(data.get('preferredDate') || '').trim(),
            program: String(data.get('program') || '').trim(),
            previous_school: String(data.get('prevSchool') || '').trim()
          }),
          formatSummary: (row) =>
            `Thank you, ${row.parent_name}! Your Admissions Application for ${row.child_name} (${row.program}) (Date of Birth: ${row.date_of_birth}) has been saved under reference #${refCode}. Our Admissions Coordinator will reach out within 1 school business day.`
        },
        'Contact Message': {
          table: 'contact_messages',
          buildRow: () => ({
            reference_code: refCode,
            sender_name: String(data.get('senderName') || '').trim(),
            email: String(data.get('email') || '').trim(),
            phone: String(data.get('phone') || '').trim(),
            subject: String(data.get('subject') || '').trim(),
            message: String(data.get('message') || '').trim()
          }),
          formatSummary: (row) =>
            `Thank you, ${row.sender_name}! Your message regarding "${row.subject}" has been received under reference #${refCode}. Our school office will reply to ${row.email} shortly.`
        }
      };

      try {
        const cfg = submissionConfigs[requestType];
        if (!cfg) {
          throw new Error(`Unsupported form type: ${requestType}`);
        }

        const payload = cfg.buildRow();
        const { error } = await sb.from(cfg.table).insert([payload]);
        if (error) {
          throw error;
        }

        if (summaryEl) {
          summaryEl.textContent = cfg.formatSummary(payload);
        }

        form.style.display = 'none';
        if (confirmBox) confirmBox.classList.add('visible');
      } catch (err) {
        if (errorBanner) {
          errorBanner.textContent = `Could not save to Supabase (${err.message || 'network error'}). Make sure supabase/schema.sql has been executed in your Supabase SQL Editor.`;
          errorBanner.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultBtnText;
        }
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
        if (errorBanner) {
          errorBanner.style.display = 'none';
          errorBanner.textContent = '';
        }
        form.style.display = '';
        if (confirmBox) confirmBox.classList.remove('visible');
      });
    }
  });
}

function initNewsletterForm() {
  const forms = document.querySelectorAll('[data-newsletter-form]');
  forms.forEach((form) => {
    const status = form.parentElement.querySelector('.newsletter-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultBtnText = submitBtn ? submitBtn.textContent : 'Join';

    function setNewsletterStatus(message, tone) {
      if (!status) return;
      status.classList.remove('is-success', 'is-info', 'is-error');
      if (tone) status.classList.add(`is-${tone}`);
      status.textContent = message;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input) return;
      const email = input.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setNewsletterStatus('Please enter a valid email address.', 'error');
        return;
      }

      const sb = window.shiningStarsSupabase;
      if (!sb) {
        setNewsletterStatus('Connection unavailable. Please check your internet connection.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }
      setNewsletterStatus('Adding you to our mailing list...', '');

      try {
        const { error } = await sb.from('newsletter_subscribers').insert([{ email }]);
        if (error) {
          if (error.code === '23505') {
            setNewsletterStatus(`★ ${email} is already subscribed to Shining Stars monthly updates!`, 'info');
            form.reset();
            return;
          }
          throw error;
        }
        setNewsletterStatus(`✓ Thank you for subscribing! ${email} will receive our monthly Shining Stars newsletter.`, 'success');
        form.reset();
      } catch (err) {
        setNewsletterStatus(`Could not subscribe right now (${err.message || 'error'}).`, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultBtnText;
        }
      }
    });
  });
}
