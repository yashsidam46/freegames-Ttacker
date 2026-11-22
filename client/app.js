/* ═══════════════════════════════════════════════
   FreeDrop — App Logic
   ═══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:3000/api';

/* ── STATE ───────────────────────────────────── */
const state = {
  games:       [],
  filtered:    [],
  genres:      [],
  currentPage: 1,
  limit:       9,
  totalPages:  1,
  loading:     false,
  sortBy:      'id',
  order:       'asc',
  search:      '',
  genre:       '',
  wishlist:    new Set(JSON.parse(localStorage.getItem('fd_wishlist') || '[]')),
};

/* ── DOM REFS ─────────────────────────────────── */
const $ = id => document.getElementById(id);

const els = {
  gamesGrid:     $('gamesGrid'),
  loadingState:  $('loadingState'),
  errorState:    $('errorState'),
  emptyState:    $('emptyState'),
  errorMessage:  $('errorMessage'),
  retryBtn:      $('retryBtn'),
  clearFiltersBtn: $('clearFiltersBtn'),
  genreChips:    $('genreChips'),
  sortSelect:    $('sortSelect'),
  searchInput:   $('searchInput'),
  searchClear:   $('searchClear'),
  refreshBtn:    $('refreshBtn'),
  pagination:    $('pagination'),
  prevPage:      $('prevPage'),
  nextPage:      $('nextPage'),
  pageNumbers:   $('pageNumbers'),
  resultsText:   $('resultsText'),
  statTotal:     $('statTotal'),
  statFree:      $('statFree'),
  navbar:        $('navbar'),
  modalOverlay:  $('modalOverlay'),
  modal:         $('modal'),
  modalClose:    $('modalClose'),
  modalCover:    $('modalCover'),
  modalTitle:    $('modalTitle'),
  modalBadges:   $('modalBadges'),
  modalMeta:     $('modalMeta'),
  modalPrice:    $('modalPrice'),
  modalClaimBtn: $('modalClaimBtn'),
  modalWishlist: $('modalWishlist'),
  modalTags:     $('modalTags'),
  toastContainer: $('toastContainer'),
  bgParticles:   $('bgParticles'),
};

/* ── INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  spawnParticles();
  attachEventListeners();
  fetchGames();
});

/* ── PARTICLES ────────────────────────────────── */
function spawnParticles() {
  const count = 25;
  const colors = ['#8b5cf6', '#06b6d4', '#a78bfa', '#22d3ee', '#f472b6'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${Math.random() * 3 + 1}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = `${Math.random() * 20 + 15}s`;
    p.style.animationDelay = `${Math.random() * 20}s`;
    els.bgParticles.appendChild(p);
  }
}

/* ── EVENTS ───────────────────────────────────── */
function attachEventListeners() {
  // Navbar scroll
  window.addEventListener('scroll', () => {
    els.navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Search
  els.searchInput.addEventListener('input', debounce(() => {
    state.search = els.searchInput.value.trim();
    els.searchClear.classList.toggle('visible', state.search.length > 0);
    state.currentPage = 1;
    applyFiltersAndRender();
  }, 250));

  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    state.search = '';
    els.searchClear.classList.remove('visible');
    state.currentPage = 1;
    applyFiltersAndRender();
  });

  // Sort
  els.sortSelect.addEventListener('change', () => {
    const [sortBy, order] = els.sortSelect.value.split('-');
    state.sortBy = sortBy;
    state.order  = order;
    state.currentPage = 1;
    applyFiltersAndRender();
  });

  // Pagination
  els.prevPage.addEventListener('click', () => {
    if (state.currentPage > 1) { state.currentPage--; renderPage(); }
  });
  els.nextPage.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) { state.currentPage++; renderPage(); }
  });

  // Refresh
  els.refreshBtn.addEventListener('click', () => {
    els.refreshBtn.classList.add('spinning');
    fetchGames().finally(() => {
      setTimeout(() => els.refreshBtn.classList.remove('spinning'), 800);
    });
  });

  // Modal
  els.modalClose.addEventListener('click', closeModal);
  els.modalOverlay.addEventListener('click', e => {
    if (e.target === els.modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Retry / clear
  els.retryBtn.addEventListener('click', fetchGames);
  els.clearFiltersBtn.addEventListener('click', clearFilters);
}

/* ── FETCH ────────────────────────────────────── */
async function fetchGames() {
  if (state.loading) return;
  state.loading = true;
  showState('loading');

  try {
    // Fetch all games (high limit so we can filter client-side)
    const url = `${API_BASE}/games?limit=50&page=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const json = await res.json();

    state.games = json.data || [];

    // Build genre list
    const genreSet = new Set(state.games.map(g => g.genre).filter(Boolean));
    state.genres = [...genreSet].sort();

    // Update stats
    els.statTotal.textContent = state.games.length;
    const freeCount = state.games.filter(g => g.price === 0).length;
    els.statFree.textContent = freeCount;

    buildGenreChips();
    state.currentPage = 1;
    applyFiltersAndRender();
    showToast('Games loaded!', 'success', '🎮');

  } catch (err) {
    console.error(err);
    els.errorMessage.textContent = err.message.includes('fetch')
      ? 'Cannot connect to server. Make sure it\'s running on port 3000.'
      : err.message;
    showState('error');
  } finally {
    state.loading = false;
  }
}

/* ── GENRE CHIPS ──────────────────────────────── */
function buildGenreChips() {
  // Keep the "All" chip, add genre chips
  const existing = els.genreChips.querySelectorAll('.chip:not([data-genre=""])');
  existing.forEach(c => c.remove());

  state.genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.genre = genre;
    btn.textContent = genre;
    btn.addEventListener('click', () => {
      state.genre = genre;
      state.currentPage = 1;
      updateActiveChip();
      applyFiltersAndRender();
    });
    els.genreChips.appendChild(btn);
  });

  // All chip
  const allChip = els.genreChips.querySelector('[data-genre=""]');
  allChip.onclick = () => {
    state.genre = '';
    state.currentPage = 1;
    updateActiveChip();
    applyFiltersAndRender();
  };
}

function updateActiveChip() {
  els.genreChips.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.genre === state.genre);
  });
}

/* ── FILTER + SORT ────────────────────────────── */
function applyFiltersAndRender() {
  let result = [...state.games];

  // Search
  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(g =>
      g.title?.toLowerCase().includes(q) ||
      g.genre?.toLowerCase().includes(q) ||
      g.platform?.toLowerCase().includes(q)
    );
  }

  // Genre
  if (state.genre) {
    result = result.filter(g => g.genre === state.genre);
  }

  // Sort
  result.sort((a, b) => {
    const field = state.sortBy;
    if (field === 'id' || field === 'price') {
      const diff = (a[field] ?? 0) - (b[field] ?? 0);
      return state.order === 'desc' ? -diff : diff;
    }
    if (field === 'title' || field === 'genre') {
      const diff = (a[field] || '').localeCompare(b[field] || '');
      return state.order === 'desc' ? -diff : diff;
    }
    return 0;
  });

  state.filtered = result;
  state.totalPages = Math.max(1, Math.ceil(result.length / state.limit));
  if (state.currentPage > state.totalPages) state.currentPage = 1;

  renderPage();
}

/* ── RENDER PAGE ──────────────────────────────── */
function renderPage() {
  const start = (state.currentPage - 1) * state.limit;
  const end   = start + state.limit;
  const slice = state.filtered.slice(start, end);

  if (state.filtered.length === 0) {
    showState('empty');
    return;
  }

  showState('grid');

  // Update results info
  els.resultsText.textContent =
    `Showing ${start + 1}–${Math.min(end, state.filtered.length)} of ${state.filtered.length} games`;

  // Render cards
  els.gamesGrid.innerHTML = '';
  slice.forEach((game, i) => {
    const card = createGameCard(game, i);
    els.gamesGrid.appendChild(card);
  });

  renderPagination();
  window.scrollTo({ top: document.getElementById('controlsSection').offsetTop - 80, behavior: 'smooth' });
}

/* ── GAME CARD ────────────────────────────────── */
const GAME_EMOJIS = {
  'RPG':       '⚔️',
  'Action':    '💥',
  'Adventure': '🗺️',
  'Racing':    '🏎️',
  'Sandbox':   '🧱',
  'Shooter':   '🔫',
  'Strategy':  '♟️',
};

const GENRE_CLASSES = {
  'RPG':       'genre-rpg',
  'Action':    'genre-action',
  'Adventure': 'genre-adventure',
  'Racing':    'genre-racing',
  'Sandbox':   'genre-sandbox',
  'Shooter':   'genre-shooter',
  'Strategy':  'genre-strategy',
};

const PLATFORM_CLASSES = {
  'Epic':  'platform-epic',
  'Steam': 'platform-steam',
  'GOG':   'platform-gog',
  'Itch':  'platform-itch',
};

function createGameCard(game, index) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.style.animationDelay = `${index * 0.06}s`;
  card.setAttribute('role', 'listitem');
  card.tabIndex = 0;

  const isFree = game.price === 0;
  const emoji  = GAME_EMOJIS[game.genre] || '🎮';
  const genreClass = GENRE_CLASSES[game.genre] || 'genre-default';
  const platform = game.platform || 'PC';
  const platformLabel = normalizePlatform(platform);
  const platformClass = PLATFORM_CLASSES[platformLabel] || 'platform-default';
  const inWishlist = state.wishlist.has(String(game.id));

  card.innerHTML = `
    <div class="card-cover">
      <div class="card-cover-placeholder ${genreClass}">
        ${emoji}
      </div>
      <div class="card-cover-gradient"></div>
      ${isFree ? `<div class="card-free-badge">🎁 FREE</div>` : ''}
      <span class="card-platform-badge ${platformClass}">${platformLabel}</span>
    </div>
    <div class="card-body">
      <span class="card-genre">${game.genre || 'Game'}</span>
      <h3 class="card-title">${escHtml(game.title)}</h3>
      <div class="card-meta">
        <span class="card-tag">🖥️ ${escHtml(platform)}</span>
        ${inWishlist ? `<span class="card-tag">♥ Wishlisted</span>` : ''}
      </div>
      <div class="card-price-row">
        <div>
          <div class="card-price ${isFree ? '' : 'paid'}">
            ${isFree ? 'FREE' : `$${game.price.toFixed(2)}`}
          </div>
          ${isFree && game.originalPrice ? `<div class="card-original-price">$${game.originalPrice.toFixed(2)}</div>` : ''}
        </div>
        ${isFree
          ? `<button class="card-claim-btn" aria-label="Claim ${escHtml(game.title)}">🎁 Claim</button>`
          : `<button class="card-claim-btn" style="background:linear-gradient(135deg,#374151,#4b5563)" aria-label="View ${escHtml(game.title)}">View</button>`
        }
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.card-claim-btn')) {
      openModal(game);
    } else {
      e.stopPropagation();
      openModal(game);
    }
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openModal(game);
  });

  return card;
}

/* ── MODAL ────────────────────────────────────── */
function openModal(game) {
  const isFree = game.price === 0;
  const emoji  = GAME_EMOJIS[game.genre] || '🎮';
  const genreClass = GENRE_CLASSES[game.genre] || 'genre-default';
  const platformLabel = normalizePlatform(game.platform || 'PC');
  const platformClass = PLATFORM_CLASSES[platformLabel] || 'platform-default';
  const inWishlist = state.wishlist.has(String(game.id));

  // Cover
  els.modalCover.className = `modal-cover ${genreClass}`;
  els.modalCover.innerHTML = `<span style="font-size:5rem">${emoji}</span>`;

  // Badges
  els.modalBadges.innerHTML = `
    ${isFree ? `<span class="modal-badge badge-free">🎁 Free Now</span>` : ''}
    <span class="modal-badge badge-genre">${game.genre || 'Game'}</span>
    <span class="modal-badge ${platformClass}">${platformLabel}</span>
  `;

  // Title
  els.modalTitle.textContent = game.title;

  // Meta
  els.modalMeta.innerHTML = `
    <span class="modal-meta-item">🖥️ ${escHtml(game.platform || 'PC')}</span>
    <span class="modal-meta-item">${isFree ? '✅ Currently Free' : '💰 Paid Game'}</span>
    ${game.id ? `<span class="modal-meta-item" style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-600)">ID #${game.id}</span>` : ''}
  `;

  // Price
  els.modalPrice.innerHTML = `
    <span class="modal-price-free">${isFree ? 'FREE' : `$${(game.price||0).toFixed(2)}`}</span>
    ${game.originalPrice ? `<span class="modal-price-original">$${game.originalPrice.toFixed(2)}</span>` : ''}
  `;

  // Claim button
  els.modalClaimBtn.onclick = () => {
    showToast(`Opening ${game.title}…`, 'success', '🎁');
    closeModal();
  };

  // Wishlist
  updateWishlistBtn(game.id, inWishlist);
  els.modalWishlist.onclick = () => {
    const id = String(game.id);
    const nowIn = state.wishlist.has(id);
    if (nowIn) {
      state.wishlist.delete(id);
      showToast('Removed from wishlist', 'info', '♡');
    } else {
      state.wishlist.add(id);
      showToast('Added to wishlist!', 'success', '♥');
    }
    localStorage.setItem('fd_wishlist', JSON.stringify([...state.wishlist]));
    updateWishlistBtn(game.id, !nowIn);
    // Refresh card in grid
    applyFiltersAndRender();
  };

  // Tags
  const tags = [game.genre, game.platform, isFree ? 'Free to Play' : 'Paid', 'PC Gaming'].filter(Boolean);
  els.modalTags.innerHTML = tags.map(t => `<span class="modal-tag">${escHtml(t)}</span>`).join('');

  els.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  els.modalClose.focus();
}

function updateWishlistBtn(id, isIn) {
  els.modalWishlist.textContent = isIn ? '♥ Wishlisted' : '♡ Wishlist';
  els.modalWishlist.style.color = isIn ? 'var(--pink-400)' : '';
  els.modalWishlist.style.borderColor = isIn ? 'rgba(244,114,182,0.4)' : '';
}

function closeModal() {
  els.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ── PAGINATION ───────────────────────────────── */
function renderPagination() {
  els.pagination.classList.toggle('hidden', state.totalPages <= 1);

  els.prevPage.disabled = state.currentPage <= 1;
  els.nextPage.disabled = state.currentPage >= state.totalPages;

  // Page numbers (show max 5 around current)
  els.pageNumbers.innerHTML = '';
  const range = getPageRange(state.currentPage, state.totalPages, 5);
  range.forEach(p => {
    if (p === '…') {
      const dot = document.createElement('span');
      dot.style.color = 'var(--text-600)';
      dot.style.padding = '0 4px';
      dot.textContent = '…';
      els.pageNumbers.appendChild(dot);
      return;
    }
    const btn = document.createElement('button');
    btn.className = `page-num${p === state.currentPage ? ' active' : ''}`;
    btn.textContent = p;
    btn.setAttribute('aria-label', `Page ${p}`);
    btn.addEventListener('click', () => {
      state.currentPage = p;
      renderPage();
    });
    els.pageNumbers.appendChild(btn);
  });
}

function getPageRange(cur, total, maxVisible) {
  if (total <= maxVisible) return Array.from({length: total}, (_, i) => i + 1);
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, cur - half);
  let end   = Math.min(total, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  const pages = [];
  if (start > 1)     { pages.push(1); if (start > 2) pages.push('…'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total)   { if (end < total - 1) pages.push('…'); pages.push(total); }
  return pages;
}

/* ── UI STATE ─────────────────────────────────── */
function showState(which) {
  els.loadingState.classList.toggle('hidden', which !== 'loading');
  els.errorState.classList.toggle('hidden',   which !== 'error');
  els.emptyState.classList.toggle('hidden',   which !== 'empty');
  els.gamesGrid.classList.toggle('hidden',    which !== 'grid');
  els.pagination.classList.toggle('hidden',   which !== 'grid' || state.totalPages <= 1);
  els.resultsText.textContent = which === 'loading' ? 'Loading…'
    : which !== 'grid' ? '0 results' : els.resultsText.textContent;
}

/* ── CLEAR FILTERS ────────────────────────────── */
function clearFilters() {
  state.search = '';
  state.genre  = '';
  els.searchInput.value = '';
  els.searchClear.classList.remove('visible');
  els.sortSelect.value = 'id-asc';
  state.sortBy = 'id'; state.order = 'asc';
  state.currentPage = 1;
  updateActiveChip();
  applyFiltersAndRender();
}

/* ── TOAST ────────────────────────────────────── */
function showToast(message, type = 'info', icon = 'ℹ️') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${escHtml(message)}</span>`;
  els.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ── HELPERS ──────────────────────────────────── */
function normalizePlatform(platform) {
  const p = (platform || '').toLowerCase();
  if (p.includes('epic'))  return 'Epic';
  if (p.includes('steam')) return 'Steam';
  if (p.includes('gog'))   return 'GOG';
  if (p.includes('itch'))  return 'Itch';
  return 'PC';
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
