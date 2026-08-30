import { parseMarkdown } from '../markdown.js';

/**
 * Thinktank View Renderer
 * Loads and renders long-form essays in a single-column, highly legible reading layout.
 */
export function renderThinkTank(app, article, targetScroll) {
  app.reader.clearReaderState();
  app.reader.setupArticle(article.id, article.title, targetScroll);

  const container = app.reader.pageContentEl;
  container.innerHTML = `
    <div class="loading-state">
      Unrolling manuscript scroll...
    </div>
  `;

  fetch(article.contentFile)
    .then(res => {
      if (!res.ok) throw new Error('Manuscript file not found');
      return res.text();
    })
    .then(markdown => {
      const htmlContent = parseMarkdown(markdown);

      container.innerHTML = `
        <div class="readable-column fade-in">
          <header class="article-header">
            <h1>${article.title}</h1>
            <div class="article-meta">By ${article.author || 'Anonymous'} • Published ${article.date}</div>
          </header>
          
          <div class="article-body">
            ${htmlContent}
          </div>
          
          <div class="add-bookmark-container">
            <button id="btn-save-progress" class="add-bookmark-btn">
              <i data-lucide="bookmark"></i> Bookmark Entry
            </button>
          </div>
        </div>
      `;

      // Event listener for progress bookmarking
      document.getElementById('btn-save-progress').addEventListener('click', () => {
        app.reader.saveActiveBookmark();
      });

      // Smooth scrolling for footnote references and back-references
      container.querySelectorAll('.footnote-ref, .footnote-backref').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').replace(/^#/, '');
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.classList.add('footnote-target-highlight');
            setTimeout(() => targetEl.classList.remove('footnote-target-highlight'), 2000);
          }
        });
      });

      if (window.lucide) {
        window.lucide.createIcons();
      }

      // Check and restore scroll
      app.reader.checkAndRestoreScroll();
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `
        <div class="error-state">
          <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--color-accent); margin-bottom: 15px; display: inline-block;"></i>
          <h2>Manuscript Lost</h2>
          <p style="margin-top: 10px; color: var(--color-text-muted);">The script could not be retrieved from the archives: ${err.message}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    });
}
