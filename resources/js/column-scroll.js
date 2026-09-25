import Lenis from 'lenis';

export default class ColumnScroll {
  constructor(container) {
    this.container = container;
    this.columns = [...container.querySelectorAll('.column')];
    // Index of the middle column (it gets the reverse-direction parallax)
    this.middleIndex = 1;
    // Per-column geometry, filled by computeColumnGeometry()
    this.columnData = [];
    this.scrollLimit = 1;

    this.projectItems = [...container.querySelectorAll('.column__item')];
    this.projectDetails = document.querySelector('.project-details');
    this.projectDetailsTitle = this.projectDetails.querySelector('.project-details__title');
    this.projectDetailsViewport = this.projectDetails.querySelector('.project-details__viewport');
    this.projectDetailsTrack = this.projectDetails.querySelector('.project-details__track');
    this.currentProjectMedia = [];
    this.projectDetailsDescription = this.projectDetails.querySelector(
      '.project-details__description'
    );
    this.projectDetailsClose = this.projectDetails.querySelector('.project-details__close');
    this.projectDetailsExternalLink = this.projectDetails.querySelector(
      '.project-details__external-link a'
    );
    // Scroll horizontal de la piste de médias (instancié à chaque ouverture)
    this.detailScroll = null;
    this.detailRaf = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Menu elements
    this.burgerMenu = document.getElementById('burger-menu');
    this.menuPanel = document.querySelector('.menu-panel');
    this.menuPanelClose = this.menuPanel.querySelector('.menu-panel__close');

    // State
    this.isGridView = true;
    this.currentProjectIndex = -1;

    // Initialize
    this.init();
    this.initProjectDetails();
    this.initSearch();
    this.initRouting();
  }

  init() {
    // Compute per-column geometry and the container scroll height
    this.computeColumnGeometry();

    // Initialize menu
    this.initMenu();

    // Initialize Lenis for smooth scrolling
    this.scroll = new Lenis({
      content: this.container,
      lerp: 0.2,
      duration: 1.2,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 2,
      infinite: false,
    });

    // Bounded parallax: each column reveals exactly its own content over the
    // full scroll. Side columns reveal top -> bottom, the middle column reverses
    // (bottom -> top). No column ever drifts past its content, so there are no
    // black gaps and the last images stay reachable at the end of the scroll.
    this.scroll.on('scroll', ({ scroll, limit }) => {
      this.scrollLimit = limit || this.scrollLimit;
      this.applyParallax(scroll, this.scrollLimit);
    });

    // Set up the animation frame for Lenis
    const raf = time => {
      this.scroll.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Apply the initial state right away (avoids a flash before the first scroll)
    this.applyParallax(0, this.scroll.limit || this.scrollLimit);

    // Image heights are only known once they load -> recompute then
    this.projectItems.forEach(item => {
      const img = item.querySelector('img');
      if (img && !img.complete) {
        img.addEventListener('load', () => this.refreshLayout());
      }
    });

    // Recompute on resize and once everything has settled
    window.addEventListener('resize', () => this.refreshLayout());
    window.addEventListener('load', () => this.refreshLayout());
    setTimeout(() => this.refreshLayout(), 500);
  }

  // Recompute geometry then re-apply the parallax for the current scroll position
  refreshLayout() {
    this.computeColumnGeometry();
    if (this.scroll) {
      this.scroll.resize();
      this.applyParallax(this.scroll.scroll || 0, this.scroll.limit || this.scrollLimit);
    }
  }

  initProjectDetails() {
    this.projectItems.forEach(item => {
      item.addEventListener('click', () => this.openProjectDetails(item));
    });

    if (this.projectDetailsClose) {
      this.projectDetailsClose.addEventListener('click', e => {
        e.stopPropagation();
        this.closeProjectDetails();
      });
    }

    // Un clic hors média (et hors lien externe) referme le projet
    this.projectDetails.addEventListener('click', e => {
      if (e.target.closest('.project-details__slide')) return;
      if (e.target.closest('.project-details__external-link')) return;
      this.closeProjectDetails();
    });

    document.addEventListener('keydown', e => {
      if (!this.projectDetails.classList.contains('active')) return;

      if (e.key === 'Escape') {
        this.closeProjectDetails();
        return;
      }

      // Les flèches font défiler la piste d'un média
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.stepTrack(e.key === 'ArrowRight' ? 1 : -1);
      }
    });
  }

  openProjectDetails(item, { push = true } = {}) {
    // Identify the clicked project, then populate the panel from its media data
    this.currentProjectIndex = this.projectItems.findIndex(p => p === item);
    this.loadProject(item, { push });

    // Show project details container
    this.projectDetails.classList.add('active');

    // Le scroll horizontal est monté à l'ouverture, une fois la piste remplie
    this.initTrackScroll();

    // Disable scrolling on body and Lenis scroll
    document.body.style.overflow = 'hidden';
    if (this.scroll) {
      this.scroll.stop();
    }

    // Hide the burger menu while the project is open (the × replaces it)
    if (this.burgerMenu) {
      this.burgerMenu.style.display = 'none';
    }

    // Idem pour la recherche : elle vise la grille, pas la fiche projet.
    // Le filtre en cours est conservé, on ne fait que masquer les contrôles.
    if (this.searchToggle) {
      this.searchToggle.style.display = 'none';
      this.searchToggle.setAttribute('aria-expanded', 'false');
    }
    if (this.searchPanel) {
      this.searchPanel.classList.remove('active');
    }

    // Set grid view state (fade-in is handled by CSS via the .active class)
    this.isGridView = false;
  }

  // Populate the panel from a grid item (used on open and when switching project)
  loadProject(item, { push = true } = {}) {
    if (push) {
      this.pushProjectUrl(item);
    }

    this.currentProjectMedia = JSON.parse(item.dataset.projectMedia || '[]');

    const title = item.dataset.projectTitle || '';
    this.projectDetailsTitle.textContent = title;

    const description = item.dataset.projectDescription || '';
    this.projectDetailsDescription.innerHTML = description;
    this.projectDetailsDescription.hidden = description.trim() === '';

    this.setExternalLink(item.dataset.externalLink);
    this.buildTrack(title);
  }

  setExternalLink(externalLink) {
    if (externalLink && externalLink.trim() !== '') {
      this.projectDetailsExternalLink.href = externalLink;
      this.projectDetailsExternalLink.parentElement.style.display = 'block';
    } else {
      this.projectDetailsExternalLink.href = '#';
      this.projectDetailsExternalLink.parentElement.style.display = 'none';
    }
  }

  // --- Piste de médias ------------------------------------------------------
  // Tous les médias du projet sont affichés en grand, alignés sur la hauteur,
  // et se parcourent à l'horizontale. Plus de vignette ni d'image principale.
  buildTrack(title) {
    const track = this.projectDetailsTrack;
    track.innerHTML = '';
    track.style.removeProperty('--slide-skew');
    this.projectDetails.classList.remove('is-revealed');

    this.currentProjectMedia.forEach((media, index) => {
      const slide = document.createElement('figure');
      slide.className = 'project-details__slide';
      // Sert au décalage en cascade de l'animation d'entrée
      slide.style.setProperty('--i', index);

      if (media && media.type === 'video') {
        const video = document.createElement('video');
        video.src = media.full || media.url;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.preload = 'metadata';
        slide.appendChild(video);
      } else if (media) {
        const img = document.createElement('img');
        img.src = media.full || media.url;
        img.alt = `${title} — ${index + 1}`;
        img.decoding = 'async';
        slide.appendChild(img);
      }

      track.appendChild(slide);
    });

    // Repart du début, puis déclenche l'arrivée des médias
    this.projectDetailsViewport.scrollLeft = 0;

    requestAnimationFrame(() => {
      this.projectDetails.classList.add('is-revealed');
      track.querySelectorAll('video').forEach(video => {
        const played = video.play();
        if (played && typeof played.catch === 'function') played.catch(() => {});
      });
    });
  }

  // Lenis en mode horizontal : la molette verticale pilote la piste, et
  // l'inertie donne le glissement des médias les uns après les autres.
  initTrackScroll() {
    this.destroyTrackScroll();

    this.detailScroll = new Lenis({
      wrapper: this.projectDetailsViewport,
      content: this.projectDetailsTrack,
      orientation: 'horizontal',
      gestureOrientation: 'both',
      lerp: this.prefersReducedMotion ? 1 : 0.085,
      wheelMultiplier: 1.35,
      touchMultiplier: 2,
      smoothWheel: !this.prefersReducedMotion,
      infinite: false,
    });

    // Le cisaillement suit la vitesse : les médias «traînent» quand ça défile
    this.detailScroll.on('scroll', ({ velocity }) => {
      if (this.prefersReducedMotion) return;
      const skew = Math.max(-5.5, Math.min(5.5, velocity * 0.14));
      this.projectDetailsTrack.style.setProperty('--slide-skew', `${skew.toFixed(2)}deg`);
    });

    const raf = time => {
      if (!this.detailScroll) return;
      this.detailScroll.raf(time);
      this.detailRaf = requestAnimationFrame(raf);
    };
    this.detailRaf = requestAnimationFrame(raf);
  }

  destroyTrackScroll() {
    if (this.detailRaf) {
      cancelAnimationFrame(this.detailRaf);
      this.detailRaf = null;
    }
    if (this.detailScroll) {
      this.detailScroll.destroy();
      this.detailScroll = null;
    }
  }

  // Avance ou recule d'un média (flèches du clavier)
  stepTrack(direction) {
    const slide = this.projectDetailsTrack.querySelector('.project-details__slide');
    if (!slide) return;

    const gap = parseFloat(window.getComputedStyle(this.projectDetailsTrack).columnGap) || 32;
    const step = slide.getBoundingClientRect().width + gap;

    if (this.detailScroll) {
      this.detailScroll.scrollTo(this.detailScroll.scroll + direction * step, { duration: 0.9 });
    } else {
      this.projectDetailsViewport.scrollBy({ left: direction * step, behavior: 'smooth' });
    }
  }

  // --- Recherche ------------------------------------------------------------
  // Filtre client sur titre + description : le catalogue est petit et déjà
  // entièrement dans le DOM, donc pas de requête serveur.
  initSearch() {
    this.searchToggle = document.getElementById('search-toggle');
    this.searchPanel = document.querySelector('.search-panel');
    if (!this.searchToggle || !this.searchPanel) return;

    this.searchInput = this.searchPanel.querySelector('.search-panel__input');
    this.searchEmpty = this.searchPanel.querySelector('.search-panel__empty');

    const normalize = value =>
      (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    // Index construit une fois : accents et casse neutralisés
    this.searchIndex = this.projectItems.map(item => ({
      item,
      haystack: normalize(
        `${item.dataset.projectTitle || ''} ${item.dataset.projectDescription || ''}`
      ),
    }));

    this.normalizeSearch = normalize;

    this.searchToggle.addEventListener('click', () => this.toggleSearch());
    this.searchInput.addEventListener('input', () => this.applySearch(this.searchInput.value));
    this.searchInput.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeSearch();
    });
  }

  toggleSearch() {
    this.searchPanel.classList.contains('active') ? this.closeSearch() : this.openSearch();
  }

  openSearch() {
    this.searchPanel.classList.add('active');
    this.searchToggle.classList.add('active');
    this.searchToggle.setAttribute('aria-expanded', 'true');
    this.searchInput.focus();
  }

  closeSearch() {
    this.searchPanel.classList.remove('active');
    this.searchToggle.classList.remove('active');
    this.searchToggle.setAttribute('aria-expanded', 'false');
    this.searchInput.value = '';
    this.applySearch('');
  }

  applySearch(value) {
    const query = this.normalizeSearch(value).trim();
    let visible = 0;

    this.searchIndex.forEach(({ item, haystack }) => {
      const match = query === '' || haystack.includes(query);
      item.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    });

    if (this.searchEmpty) {
      this.searchEmpty.hidden = visible > 0;
    }

    // Les colonnes ont changé de hauteur -> on recale le parallaxe et on
    // remonte en haut, sinon on reste bloqué hors de la nouvelle plage.
    this.refreshLayout();
    if (this.scroll) {
      this.scroll.scrollTo(0, { immediate: true });
    }
  }

  // --- Routing : une URL par projet -----------------------------------------
  // L'overlay reste rendu côté client ; seule l'URL est synchronisée, pour que
  // chaque projet soit partageable et compté séparément dans les stats.
  initRouting() {
    this.gridUrl = this.container.dataset.gridUrl || '/portfolio';

    window.addEventListener('popstate', event => {
      this.syncToSlug((event.state && event.state.project) || null);
    });

    // Arrivée directe sur /portfolio/<slug> : on ouvre le projet correspondant
    const initialSlug = this.container.dataset.activeProject;
    if (initialSlug) {
      const item = this.findItemBySlug(initialSlug);
      if (item) {
        window.history.replaceState({ project: initialSlug }, '', window.location.href);
        this.openProjectDetails(item, { push: false });
      }
    }
  }

  findItemBySlug(slug) {
    return this.projectItems.find(item => item.dataset.projectSlug === slug);
  }

  pushProjectUrl(item) {
    const url = item.dataset.projectUrl;
    const slug = item.dataset.projectSlug;
    if (!url || !slug) return;
    if (window.location.pathname === new URL(url, window.location.origin).pathname) return;

    window.history.pushState({ project: slug }, '', url);
  }

  // Applique l'état porté par l'URL (retour/avance navigateur)
  syncToSlug(slug) {
    if (!slug) {
      this.closeProjectDetails({ push: false });
      return;
    }

    const item = this.findItemBySlug(slug);
    if (!item) return;

    if (this.currentProjectIndex === -1) {
      this.openProjectDetails(item, { push: false });
    } else {
      this.currentProjectIndex = this.projectItems.indexOf(item);
      this.loadProject(item, { push: false });
    }
  }

  closeProjectDetails({ push = true } = {}) {
    if (this.currentProjectIndex === -1) return;

    if (push) {
      window.history.pushState({ project: null }, '', this.gridUrl);
    }

    // The fade-out is handled by CSS when the .active class is removed
    this.projectDetails.classList.remove('active');
    this.projectDetails.classList.remove('is-revealed');

    this.destroyTrackScroll();

    // Coupe les vidéos de la piste et vide le DOM après le fondu
    this.projectDetailsTrack.querySelectorAll('video').forEach(video => video.pause());
    window.setTimeout(() => {
      if (!this.projectDetails.classList.contains('active')) {
        this.projectDetailsTrack.innerHTML = '';
      }
    }, 500);

    // Re-enable scrolling on body
    document.body.style.overflow = '';

    // Restore the burger menu
    if (this.burgerMenu) {
      this.burgerMenu.style.display = '';
    }

    if (this.searchToggle) {
      this.searchToggle.style.display = '';
    }

    // Restart Lenis scroll
    if (this.scroll) {
      this.scroll.start();
      this.scroll.resize();
    }

    // Reset state
    this.isGridView = true;
    this.currentProjectIndex = -1;
  }

  returnToGrid() {
    // Use the same animation as closeProjectDetails
    this.closeProjectDetails();

    // Restore the scroll position and animation after the animation completes
    setTimeout(() => {
      // Update Lenis scroll
      this.scroll.resize();
    }, 1000); // Wait for the animation to complete
  }

  // Measure each column's real content height and size the scroll container.
  computeColumnGeometry() {
    const vh = window.innerHeight;
    const isMobile = window.innerWidth <= 768;

    this.columnData = this.columns.map((column, index) => {
      let contentHeight = 0;
      column.querySelectorAll('.column__item').forEach(item => {
        if (item.classList.contains('is-hidden')) return;
        const marginBottom = parseInt(window.getComputedStyle(item).marginBottom, 10) || 0;
        contentHeight += item.offsetHeight + marginBottom;
      });

      // How much this column can scroll within its own content
      const range = Math.max(0, contentHeight - vh);

      return {
        el: column,
        contentHeight,
        range,
        isMiddle: index === this.middleIndex,
        // Columns shorter than the viewport are kept static and centered
        centerOffset: range === 0 ? Math.max(0, (vh - contentHeight) / 2) : 0,
      };
    });

    // Scroll distance = the tallest column's scrollable range
    const maxRange = this.columnData.reduce((max, c) => Math.max(max, c.range), 0);

    if (isMobile) {
      // Natural vertical stacking on mobile, no parallax
      this.container.style.height = '';
      this.columns.forEach(column => (column.style.transform = 'none'));
    } else {
      this.container.style.height = `${vh + maxRange}px`;
    }
  }

  // Translate each column so it reveals exactly its content, bounded (no black).
  applyParallax(scroll, limit) {
    if (window.innerWidth <= 768) {
      this.columns.forEach(column => (column.style.transform = 'none'));
      return;
    }

    const distance = limit && limit > 0 ? limit : 1;
    const progress = Math.min(1, Math.max(0, scroll / distance));

    this.columnData.forEach(column => {
      let translateY;
      if (column.range === 0) {
        // Short column: stay put, vertically centered
        translateY = scroll + column.centerOffset;
      } else if (column.isMiddle) {
        // Middle column reveals bottom -> top (reverse direction)
        translateY = scroll - (1 - progress) * column.range;
      } else {
        // Side columns reveal top -> bottom
        translateY = scroll - progress * column.range;
      }
      column.el.style.transform = `translate3d(0, ${translateY}px, 0)`;
    });
  }

  initMenu() {
    // Add click event listener to burger menu button
    if (this.burgerMenu) {
      this.burgerMenu.addEventListener('click', () => {
        this.toggleMenu();
      });
    }

    // Add click event listener to close button
    if (this.menuPanelClose) {
      this.menuPanelClose.addEventListener('click', () => {
        this.closeMenu();
      });
    }

    // Add escape key listener to close menu
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.menuPanel.classList.contains('active')) {
        this.closeMenu();
      }
    });

    // Add click event listener to close when clicking outside the menu content
    this.menuPanel.addEventListener('click', e => {
      // If clicking on the menu panel background (not the content)
      if (e.target === this.menuPanel) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.menuPanel.classList.contains('active')) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.menuPanel.classList.add('active');
    this.burgerMenu.classList.add('active');

    // Disable scrolling on body and Lenis scroll
    document.body.style.overflow = 'hidden';
    if (this.scroll) {
      this.scroll.stop();
    }
  }

  closeMenu() {
    this.menuPanel.classList.remove('active');
    this.burgerMenu.classList.remove('active');

    // Re-enable scrolling if project details is not open
    if (!this.projectDetails.classList.contains('active')) {
      document.body.style.overflow = '';
      if (this.scroll) {
        this.scroll.start();
      }
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.columns');
  if (container) {
    new ColumnScroll(container);
  }
});
