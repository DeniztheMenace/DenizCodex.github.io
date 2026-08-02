/**
 * Historic Splice View Renderer
 * Displays an interactive image with coordinate-based hotspots on the left side (sticky),
 * and detailed scrolling annotated facts on the right side.
 */

export function renderHistoricSplice(app, article, targetScroll) {
  app.reader.clearReaderState();
  app.reader.setupArticle(article.id, article.title, targetScroll);

  const container = app.reader.pageContentEl;
  container.innerHTML = `
    <div class="loading-state">
      Restoring archives...
    </div>
  `;

  fetch(article.contentFile)
    .then(res => {
      if (!res.ok) throw new Error('Splice data file not found');
      return res.json();
    })
    .then(data => {
      const mapHtml = data.coordinates ? `
        <div class="splice-map-container" style="margin-top: 2rem; border-top: 1px dashed var(--border-antique); padding-top: 1rem;">
          <h2 style="font-size: 1.15rem; margin-bottom: 1rem; text-align: left;">
            <i data-lucide="map-pin"></i> Location Coordinates
          </h2>
          <iframe 
            width="100%" 
            height="300" 
            frameborder="0" 
            style="border: 1px solid var(--border-antique); border-radius: 4px;"
            src="https://maps.google.com/maps?q=${encodeURIComponent(data.coordinates)}&hl=en&z=14&output=embed">
          </iframe>
        </div>
      ` : '';

      container.innerHTML = `
        <div class="splice-container fade-in">
          <!-- Left sticky photo panel -->
          <div class="splice-media-column">
            <div class="splice-media-inner">
              <img src="${data.image}" id="splice-image" alt="${article.title}">
              <div id="hotspots-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                <!-- Dynamic hotspot dots -->
              </div>
              <span class="zoom-hint">Hover dots to inspect details</span>
            </div>
          </div>

          <!-- Right textual details panel -->
          <div class="splice-info-column">
            <h1 style="text-align: left; font-size: 1.8rem; margin-bottom: 1.2rem;">${article.title}</h1>
            <div class="splice-text-intro">
              <p>${data.intro}</p>
            </div>
            
            <h2 style="font-size: 1.15rem; border-bottom: 1px dashed var(--border-antique); padding-bottom: 6px; margin-top: 1rem; margin-bottom: 1.2rem; text-align: left;">POI</h2>
            
            <div class="splice-annotation-list" id="annotations-list">
              <!-- Injected cards -->
            </div>

            ${mapHtml}

            <div class="add-bookmark-container" style="justify-content: flex-start; margin-top: 2rem;">
              <button id="btn-save-progress" class="add-bookmark-btn">
                <i data-lucide="bookmark"></i> Bookmark Chapter
              </button>
            </div>
          </div>
        </div>
      `;

      const overlay = document.getElementById('hotspots-overlay');
      const list = document.getElementById('annotations-list');

      document.getElementById('btn-save-progress').addEventListener('click', () => {
        app.reader.saveActiveBookmark();
      });

      // Inject hotspots and cards
      data.annotations.forEach(anno => {
        // Hotspot DOT
        const dot = document.createElement('div');
        dot.className = 'image-hotspot';
        dot.id = `hotspot-${anno.id}`;
        dot.style.left = `${anno.x}%`;
        dot.style.top = `${anno.y}%`;
        dot.title = anno.title;
        overlay.appendChild(dot);

        // Details CARD
        const card = document.createElement('div');
        card.className = 'splice-annotation';
        card.id = `annotation-card-${anno.id}`;
        card.innerHTML = `
          <h3>${anno.title}</h3>
          <p>${anno.text}</p>
        `;
        list.appendChild(card);

        // INTERACTIONS:
        
        // Hover Hotspot -> Highlight Card
        dot.addEventListener('mouseenter', () => activate(anno.id));
        dot.addEventListener('mouseleave', () => deactivate(anno.id));

        // Hover Card -> Highlight Hotspot
        card.addEventListener('mouseenter', () => activate(anno.id));
        card.addEventListener('mouseleave', () => deactivate(anno.id));

        // Click Hotspot -> Scroll Card into viewport
        dot.addEventListener('click', () => {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      });

      function activate(id) {
        const d = document.getElementById(`hotspot-${id}`);
        const c = document.getElementById(`annotation-card-${id}`);
        if (d) {
          d.style.transform = 'translate(-50%, -50%) scale(1.3)';
          d.style.backgroundColor = 'var(--color-gold-bright)';
        }
        if (c) c.classList.add('active');
      }

      function deactivate(id) {
        const d = document.getElementById(`hotspot-${id}`);
        const c = document.getElementById(`annotation-card-${id}`);
        if (d) {
          d.style.transform = '';
          d.style.backgroundColor = '';
        }
        if (c) c.classList.remove('active');
      }

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
          <h2>Visual Record Interrupted</h2>
          <p style="margin-top: 10px; color: var(--color-text-muted);">Failed to load visual records: ${err.message}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    });
}
