/**
 * Reader Component
 * Handles scroll progress calculations, top progress bar updates,
 * scroll level restoration for bookmarks, and clean-up of article states.
 */

export class Reader {
  constructor(app) {
    this.app = app;
    this.progressBar = document.getElementById('reading-progress-bar');
    this.pageContentEl = document.getElementById('page-content');
    
    this.activeArticleId = null;
    this.activeArticleTitle = '';
    this.restorePercentage = null;

    this.init();
  }

  init() {
    // Window scroll events for progress bar
    window.addEventListener('scroll', () => this.handleScroll());
  }

  setupArticle(articleId, title, restorePercentage = null) {
    this.activeArticleId = articleId;
    this.activeArticleTitle = title;
    this.restorePercentage = restorePercentage;

    // Reset progress bar on load
    this.progressBar.style.width = '0%';
  }

  handleScroll() {
    // If not reading a specific article, keep progress hidden/zero
    if (!this.activeArticleId) {
      this.progressBar.style.width = '0%';
      return;
    }

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
      this.progressBar.style.width = '0%';
      return;
    }

    const scrollPercent = (window.scrollY / scrollHeight) * 100;
    this.progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
  }

  /**
   * Restores the page scroll to the exact bookmark depth.
   * Runs inside a short timeout to guarantee page render height has initialized.
   */
  checkAndRestoreScroll() {
    if (this.restorePercentage === null) return;
    
    const percentage = parseFloat(this.restorePercentage);
    this.restorePercentage = null; // Clear trigger

    setTimeout(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrollToY = (percentage / 100) * scrollHeight;
        window.scrollTo({
          top: scrollToY,
          behavior: 'smooth'
        });
      }
    }, 150);
  }

  saveActiveBookmark() {
    if (!this.activeArticleId) return;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;

    this.app.header.addBookmark(this.activeArticleId, this.activeArticleTitle, scrollPercent);
  }

  clearReaderState() {
    this.activeArticleId = null;
    this.activeArticleTitle = '';
    this.restorePercentage = null;
    this.progressBar.style.width = '0%';
    window.scrollTo(0, 0); // Jump back to top on route change
  }
}
