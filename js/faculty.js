/* ==========================================================================
   Shining Stars Pre School & Academy — Dynamic Faculty Directory
   Loads only real faculty members added by the Admin in Supabase.
   Never displays fake or placeholder teacher profiles.
   ========================================================================== */

(function initFacultyDirectory() {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getInitials(name, fallback) {
    if (fallback && String(fallback).trim()) return String(fallback).trim().toUpperCase().slice(0, 3);
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'SS';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function fetchActiveFaculty() {
    const sb = window.shiningStarsSupabase;
    if (!sb) return [];
    try {
      const { data, error } = await sb
        .from('faculty_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (_) {}
    return [];
  }

  function renderFacultyCards(grid, list, activeFilter) {
    if (!grid) return;
    const filtered = (!activeFilter || activeFilter === 'all')
      ? list
      : list.filter((m) => m.department === activeFilter);

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2.25rem;">
          <p style="color: var(--muted); margin-bottom: 0;">
            ${list.length === 0
              ? 'Faculty member profiles are managed by school administration and will appear here as they are added in the Staff Admin Portal.'
              : 'No faculty members found in this department.'}
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((m) => {
      const color = ['gold', 'sky', 'coral', 'mint'].includes(m.badge_color) ? m.badge_color : 'sky';
      const initials = getInitials(m.full_name, m.initials);
      return `
        <article class="card" data-category="${escapeHtml(m.department)}">
          <div class="avatar-badge ${color}">${escapeHtml(initials)}</div>
          <h3>${escapeHtml(m.full_name)}</h3>
          <p style="color: var(--sky-dark); font-weight: 700; font-size: 0.88rem; margin-bottom: 0.5rem;">${escapeHtml(m.role_title)}</p>
          ${m.bio ? `<p style="font-size: 0.92rem; color: var(--muted); margin-bottom: 0;">${escapeHtml(m.bio)}</p>` : ''}
        </article>
      `;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('faculty-grid');
    if (!grid) return;

    const filterBtns = document.querySelectorAll('[data-faculty-filter]');
    let currentFilter = 'all';
    const members = await fetchActiveFaculty();

    renderFacultyCards(grid, members, currentFilter);

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.getAttribute('data-faculty-filter') || 'all';
        filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
        renderFacultyCards(grid, members, currentFilter);
      });
    });
  });
})();
