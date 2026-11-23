/* ==========================================================================
   Shining Stars Pre School & Academy — SSP SPEECH & HOPE Page Hydration
   Handles homepage cards, SSP hub page, and dedicated service detail pages.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSspGrids();
  initSspServiceDetailPage();
});

async function initSspGrids() {
  const grids = document.querySelectorAll('[data-ssp-cards]');
  if (!grids.length || !window.sspUtils) return;

  const { categories } = await window.sspUtils.fetchSspCategories({ includeUnpublished: false });

  grids.forEach((grid) => {
    window.sspUtils.renderSspCards(grid, categories);

    const filterGroup = grid.closest('[data-ssp-filter-wrap]');
    if (!filterGroup) return;

    const filterButtons = filterGroup.querySelectorAll('[data-ssp-filter]');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filterVal = btn.getAttribute('data-ssp-filter') || 'all';
        filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
        const filtered = filterVal === 'all'
          ? categories
          : categories.filter((c) => c.accent_color === filterVal);
        window.sspUtils.renderSspCards(grid, filtered);
      });
    });
  });
}

async function initSspServiceDetailPage() {
  const detailRoot = document.getElementById('ssp-service-root');
  if (!detailRoot || !window.sspUtils) return;

  const { escapeHtml, fetchSspCategories, fetchSspCategoryBySlug, renderSspCards, slugify } = window.sspUtils;

  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug') || '';
  if (!slug) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    if (last && !last.endsWith('.html')) {
      slug = last;
    }
  }
  slug = slugify(slug) || 'adhd-support';

  const [{ categories }, category] = await Promise.all([
    fetchSspCategories({ includeUnpublished: false }),
    fetchSspCategoryBySlug(slug)
  ]);

  const activeCategory = category || categories[0] || window.SSP_DEFAULT_CATEGORIES[0];
  if (!activeCategory) {
    detailRoot.innerHTML = `
      <div class="container section">
        <div class="card">
          <h2>Service Not Found</h2>
          <p>We could not find that SSP Speech &amp; Hope service category.</p>
          <a class="btn btn-primary" href="ssp-speech-hope.html">View All SSP Services</a>
        </div>
      </div>
    `;
    return;
  }

  document.title = `${activeCategory.title} | SSP Speech & Hope — Shining Stars`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && activeCategory.summary) {
    metaDesc.setAttribute('content', activeCategory.summary);
  }

  const accent = ['mint', 'sky', 'gold', 'coral'].includes(activeCategory.accent_color)
    ? activeCategory.accent_color
    : 'sky';

  const strategies = String(activeCategory.support_strategies || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const strategiesHtml = strategies.length
    ? `<ul class="check-list">${strategies.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p style="color: var(--muted);">Individualized strategies tailored during your child\'s initial consultation.</p>';

  const overviewParagraphs = String(activeCategory.overview || activeCategory.summary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  detailRoot.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb">
          <a href="index.html">Home</a> <span>/</span>
          <a href="ssp-speech-hope.html">SSP Speech &amp; Hope</a> <span>/</span>
          <span>${escapeHtml(activeCategory.title)}</span>
        </div>
        <span class="eyebrow ${accent}">${escapeHtml(activeCategory.icon || '★')} ${escapeHtml(activeCategory.badge || 'SSP Speech & Hope')}</span>
        <h1>${escapeHtml(activeCategory.title)}</h1>
        <p>${escapeHtml(activeCategory.hero_subtitle || activeCategory.summary)}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 1.5rem; align-items: center;">
          <a class="btn btn-primary" href="admissions.html#admissions-portal">Book an SSP Consultation</a>
          <a class="btn btn-outline" href="ssp-speech-hope.html">&larr; All SSP Services</a>
          <span class="eyebrow sky" style="margin-bottom: 0;">${escapeHtml(activeCategory.session_format || 'Ages 2–12')}</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container ssp-detail-grid">
        <div style="display: grid; gap: 1.75rem;">
          <article class="card">
            <span class="eyebrow ${accent}">Program Overview</span>
            <h2>How We Support Your Child</h2>
            ${overviewParagraphs}
          </article>

          <article class="card">
            <span class="eyebrow mint">Core Strategies &amp; Focus Areas</span>
            <h2>What Sessions Include</h2>
            ${strategiesHtml}
          </article>

          ${activeCategory.parent_tips ? `
            <article class="ssp-parent-box">
              <span class="eyebrow" style="background: rgba(255,255,255,0.75);">Home &amp; Family Tip</span>
              <h3 style="margin-bottom: 0.45rem;">Supporting Progress at Home</h3>
              <p style="margin-bottom: 0; color: var(--navy-soft);">${escapeHtml(activeCategory.parent_tips)}</p>
            </article>
          ` : ''}
        </div>

        <aside style="display: grid; gap: 1.35rem;">
          <div class="card">
            <span class="eyebrow sky">Who It Supports</span>
            <h3>Is This Right for Your Child?</h3>
            <p style="color: var(--muted); margin-bottom: 0;">${escapeHtml(activeCategory.who_its_for || activeCategory.summary)}</p>
          </div>

          <div class="card" style="background: var(--sky-soft); border-color: rgba(43, 143, 216, 0.35);">
            <span class="eyebrow coral">Take the Next Step</span>
            <h3>Speak With SSP Speech &amp; Hope</h3>
            <p style="color: var(--muted); font-size: 0.94rem;">
              Every child's journey begins with a warm, unhurried parent conversation and gentle observation.
            </p>
            <ul class="check-list" style="margin-bottom: 1.25rem;">
              <li>Confidential parent consultation</li>
              <li>Play-based developmental screening</li>
              <li>Coordinated school &amp; home care plan</li>
            </ul>
            <div style="display: grid; gap: 0.65rem;">
              <a class="btn btn-primary" href="admissions.html#admissions-portal">Request Consultation / Tour</a>
              <a class="btn btn-outline" href="events.html">View Parent Workshops</a>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="section bg-cream-warm">
      <div class="container">
        <div class="section-header">
          <span class="eyebrow">Explore More Support</span>
          <h2>Other SSP SPEECH &amp; HOPE Services</h2>
          <p>Browse our full family of developmental, therapy, and parent support services.</p>
        </div>
        <div id="ssp-related-grid" class="ssp-grid"></div>
      </div>
    </section>
  `;

  const relatedGrid = document.getElementById('ssp-related-grid');
  renderSspCards(relatedGrid, categories, { excludeSlug: activeCategory.slug });
}
