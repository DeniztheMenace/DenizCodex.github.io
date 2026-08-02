/**
 * Sticky Header Component
 * Controls categories navigation menu, search events, dropdown panels (bookmarks & settings),
 * theme changes, and script sizing.
 */

export class Header {
  constructor(app) {
    this.app = app;
    this.navEl = document.getElementById('categories-nav-list');
    this.bookmarksListEl = document.getElementById('bookmarks-list');
    this.bookmarksBadgeEl = document.getElementById('bookmarks-badge');
    this.searchInputEl = document.getElementById('search-input');
    
    // Toggles
    this.bookmarksToggleBtn = document.getElementById('btn-toggle-bookmarks');
    this.bookmarksDropdown = document.getElementById('bookmarks-dropdown');
    
    this.settingsToggleBtn = document.getElementById('btn-toggle-settings');
    this.settingsDropdown = document.getElementById('settings-dropdown');
    
    // Themes
    this.themeParchmentBtn = document.getElementById('btn-theme-parchment');
    this.themeInkwellBtn = document.getElementById('btn-theme-inkwell');
    
    // Font controls
    this.fontDecBtn = document.getElementById('btn-font-dec');
    this.fontIncBtn = document.getElementById('btn-font-inc');
    
    this.init();
  }

  init() {
    // Dropdown toggles
    this.bookmarksToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.bookmarksDropdown.classList.toggle('hidden');
      this.settingsDropdown.classList.add('hidden');
    });

    this.settingsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsDropdown.classList.toggle('hidden');
      this.bookmarksDropdown.classList.add('hidden');
    });

    // Close dropdowns on outside clicks
    document.addEventListener('click', (e) => {
      if (!this.bookmarksDropdown.contains(e.target) && !this.bookmarksToggleBtn.contains(e.target)) {
        this.bookmarksDropdown.classList.add('hidden');
      }
      if (!this.settingsDropdown.contains(e.target) && !this.settingsToggleBtn.contains(e.target)) {
        this.settingsDropdown.classList.add('hidden');
      }
    });

    // Search input
    this.searchInputEl.addEventListener('input', (e) => this.handleSearch(e.target.value));

    // Themes
    this.themeParchmentBtn.addEventListener('click', () => this.setTheme('parchment'));
    this.themeInkwellBtn.addEventListener('click', () => this.setTheme('inkwell'));

    // Font Sizing
    this.fontDecBtn.addEventListener('click', () => this.adjustFontSize(-1));
    this.fontIncBtn.addEventListener('click', () => this.adjustFontSize(1));

    // Load defaults
    this.loadPreferences();
    this.renderBookmarks();
  }

  setTheme(theme) {
    if (theme === 'parchment') {
      document.body.className = 'parchment-theme';
      this.themeParchmentBtn.classList.add('active');
      this.themeInkwellBtn.classList.remove('active');
      localStorage.setItem('codex-theme', 'parchment');
    } else {
      document.body.className = 'inkwell-theme';
      this.themeParchmentBtn.classList.remove('active');
      this.themeInkwellBtn.classList.add('active');
      localStorage.setItem('codex-theme', 'inkwell');
    }
  }

  adjustFontSize(direction) {
    let currentStr = getComputedStyle(document.documentElement).getPropertyValue('--font-base-size');
    let currentSize = parseFloat(currentStr);
    if (isNaN(currentSize)) {
      currentSize = 20;
    }
    const newSize = Math.max(14, Math.min(26, currentSize + direction));
    document.documentElement.style.setProperty('--font-base-size', `${newSize}px`);
    localStorage.setItem('codex-font-size', `${newSize}px`);
  }

  loadPreferences() {
    const savedTheme = localStorage.getItem('codex-theme') || 'inkwell';
    this.setTheme(savedTheme);
    
    const savedSize = localStorage.getItem('codex-font-size');
    if (savedSize) {
      document.documentElement.style.setProperty('--font-base-size', savedSize);
    }
  }

  renderCategories(categories, activeCategoryId) {
    this.navEl.innerHTML = '';
    
    // Add dynamic links
    categories.forEach(cat => {
      const li = document.createElement('li');
      if (cat.id === activeCategoryId) {
        li.className = 'active';
      }
      
      const a = document.createElement('a');
      a.href = `#/category/${cat.id}`;
      a.innerHTML = `
        <span>${cat.name}</span>
      `;
      
      li.appendChild(a);
      this.navEl.appendChild(li);
    });
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  handleSearch(query) {
    this.app.triggerSearch(query.trim().toLowerCase());
  }

  /* BOOKMARKS INTERACTION */
  getBookmarks() {
    return JSON.parse(localStorage.getItem('codex-bookmarks') || '[]');
  }

  addBookmark(articleId, title, scrollPercent) {
    let bookmarks = this.getBookmarks();
    bookmarks = bookmarks.filter(b => b.articleId !== articleId);
    
    bookmarks.push({
      articleId,
      title,
      scrollPercent,
      date: new Date().toLocaleDateString()
    });
    
    localStorage.setItem('codex-bookmarks', JSON.stringify(bookmarks));
    this.renderBookmarks();
  }

  removeBookmark(articleId) {
    let bookmarks = this.getBookmarks();
    bookmarks = bookmarks.filter(b => b.articleId !== articleId);
    localStorage.setItem('codex-bookmarks', JSON.stringify(bookmarks));
    this.renderBookmarks();
  }

  renderBookmarks() {
    const bookmarks = this.getBookmarks();
    
    // Update Badge
    this.bookmarksBadgeEl.innerText = bookmarks.length;
    this.bookmarksBadgeEl.style.display = bookmarks.length === 0 ? 'none' : 'flex';
    
    this.bookmarksListEl.innerHTML = '';
    
    if (bookmarks.length === 0) {
      this.bookmarksListEl.innerHTML = '<li class="empty-state">No active bookmarks</li>';
      return;
    }
    
    bookmarks.forEach(b => {
      const li = document.createElement('li');
      
      const a = document.createElement('a');
      a.className = 'bookmark-link';
      a.innerText = b.title;
      a.title = `Saved on ${b.date} (${Math.round(b.scrollPercent)}% read)`;
      a.addEventListener('click', () => {
        window.location.hash = `#/article/${b.articleId}?scroll=${b.scrollPercent}`;
        this.bookmarksDropdown.classList.add('hidden');
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-bookmark-btn';
      removeBtn.innerHTML = '<i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeBookmark(b.articleId);
      });
      
      li.appendChild(a);
      li.appendChild(removeBtn);
      this.bookmarksListEl.appendChild(li);
    });
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}
