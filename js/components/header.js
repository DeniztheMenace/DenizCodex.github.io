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
    this.searchToggleBtn = document.getElementById('btn-toggle-search');
    this.searchDropdown = document.getElementById('search-dropdown');
    this.mobileSearchInputEl = document.getElementById('mobile-search-input');
    
    // Toggles
    this.bookmarksToggleBtn = document.getElementById('btn-toggle-bookmarks');
    this.bookmarksDropdown = document.getElementById('bookmarks-dropdown');
    this.bookmarkCurrentBtn = document.getElementById('btn-bookmark-current');
    
    this.settingsToggleBtn = document.getElementById('btn-toggle-settings');
    this.settingsDropdown = document.getElementById('settings-dropdown');
    
    // Themes
    this.themeParchmentBtn = document.getElementById('btn-theme-parchment');
    this.themeInkwellBtn = document.getElementById('btn-theme-inkwell');
    this.themeEspressoBtn = document.getElementById('btn-theme-espresso');
    
    // Font controls
    this.fontDecBtn = document.getElementById('btn-font-dec');
    this.fontIncBtn = document.getElementById('btn-font-inc');
    
    // Mobile Navigation
    this.mobileMenuBtn = document.getElementById('btn-mobile-menu');
    this.mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    this.mobileNavEl = document.getElementById('mobile-categories-nav-list');
    
    this.init();
  }

  init() {
    // Mobile menu toggle
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileMenu();
      });
    }

    // Search dropdown toggle (Mobile)
    if (this.searchToggleBtn) {
      this.searchToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = this.searchDropdown.classList.contains('hidden');
        this.searchDropdown.classList.toggle('hidden');
        this.bookmarksDropdown.classList.add('hidden');
        this.settingsDropdown.classList.add('hidden');
        this.closeMobileMenu();
        if (willOpen && this.mobileSearchInputEl) {
          setTimeout(() => this.mobileSearchInputEl.focus(), 50);
        }
      });
    }

    // Dropdown toggles
    this.bookmarksToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.bookmarksDropdown.classList.toggle('hidden');
      this.settingsDropdown.classList.add('hidden');
      if (this.searchDropdown) this.searchDropdown.classList.add('hidden');
      this.closeMobileMenu();
      this.updateBookmarkButtonState();
    });

    if (this.bookmarkCurrentBtn) {
      this.bookmarkCurrentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.app.reader.activeArticleId) {
          this.app.reader.saveActiveBookmark();
          this.bookmarkCurrentBtn.classList.add('saved');
          const originalText = this.bookmarkCurrentBtn.innerHTML;
          this.bookmarkCurrentBtn.innerHTML = '<i data-lucide="check"></i><span>Saved!</span>';
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => {
            this.bookmarkCurrentBtn.innerHTML = originalText;
            this.bookmarkCurrentBtn.classList.remove('saved');
            if (window.lucide) window.lucide.createIcons();
          }, 1500);
        }
      });
    }

    this.settingsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsDropdown.classList.toggle('hidden');
      this.bookmarksDropdown.classList.add('hidden');
      if (this.searchDropdown) this.searchDropdown.classList.add('hidden');
      this.closeMobileMenu();
    });

    // Close dropdowns & mobile drawer on outside clicks
    document.addEventListener('click', (e) => {
      if (this.searchDropdown && !this.searchDropdown.contains(e.target) && !this.searchToggleBtn.contains(e.target)) {
        this.searchDropdown.classList.add('hidden');
      }
      if (!this.bookmarksDropdown.contains(e.target) && !this.bookmarksToggleBtn.contains(e.target)) {
        this.bookmarksDropdown.classList.add('hidden');
      }
      if (!this.settingsDropdown.contains(e.target) && !this.settingsToggleBtn.contains(e.target)) {
        this.settingsDropdown.classList.add('hidden');
      }
      if (this.mobileNavDrawer && !this.mobileNavDrawer.contains(e.target) && !this.mobileMenuBtn.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Search inputs (Synchronized between desktop & mobile)
    if (this.searchInputEl) {
      this.searchInputEl.addEventListener('input', (e) => {
        if (this.mobileSearchInputEl) this.mobileSearchInputEl.value = e.target.value;
        this.handleSearch(e.target.value);
      });
    }
    if (this.mobileSearchInputEl) {
      this.mobileSearchInputEl.addEventListener('input', (e) => {
        if (this.searchInputEl) this.searchInputEl.value = e.target.value;
        this.handleSearch(e.target.value);
      });
    }

    // Themes
    if (this.themeParchmentBtn) this.themeParchmentBtn.addEventListener('click', () => this.setTheme('parchment'));
    if (this.themeInkwellBtn) this.themeInkwellBtn.addEventListener('click', () => this.setTheme('inkwell'));
    if (this.themeEspressoBtn) this.themeEspressoBtn.addEventListener('click', () => this.setTheme('espresso'));

    // Font Sizing
    this.fontDecBtn.addEventListener('click', () => this.adjustFontSize(-1));
    this.fontIncBtn.addEventListener('click', () => this.adjustFontSize(1));

    // Load defaults
    this.loadPreferences();
    this.renderBookmarks();
  }

  setTheme(theme) {
    document.body.classList.remove('parchment-theme', 'inkwell-theme', 'espresso-theme');
    if (this.themeParchmentBtn) this.themeParchmentBtn.classList.remove('active');
    if (this.themeInkwellBtn) this.themeInkwellBtn.classList.remove('active');
    if (this.themeEspressoBtn) this.themeEspressoBtn.classList.remove('active');

    if (theme === 'parchment') {
      document.body.classList.add('parchment-theme');
      if (this.themeParchmentBtn) this.themeParchmentBtn.classList.add('active');
      localStorage.setItem('codex-theme', 'parchment');
    } else if (theme === 'espresso') {
      document.body.classList.add('espresso-theme');
      if (this.themeEspressoBtn) this.themeEspressoBtn.classList.add('active');
      localStorage.setItem('codex-theme', 'espresso');
    } else {
      document.body.classList.add('inkwell-theme');
      if (this.themeInkwellBtn) this.themeInkwellBtn.classList.add('active');
      localStorage.setItem('codex-theme', 'inkwell');
    }
  }

  adjustFontSize(direction) {
    const computedStr = getComputedStyle(document.documentElement).fontSize || getComputedStyle(document.documentElement).getPropertyValue('--font-base-size');
    let currentSize = parseFloat(computedStr);
    if (isNaN(currentSize) || currentSize <= 0) {
      currentSize = window.innerWidth <= 480 ? 17 : 20;
    }
    const step = 1.5;
    let newSize = currentSize + (direction * step);
    newSize = Math.max(13, Math.min(28, Math.round(newSize * 2) / 2));
    this.setFontSize(newSize);
  }

  setFontSize(sizePx) {
    const sizeStr = `${sizePx}px`;
    document.documentElement.style.setProperty('--font-base-size', sizeStr);
    document.documentElement.style.fontSize = sizeStr;
    localStorage.setItem('codex-font-size', sizeStr);
    
    const indicator = document.getElementById('font-size-indicator');
    if (indicator) {
      indicator.innerText = sizeStr;
    }
  }

  loadPreferences() {
    const savedTheme = localStorage.getItem('codex-theme') || 'inkwell';
    this.setTheme(savedTheme);
    
    const savedSize = localStorage.getItem('codex-font-size');
    if (savedSize) {
      const parsed = parseFloat(savedSize);
      if (!isNaN(parsed)) {
        this.setFontSize(parsed);
      } else {
        this.setFontSize(20);
      }
    } else {
      const defaultSize = window.innerWidth <= 480 ? 17 : 20;
      this.setFontSize(defaultSize);
    }
  }

  toggleMobileMenu() {
    if (!this.mobileNavDrawer) return;
    const isHidden = this.mobileNavDrawer.classList.contains('hidden');
    if (isHidden) {
      this.mobileNavDrawer.classList.remove('hidden');
      this.bookmarksDropdown.classList.add('hidden');
      this.settingsDropdown.classList.add('hidden');
      if (this.mobileMenuBtn) this.mobileMenuBtn.classList.add('active');
    } else {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu() {
    if (this.mobileNavDrawer) {
      this.mobileNavDrawer.classList.add('hidden');
    }
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.classList.remove('active');
    }
  }

  renderCategories(categories, activeCategoryId) {
    this.navEl.innerHTML = '';
    if (this.mobileNavEl) this.mobileNavEl.innerHTML = '';
    
    // Add dynamic links to desktop and mobile nav
    categories.forEach(cat => {
      // Desktop link
      const li = document.createElement('li');
      if (cat.id === activeCategoryId) {
        li.className = 'active';
      }
      
      const a = document.createElement('a');
      a.href = `#/category/${cat.id}`;
      a.innerHTML = `<span>${cat.name}</span>`;
      li.appendChild(a);
      this.navEl.appendChild(li);

      // Mobile link
      if (this.mobileNavEl) {
        const mLi = document.createElement('li');
        if (cat.id === activeCategoryId) {
          mLi.className = 'active';
        }
        const mA = document.createElement('a');
        mA.href = `#/category/${cat.id}`;
        mA.className = 'mobile-nav-link';
        mA.innerHTML = `
          <i data-lucide="${cat.icon || 'book-open'}" class="mobile-nav-icon"></i>
          <span class="mobile-nav-text">${cat.name}</span>
        `;
        mA.addEventListener('click', () => this.closeMobileMenu());
        mLi.appendChild(mA);
        this.mobileNavEl.appendChild(mLi);
      }
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
      this.bookmarksListEl.innerHTML = `
        <li class="empty-state">
          <i data-lucide="bookmark" class="empty-icon"></i>
          <span>No bookmarks saved yet</span>
        </li>
      `;
      if (window.lucide) window.lucide.createIcons();
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

  updateBookmarkButtonState() {
    if (!this.bookmarkCurrentBtn) return;
    const isReadingArticle = Boolean(this.app.reader && this.app.reader.activeArticleId);
    this.bookmarkCurrentBtn.style.display = isReadingArticle ? 'flex' : 'none';
  }
}
