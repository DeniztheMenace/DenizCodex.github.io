import { Header } from './components/header.js';
import { Reader } from './components/reader.js';
import { renderThinkTank } from './views/thinktank.js';
import { renderHistoricSplice } from './views/historicSplice.js';

/**
 * Helper to render an article card consistently across landing, category, and search views
 */
function renderArticleCard(art, categories) {
  const category = categories.find(c => c.id === art.category);
  const catName = category ? category.name : 'Entry';
  const catIcon = category ? (category.icon || 'book-open') : 'feather';
  const coverImage = art.image || 'assets/parchment-texture.png';

  const readTimeBadge = (art.category !== 'historic-splice' && art.readTime)
    ? `<span class="card-read-time">
         <i data-lucide="clock" class="read-time-icon"></i>
         ${art.readTime}
       </span>`
    : '';

  return `
    <div class="activity-card" onclick="window.location.hash='#/article/${art.id}'">
      <div class="activity-card-media">
        <img src="${coverImage}" alt="${art.title}" class="activity-card-thumb" loading="lazy" decoding="async" />
        ${readTimeBadge}
      </div>
      <div class="activity-card-content">
        <div class="activity-card-header">
          <span class="card-category-tag">
            <i data-lucide="${catIcon}" class="card-cat-icon"></i>
            ${catName}
          </span>
          <span class="card-date">${art.date}</span>
        </div>
        <div class="activity-card-body">
          <h3>${art.title}</h3>
          <p>${art.summary}</p>
        </div>
        <div class="activity-card-footer">
          <span class="card-author">By ${art.author}</span>
          <span class="card-footer-link">Read Entry <i data-lucide="arrow-right" class="card-arrow-icon"></i></span>
        </div>
      </div>
    </div>
  `;
}

class CodexApp {
  constructor() {
    this.categories = [];
    this.articles = [];
    this.contentCache = new Map();

    // Core Layout Components
    this.header = new Header(this);
    this.reader = new Reader(this);

    this.searchQuery = '';
    this.init();
  }

  async init() {
    try {
      const [categoriesRes, articlesRes] = await Promise.all([
        fetch('data/categories.json'),
        fetch('data/articles.json')
      ]);

      if (!categoriesRes.ok || !articlesRes.ok) {
        throw new Error('Failed to load codex metadata');
      }

      this.categories = await categoriesRes.json();
      this.articles = await articlesRes.json();

      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();
    } catch (err) {
      console.error('Initialization error:', err);
      document.getElementById('page-content').innerHTML = `
        <div class="error-state">
          <h2 style="font-family: var(--font-title); color: var(--color-accent);">Codex Damaged</h2>
          <p style="color: var(--color-text-muted); margin-top: 10px;">The archives could not be loaded: ${err.message}</p>
        </div>
      `;
    }
  }

  handleRoute() {
    const hash = window.location.hash || '#/';

    // If it's an in-page footnote/anchor (e.g. #fn-1, #fnref-1), scroll smoothly and do NOT revert route
    if (!hash.startsWith('#/') && hash.length > 1) {
      const targetId = hash.substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('footnote-target-highlight');
        setTimeout(() => targetEl.classList.remove('footnote-target-highlight'), 2000);
      }
      return;
    }

    document.getElementById('search-input').value = '';
    this.searchQuery = '';

    const categoryMatch = hash.match(/^#\/category\/([^?]+)/);
    const articleMatch = hash.match(/^#\/article\/([^?]+)/);

    const queryParams = {};
    const urlParts = hash.split('?');
    if (urlParts.length > 1) {
      const pairs = urlParts[1].split('&');
      pairs.forEach(p => {
        const [k, v] = p.split('=');
        queryParams[k] = v;
      });
    }

    if (categoryMatch) {
      const categoryId = categoryMatch[1];
      this.showCategory(categoryId);
      this.header.renderCategories(this.categories, categoryId);
    } else if (articleMatch) {
      const articleId = articleMatch[1];
      const scrollPercent = queryParams['scroll'] || null;
      this.showArticle(articleId, scrollPercent);

      const article = this.articles.find(a => a.id === articleId);
      this.header.renderCategories(this.categories, article ? article.category : null);
    } else {
      this.showLanding();
      this.header.renderCategories(this.categories, null);
    }
  }

  showLanding() {
    this.reader.clearReaderState();
    const container = this.reader.pageContentEl;

    // 1. Compile Latest Activity cards (top 6 sorted chronologically)
    const recentArticles = [...this.articles]
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
      .slice(0, 6);

    const activityHtml = recentArticles.map(art => renderArticleCard(art, this.categories)).join('');

    // 2. Compile Explore Chapters (Streamlined Compact Codex Volumes)
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    let chaptersHtml = '';
    this.categories.forEach((cat, idx) => {
      const catArticles = this.articles.filter(a => a.category === cat.id);
      const catArticleCount = catArticles.length;
      const vol = romanNumerals[idx] || (idx + 1);

      chaptersHtml += `
        <div class="chapter-card-compact" onclick="window.location.hash='#/category/${cat.id}'">
          <div class="chapter-compact-icon">
            <i data-lucide="${cat.icon || 'book-open'}"></i>
          </div>
          <div class="chapter-compact-content">
            <div class="chapter-compact-meta">
              <span class="chapter-volume-tag">Vol. ${vol}</span>
              <span class="chapter-compact-count">${catArticleCount} ${catArticleCount === 1 ? 'entry' : 'entries'}</span>
            </div>
            <h3 class="chapter-compact-title">${cat.name}</h3>
            <p class="chapter-compact-desc">${cat.description}</p>
          </div>
          <div class="chapter-compact-arrow">
            <i data-lucide="arrow-right"></i>
          </div>
        </div>
      `;
    });

    // 3. Inject homepage DOM
    container.innerHTML = `
      <section class="landing-section fade-in">
        <div class="section-header-flex">
          <h2 class="section-title"><i data-lucide="clock"></i> Latest Activity</h2>
        </div>
        <div class="activity-grid">
          ${activityHtml}
        </div>
      </section>

      <section class="landing-section fade-in" style="margin-top: 3rem;">
        <div class="section-header-flex">
          <h2 class="section-title"><i data-lucide="library"></i> Explore Chapters</h2>
        </div>
        <div class="chapters-grid">
          ${chaptersHtml}
        </div>
      </section>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  showCategory(categoryId) {
    this.reader.clearReaderState();

    const category = this.categories.find(c => c.id === categoryId);
    if (!category) {
      this.showLanding();
      return;
    }

    const container = this.reader.pageContentEl;
    const catArticles = this.articles
      .filter(a => a.category === categoryId)
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));

    // ── Historic Splice: horizontal chronological timeline ──────────────────────────
    if (categoryId === 'historic-splice') {
      const yearMap = new Map();
      catArticles.forEach(art => {
        const y = art.year || 0;
        if (!yearMap.has(y)) yearMap.set(y, []);
        yearMap.get(y).push(art);
      });

      const sortedYears = [...yearMap.keys()].sort((a, b) => a - b);

      let pointsHtml = '';
      sortedYears.forEach(year => {
        const arts = yearMap.get(year);
        const yearLabel = year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
        const countBadge = arts.length > 1
          ? `<span class="tl-count">${arts.length}</span>`
          : '';

        const rowsHtml = arts.map(art => `
          <a href="#/article/${art.id}" class="tl-preview-row" onclick="event.stopPropagation()">
            <span class="tl-preview-row-title">${art.title}</span>
            <span class="tl-preview-row-meta">${art.date}</span>
          </a>
        `).join('');

        pointsHtml += `
          <div class="tl-point">
            <div class="tl-preview-card">
              <div class="tl-preview-card-header">${yearLabel} — ${arts.length} ${arts.length === 1 ? 'entry' : 'entries'}</div>
              <div class="tl-preview-rows">
                ${rowsHtml}
              </div>
            </div>
            <div class="tl-dot">
              ${countBadge}
            </div>
            <span class="tl-year">${yearLabel}</span>
          </div>
        `;
      });

      if (catArticles.length === 0) {
        pointsHtml = `<div class="empty-chapter-state">
          <i data-lucide="scroll" style="width:40px;height:40px;color:var(--color-gold);margin-bottom:12px;"></i>
          <p>Nothing here yet — entries will appear as they are written.</p>
        </div>`;
      }

      container.innerHTML = `
        <div class="fade-in" style="padding-bottom: 2rem;">
          <header class="article-header" style="margin-bottom: 2rem;">
            <div style="color: var(--color-gold); font-size: 2.5rem; margin-bottom: 15px; text-align: center;">
              <i data-lucide="${category.icon}" style="width: 48px; height: 48px;"></i>
            </div>
            <h1>${category.name}</h1>
            <p class="no-indent" style="text-align: center; font-style: italic; color: var(--color-text-muted); margin-top: 5px;">${category.description}</p>
          </header>

          <div class="timeline-scroll-wrapper">
            <div class="timeline-track">
              <div class="tl-line"></div>
              ${pointsHtml}
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('.tl-point').forEach(el => {
        const links = el.querySelectorAll('.tl-preview-row');
        if (links.length === 1) {
          el.addEventListener('click', (e) => {
            if (!e.target.closest('.tl-preview-row')) {
              window.location.hash = links[0].getAttribute('href');
            }
          });
        } else if (links.length > 1) {
          el.addEventListener('click', (e) => {
            if (!e.target.closest('.tl-preview-row')) {
              const wasActive = el.classList.contains('active');
              container.querySelectorAll('.tl-point.active').forEach(p => p.classList.remove('active'));
              if (!wasActive) el.classList.add('active');
            }
          });
        }
      });

      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // ── Default category listing ─────────────────────────────────────
    let listHtml = '';
    if (catArticles.length === 0) {
      listHtml = `<div class="empty-chapter-state">
          <i data-lucide="scroll" style="width:40px;height:40px;color:var(--color-gold);margin-bottom:12px;"></i>
          <p>Nothing here yet — entries will appear as they are written.</p>
        </div>`;
    } else {
      listHtml = catArticles.map(art => renderArticleCard(art, this.categories)).join('');
    }

    container.innerHTML = `
      <div class="fade-in">
        <header class="article-header" style="margin-bottom: 2.5rem;">
          <div style="color: var(--color-gold); font-size: 2.5rem; margin-bottom: 15px; text-align: center;">
            <i data-lucide="${category.icon}" style="width: 48px; height: 48px;"></i>
          </div>
          <h1>${category.name}</h1>
          <p class="no-indent" style="text-align: center; font-style: italic; color: var(--color-text-muted); margin-top: 5px;">${category.description}</p>
        </header>

        <section class="activity-grid" style="margin-top: 2rem;">
          ${listHtml}
        </section>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  showArticle(articleId, scrollPercent = null) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) {
      this.showLanding();
      return;
    }

    if (article.category === 'historic-splice') {
      renderHistoricSplice(this, article, scrollPercent);
    } else {
      renderThinkTank(this, article, scrollPercent);
    }
  }

  triggerSearch(query) {
    this.searchQuery = query;
    if (query === '') {
      this.handleRoute();
      return;
    }

    const matches = this.articles.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.summary.toLowerCase().includes(query)
    );

    const container = this.reader.pageContentEl;
    this.reader.clearReaderState();

    let resultsHtml = '';
    if (matches.length === 0) {
      resultsHtml = '<p style="text-align: center; font-style: italic; color: var(--color-text-muted); margin-top: 2rem;">No entries matched your search parameters.</p>';
    } else {
      resultsHtml = matches.map(art => renderArticleCard(art, this.categories)).join('');
    }

    container.innerHTML = `
      <div class="fade-in">
        <header class="article-header" style="margin-bottom: 2.5rem;">
          <h1>Search the Archives</h1>
          <p class="no-indent" style="text-align: center; font-style: italic; color: var(--color-text-muted); margin-top: 5px;">
            Search Query: "${query}" • Found ${matches.length} ${matches.length === 1 ? 'match' : 'matches'}.
          </p>
        </header>

        <section class="activity-grid" style="margin-top: 2rem;">
          ${resultsHtml}
        </section>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

window.app = new CodexApp();
export default window.app;
