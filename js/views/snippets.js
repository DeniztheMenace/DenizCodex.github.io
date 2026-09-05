/**
 * Snippets View Renderer
 * Manages the life moments gallery (photos and videos), interactive media lightbox,
 * media filter tabs, and the dedicated cinematic single-entry viewer.
 */

let activeLightboxSnippets = [];
let currentLightboxIndex = 0;
let lightboxKeyHandler = null;

/**
 * Initializes and manages the full-screen interactive media Lightbox
 */
export function openSnippetLightbox(app, snippets, index = 0) {
  activeLightboxSnippets = snippets;
  currentLightboxIndex = index;

  let lightbox = document.getElementById('snippets-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'snippets-lightbox';
    lightbox.className = 'snippets-lightbox';
    document.body.appendChild(lightbox);
  }

  updateLightboxContent(app);
  lightbox.classList.add('active');
  document.body.classList.add('lightbox-open');

  // Register keyboard shortcuts
  if (lightboxKeyHandler) {
    window.removeEventListener('keydown', lightboxKeyHandler);
  }
  lightboxKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeSnippetLightbox();
    } else if (e.key === 'ArrowRight') {
      navigateLightbox(app, 1);
    } else if (e.key === 'ArrowLeft') {
      navigateLightbox(app, -1);
    }
  };
  window.addEventListener('keydown', lightboxKeyHandler);
}

export function closeSnippetLightbox() {
  const lightbox = document.getElementById('snippets-lightbox');
  if (lightbox) {
    // Pause any playing video before closing
    const videoEl = lightbox.querySelector('video');
    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
    }
    lightbox.classList.remove('active');
  }
  document.body.classList.remove('lightbox-open');
  if (lightboxKeyHandler) {
    window.removeEventListener('keydown', lightboxKeyHandler);
    lightboxKeyHandler = null;
  }
}

function navigateLightbox(app, direction) {
  if (activeLightboxSnippets.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + direction + activeLightboxSnippets.length) % activeLightboxSnippets.length;
  updateLightboxContent(app);
}

function updateLightboxContent(app) {
  const lightbox = document.getElementById('snippets-lightbox');
  if (!lightbox) return;

  const item = activeLightboxSnippets[currentLightboxIndex];
  if (!item) return;

  const isVideo = item.mediaType === 'video' || (item.media && item.media.type === 'video');
  const videoSrc = item.videoSrc || (item.media && item.media.src) || '';
  const mediaImg = item.image || (item.media && item.media.src) || 'assets/parchment-texture.png';
  const posterImg = item.image || (item.media && item.media.poster) || '';

  const mediaMarkup = isVideo
    ? `
      <div class="lightbox-video-frame">
        <video id="lightbox-active-video" controls autoplay playsinline loop poster="${posterImg}">
          <source src="${videoSrc}" type="video/webm">
          <source src="${videoSrc}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    `
    : `
      <div class="lightbox-image-frame">
        <img src="${mediaImg}" alt="${item.title}" class="lightbox-main-img" />
      </div>
    `;

  const locationMarkup = item.location
    ? `<span class="lightbox-meta-tag"><i data-lucide="map-pin"></i> ${item.location}</span>`
    : '';

  const mediaTypeTag = isVideo
    ? `<span class="lightbox-meta-tag type-badge"><i data-lucide="film"></i> Video Clip</span>`
    : `<span class="lightbox-meta-tag type-badge"><i data-lucide="camera"></i> Photo Moment</span>`;

  lightbox.innerHTML = `
    <div class="lightbox-backdrop" id="lightbox-backdrop"></div>
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="${item.title}">
      <!-- Top Bar: Counter & Close -->
      <div class="lightbox-header">
        <div class="lightbox-counter">
          Moment ${currentLightboxIndex + 1} of ${activeLightboxSnippets.length}
        </div>
        <div class="lightbox-actions">
          <a href="#/article/${item.id}" class="lightbox-entry-btn" id="lightbox-open-entry">
            <i data-lucide="book-open"></i>
            <span>Full Story</span>
          </a>
          <button class="lightbox-close-btn" id="lightbox-close" aria-label="Close viewer" title="Close (Esc)">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>

      <!-- Center Media Presentation -->
      <div class="lightbox-body">
        ${activeLightboxSnippets.length > 1 ? `
          <button class="lightbox-nav-btn prev" id="lightbox-prev" aria-label="Previous moment" title="Previous (Left arrow)">
            <i data-lucide="chevron-left"></i>
          </button>
        ` : ''}

        <div class="lightbox-media-stage">
          ${mediaMarkup}
        </div>

        ${activeLightboxSnippets.length > 1 ? `
          <button class="lightbox-nav-btn next" id="lightbox-next" aria-label="Next moment" title="Next (Right arrow)">
            <i data-lucide="chevron-right"></i>
          </button>
        ` : ''}
      </div>

      <!-- Bottom Caption Bar -->
      <div class="lightbox-footer">
        <div class="lightbox-caption-main">
          <div class="lightbox-meta-row">
            ${mediaTypeTag}
            ${locationMarkup}
            <span class="lightbox-meta-tag date"><i data-lucide="calendar"></i> ${item.date}</span>
          </div>
          <h2 class="lightbox-title">${item.title}</h2>
          <p class="lightbox-summary">${item.summary || ''}</p>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  document.getElementById('lightbox-backdrop').addEventListener('click', closeSnippetLightbox);
  document.getElementById('lightbox-close').addEventListener('click', closeSnippetLightbox);

  const prevBtn = document.getElementById('lightbox-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(app, -1);
    });
  }

  const nextBtn = document.getElementById('lightbox-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(app, 1);
    });
  }

  const entryBtn = document.getElementById('lightbox-open-entry');
  if (entryBtn) {
    entryBtn.addEventListener('click', () => {
      closeSnippetLightbox();
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Renders the Snippets Category Gallery with Media Filter and Lightbox Triggers
 */
export function renderSnippetsCategory(app, category, catArticles) {
  app.reader.clearReaderState();
  const container = app.reader.pageContentEl;

  let currentFilter = 'all'; // 'all' | 'photo' | 'video'

  const renderGrid = () => {
    const filteredArticles = catArticles.filter(art => {
      if (currentFilter === 'all') return true;
      return art.mediaType === currentFilter;
    });

    const photoCount = catArticles.filter(a => a.mediaType === 'photo').length;
    const videoCount = catArticles.filter(a => a.mediaType === 'video').length;

    let cardsHtml = '';
    if (filteredArticles.length === 0) {
      cardsHtml = `
        <div class="empty-chapter-state">
          <i data-lucide="camera" style="width:40px;height:40px;color:var(--color-gold);margin-bottom:12px;"></i>
          <p>No moments found matching this filter.</p>
        </div>
      `;
    } else {
      cardsHtml = filteredArticles.map((art, idx) => {
        const isVideo = art.mediaType === 'video';
        const cover = art.image || 'assets/parchment-texture.png';
        const badge = isVideo
          ? `<span class="snippet-media-badge video"><i data-lucide="play"></i> Video ${art.readTime || ''}</span>`
          : `<span class="snippet-media-badge photo"><i data-lucide="camera"></i> Photo</span>`;

        const locationTag = art.location
          ? `<span class="snippet-loc"><i data-lucide="map-pin"></i> ${art.location}</span>`
          : '';

        return `
          <div class="snippet-card" data-snippet-id="${art.id}" data-index="${idx}">
            <div class="snippet-card-media">
              <img src="${cover}" alt="${art.title}" class="snippet-card-thumb" loading="lazy" decoding="async" />
              ${badge}
              ${isVideo ? '<div class="snippet-play-hover"><i data-lucide="play" class="play-hover-icon"></i></div>' : ''}
              <div class="snippet-overlay-gradient"></div>
              <div class="snippet-card-bottom-info">
                <span class="snippet-card-date">${art.date}</span>
                ${locationTag}
              </div>
            </div>
            <div class="snippet-card-content">
              <h3 class="snippet-card-title">${art.title}</h3>
              <p class="snippet-card-summary">${art.summary}</p>
              <div class="snippet-card-footer">
                <span class="snippet-action-btn">
                  <i data-lucide="${isVideo ? 'play' : 'maximize-2'}"></i> ${isVideo ? 'Watch' : 'View'}
                </span>
                <a href="#/article/${art.id}" class="snippet-story-link" onclick="event.stopPropagation()">
                  Story <i data-lucide="arrow-right"></i>
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="fade-in snippets-category-wrapper">
        <header class="article-header" style="margin-bottom: 2rem;">
          <div style="color: var(--color-gold); font-size: 2.5rem; margin-bottom: 12px; text-align: center;">
            <i data-lucide="film" style="width: 48px; height: 48px;"></i>
          </div>
          <h1>${category.name}</h1>
          <p class="no-indent" style="text-align: center; font-style: italic; color: var(--color-text-muted); margin-top: 5px;">
            ${category.description || 'Moments from my life captured in photographs and moving pictures.'}
          </p>
        </header>

        <!-- Media Filter Bar -->
        <div class="snippets-filter-bar">
          <button class="snippet-filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
            <i data-lucide="layout-grid"></i>
            <span>All Moments (${catArticles.length})</span>
          </button>
          <button class="snippet-filter-btn ${currentFilter === 'photo' ? 'active' : ''}" data-filter="photo">
            <i data-lucide="camera"></i>
            <span>Photographs (${photoCount})</span>
          </button>
          <button class="snippet-filter-btn ${currentFilter === 'video' ? 'active' : ''}" data-filter="video">
            <i data-lucide="film"></i>
            <span>Videos (${videoCount})</span>
          </button>
        </div>

        <!-- Grid -->
        <div class="snippets-grid">
          ${cardsHtml}
        </div>
      </div>
    `;

    // Attach click listeners to cards to open Lightbox
    container.querySelectorAll('.snippet-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-snippet-id');
        const targetIndex = filteredArticles.findIndex(a => a.id === id);
        if (targetIndex !== -1) {
          openSnippetLightbox(app, filteredArticles, targetIndex);
        }
      });
    });

    // Attach filter listeners
    container.querySelectorAll('.snippet-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        if (filter !== currentFilter) {
          currentFilter = filter;
          renderGrid();
        }
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  renderGrid();
}

/**
 * Dedicated single-entry viewer when visiting #/article/<snippet-id>
 */
export function renderSnippet(app, article, targetScroll) {
  app.reader.clearReaderState();
  app.reader.setupArticle(article.id, article.title, targetScroll);

  const container = app.reader.pageContentEl;

  const renderContent = (data) => {
    const isVideo = article.mediaType === 'video' || (data.media && data.media.type === 'video');
    const videoSrc = article.videoSrc || (data.media && data.media.src) || '';
    const posterImg = article.image || (data.media && data.media.poster) || '';
    const photoImg = article.image || (data.media && data.media.src) || 'assets/parchment-texture.png';

    const mediaStageHtml = isVideo
      ? `
        <div class="snippet-detail-theater video-theater">
          <video controls playsinline loop poster="${posterImg}" class="snippet-detail-video">
            <source src="${videoSrc}" type="video/webm">
            <source src="${videoSrc}" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
        </div>
      `
      : `
        <div class="snippet-detail-theater photo-theater" id="btn-zoom-photo" title="Click to view full screen">
          <img src="${photoImg}" alt="${article.title}" class="snippet-detail-photo" />
          <div class="snippet-theater-tag"><i data-lucide="camera"></i> 35mm Plate</div>
          <div class="snippet-zoom-hint"><i data-lucide="maximize-2"></i> Click to Expand</div>
        </div>
      `;

    // Metadata pills
    const meta = data.metadata || {};
    let metaItemsHtml = '';
    if (article.location || meta.location) {
      metaItemsHtml += `
        <div class="snippet-meta-card">
          <i data-lucide="map-pin"></i>
          <div>
            <span class="meta-label">Location</span>
            <span class="meta-val">${article.location || meta.location}</span>
          </div>
        </div>
      `;
    }
    if (meta.time) {
      metaItemsHtml += `
        <div class="snippet-meta-card">
          <i data-lucide="clock"></i>
          <div>
            <span class="meta-label">Time & Light</span>
            <span class="meta-val">${meta.time}</span>
          </div>
        </div>
      `;
    }
    if (meta.format) {
      metaItemsHtml += `
        <div class="snippet-meta-card">
          <i data-lucide="aperture"></i>
          <div>
            <span class="meta-label">Optics & Format</span>
            <span class="meta-val">${meta.format}</span>
          </div>
        </div>
      `;
    }
    if (meta.soundscape) {
      metaItemsHtml += `
        <div class="snippet-meta-card">
          <i data-lucide="volume-2"></i>
          <div>
            <span class="meta-label">Atmosphere</span>
            <span class="meta-val">${meta.soundscape}</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="snippet-detail-wrapper fade-in">
        <!-- Breadcrumb / Back Link -->
        <div class="snippet-back-bar">
          <a href="#/category/snippets" class="snippet-back-link">
            <i data-lucide="arrow-left"></i> Return to Snippets Gallery
          </a>
        </div>

        <!-- Header -->
        <header class="snippet-detail-header">
          <span class="snippet-volume-badge">Moment Archive</span>
          <h1 class="snippet-detail-title">${article.title}</h1>
          <div class="snippet-detail-meta">
            <span>By ${article.author || 'Deniz'}</span>
            <span>•</span>
            <span>${article.date}</span>
            ${article.location ? `<span>•</span><span><i data-lucide="map-pin" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;"></i> ${article.location}</span>` : ''}
          </div>
        </header>

        <!-- Visual / Video Hero Media -->
        ${mediaStageHtml}

        <!-- Contextual Metadata Grid -->
        ${metaItemsHtml ? `<div class="snippet-metadata-grid">${metaItemsHtml}</div>` : ''}

        <!-- Reflective Journal Column -->
        <article class="snippet-journal-section">
          <div class="snippet-journal-body">
            <p>${data.journal || article.summary}</p>
          </div>
        </article>

        <!-- Save Bookmark Button -->
        <div class="add-bookmark-container" style="margin-top: 3rem;">
          <button id="btn-save-progress" class="add-bookmark-btn">
            <i data-lucide="bookmark"></i> Bookmark Moment
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-save-progress').addEventListener('click', () => {
      app.reader.saveActiveBookmark();
    });

    const zoomPhotoBtn = document.getElementById('btn-zoom-photo');
    if (zoomPhotoBtn) {
      zoomPhotoBtn.addEventListener('click', () => {
        openSnippetLightbox(app, [article], 0);
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }

    app.reader.checkAndRestoreScroll();
  };

  // Check cache
  if (app.contentCache && app.contentCache.has(article.contentFile)) {
    renderContent(app.contentCache.get(article.contentFile));
    return;
  }

  container.innerHTML = `
    <div class="loading-state">
      Developing film archives...
    </div>
  `;

  fetch(article.contentFile)
    .then(res => {
      if (!res.ok) throw new Error('Snippet data file not found');
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
          <h2>Archive Unavailable</h2>
          <p style="margin-top: 10px; color: var(--color-text-muted);">${err.message}</p>
          <a href="#/category/snippets" style="display:inline-block; margin-top:1rem; color:var(--color-gold);">← Return to Snippets Gallery</a>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    });
}
