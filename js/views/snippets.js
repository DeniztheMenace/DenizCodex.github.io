/**
 * Snippets View Renderer
 * Renders a full-width grid of interactive 3D flippable index cards.
 */

export function renderSnippets(app, article, targetScroll) {
  app.reader.clearReaderState();
  app.reader.setupArticle(article.id, article.title, targetScroll);
  
  const container = app.reader.pageContentEl;
  container.innerHTML = `
    <div class="loading-state">
      Assembling scrolls...
    </div>
  `;

  fetch(article.contentFile)
    .then(res => {
      if (!res.ok) throw new Error('Snippets file not found');
      return res.json();
    })
    .then(cards => {
      container.innerHTML = `
        <div class="snippets-grid-container fade-in">
          <h1>${article.title}</h1>
          <p class="no-indent" style="text-align: center; font-style: italic; color: var(--color-text-muted); margin-bottom: 2rem;">
            Click on any card below to unveil the historical chronicle recorded on its reverse side.
          </p>
          
          <div class="snippets-grid-layout" id="snippets-grid">
            <!-- Cards injected dynamically -->
          </div>

          <div class="add-bookmark-container">
            <button id="btn-save-progress" class="add-bookmark-btn">
              <i data-lucide="bookmark"></i> Bookmark Chapter
            </button>
          </div>
        </div>
      `;

      const grid = document.getElementById('snippets-grid');

      document.getElementById('btn-save-progress').addEventListener('click', () => {
        app.reader.saveActiveBookmark();
      });

      cards.forEach(card => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'snippet-card-wrapper';
        cardWrapper.innerHTML = `
          <div class="snippet-card">
            <!-- Front Face -->
            <div class="card-face card-front">
              <i data-lucide="${card.icon || 'help-circle'}"></i>
              <h3>${card.title}</h3>
              <span style="font-size: 11px; color: var(--color-gold); font-family: var(--font-sans); font-weight: bold; margin-top: 10px;">Unveil Log</span>
            </div>
            <!-- Back Face -->
            <div class="card-face card-back">
              <span class="card-tag">${card.tag}</span>
              <p>${card.text}</p>
            </div>
          </div>
        `;

        // Flip trigger click event
        cardWrapper.addEventListener('click', () => {
          cardWrapper.classList.toggle('flipped');
        });

        grid.appendChild(cardWrapper);
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
          <h2>Chronicles Obscured</h2>
          <p style="margin-top: 10px; color: var(--color-text-muted);">Failed to retrieve snippets: ${err.message}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    });
}
