/**
 * Historic Splice View Renderer
 * Displays high-resolution historic image with subtle, unnumbered hotspots,
 * followed by Points of Interest, an interactive Zoomable Google Map with dedicated + / - controls,
 * and a centered Bookmark Entry section underneath the entire entry.
 * Features in-memory caching for 0ms instantaneous navigation.
 */

export function renderHistoricSplice(app, article, targetScroll) {
  app.reader.clearReaderState();
  app.reader.setupArticle(article.id, article.title, targetScroll);

  const container = app.reader.pageContentEl;

  const renderContent = (data) => {
    const mapHtml = data.coordinates ? `
      <div class="splice-map-box">
        <div class="splice-map-header">
          <div class="map-title-group">
            <i data-lucide="map-pin" class="map-icon"></i>
            <span class="map-heading">Location Coordinates</span>
          </div>
          <div class="map-zoom-controls">
            <button id="btn-map-zoom-out" class="map-ctrl-btn" title="Zoom out (−)" aria-label="Zoom out">
              <i data-lucide="minus"></i>
            </button>
            <button id="btn-map-zoom-in" class="map-ctrl-btn" title="Zoom in (+)" aria-label="Zoom in">
              <i data-lucide="plus"></i>
            </button>
          </div>
        </div>
        <div class="splice-map-frame">
          <iframe 
            id="splice-map-iframe"
            width="100%" 
            height="260" 
            frameborder="0" 
            style="border: 0; display: block;"
            src="https://maps.google.com/maps?q=${encodeURIComponent(data.coordinates)}&hl=en&z=15&output=embed"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="splice-view-wrapper fade-in">
        <div class="splice-container">
          <!-- Left Column: Visual Media (Sticky) -->
          <div class="splice-media-column">
            <div class="splice-media-inner">
              <img src="${data.image}" id="splice-image" alt="${article.title}" draggable="false" decoding="async">
              <div id="hotspots-overlay" class="hotspots-overlay"></div>
            </div>
          </div>

          <!-- Right Column: Text, Points of Interest & Location -->
          <div class="splice-info-column">
            <header class="splice-header">
              <h1 class="splice-title">${article.title}</h1>
              <div class="splice-meta">
                <span>By ${article.author || 'Deniz'}</span>
                <span>•</span>
                <span>${article.date}</span>
              </div>
            </header>

            <div class="splice-text-intro">
              <p>${data.intro}</p>
            </div>
            
            <!-- Points of Interest directly following description -->
            <div class="poi-section-header">
              <div class="poi-title-group">
                <i data-lucide="compass" class="poi-icon"></i>
                <h2 class="poi-heading">Points of Interest</h2>
              </div>
            </div>
            
            <div class="splice-annotation-list" id="annotations-list">
              <!-- Injected cards -->
            </div>

            <!-- Interactive Zoomable Google Map situated neatly under POIs -->
            ${mapHtml}
          </div>
        </div>

        <!-- Centered Bookmark Entry under the entire layout -->
        <div class="add-bookmark-container splice-bookmark-centered">
          <button id="btn-save-progress" class="add-bookmark-btn">
            <i data-lucide="bookmark"></i> Bookmark Entry
          </button>
        </div>
      </div>
    `;

    const overlay = document.getElementById('hotspots-overlay');
    const list = document.getElementById('annotations-list');

    document.getElementById('btn-save-progress').addEventListener('click', () => {
      app.reader.saveActiveBookmark();
    });

    // Inject non-intrusive hotspots and cards
    if (data.annotations && data.annotations.length > 0) {
      data.annotations.forEach((anno) => {
        // Hotspot DOT (non-intrusive, unnumbered)
        if (overlay) {
          const dot = document.createElement('div');
          dot.className = 'image-hotspot';
          dot.id = `hotspot-${anno.id}`;
          dot.style.left = `${anno.x}%`;
          dot.style.top = `${anno.y}%`;
          dot.title = anno.title;
          overlay.appendChild(dot);

          dot.addEventListener('mouseenter', () => activate(anno.id));
          dot.addEventListener('mouseleave', () => deactivate(anno.id));
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            data.annotations.forEach(a => deactivate(a.id));
            activate(anno.id);
            const card = document.getElementById(`annotation-card-${anno.id}`);
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }

        // Details CARD (clean, unnumbered)
        if (list) {
          const card = document.createElement('div');
          card.className = 'splice-annotation';
          card.id = `annotation-card-${anno.id}`;
          card.innerHTML = `
            <h3>${anno.title}</h3>
            <p>${anno.text}</p>
          `;
          list.appendChild(card);

          card.addEventListener('mouseenter', () => activate(anno.id));
          card.addEventListener('mouseleave', () => deactivate(anno.id));
          card.addEventListener('click', (e) => {
            e.stopPropagation();
            data.annotations.forEach(a => deactivate(a.id));
            activate(anno.id);
          });
        }
      });
    }

    function activate(id) {
      const d = document.getElementById(`hotspot-${id}`);
      const c = document.getElementById(`annotation-card-${id}`);
      if (d) d.classList.add('active');
      if (c) c.classList.add('active');
    }

    function deactivate(id) {
      const d = document.getElementById(`hotspot-${id}`);
      const c = document.getElementById(`annotation-card-${id}`);
      if (d) d.classList.remove('active');
      if (c) c.classList.remove('active');
    }

    // Map Zoom In / Zoom Out Controls
    let mapZoom = 15;
    const mapIframe = document.getElementById('splice-map-iframe');
    const btnZoomIn = document.getElementById('btn-map-zoom-in');
    const btnZoomOut = document.getElementById('btn-map-zoom-out');

    function updateMapZoom(newZoom) {
      mapZoom = Math.max(10, Math.min(19, newZoom));
      if (mapIframe && data.coordinates) {
        mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(data.coordinates)}&hl=en&z=${mapZoom}&output=embed`;
      }
    }

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.preventDefault();
        updateMapZoom(mapZoom + 1);
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.preventDefault();
        updateMapZoom(mapZoom - 1);
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Check and restore scroll
    app.reader.checkAndRestoreScroll();
  };

  // 1. Instant rendering from in-memory cache
  if (app.contentCache && app.contentCache.has(article.contentFile)) {
    renderContent(app.contentCache.get(article.contentFile));
    return;
  }

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
      if (app.contentCache) {
        app.contentCache.set(article.contentFile, data);
      }
      renderContent(data);
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
