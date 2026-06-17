import { gsap } from 'gsap';
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
    this.projectDetailsImageWrap = this.projectDetails.querySelector('.project-details__image');
    this.projectDetailsImage = this.projectDetails.querySelector('.project-details__image img');
    this.projectDetailsVideo = this.projectDetails.querySelector('.project-details__image video');
    this.currentProjectMedia = [];
    this.projectDetailsDescription = this.projectDetails.querySelector(
      '.project-details__description'
    );
    this.projectDetailsClose = this.projectDetails.querySelector('.project-details__close');
    this.projectDetailsBackButton = this.projectDetails.querySelector(
      '.project-details__back-button'
    );
    this.projectDetailsThumbnails = this.projectDetails.querySelector(
      '.project-details__thumbnails'
    );
    this.projectDetailsExternalLink = this.projectDetails.querySelector(
      '.project-details__external-link a'
    );

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
    // Add click event listeners to project items
    this.projectItems.forEach(item => {
      item.addEventListener('click', () => this.openProjectDetails(item));
    });


    // Add click event listener to back button
    if (this.projectDetailsBackButton) {
      this.projectDetailsBackButton.addEventListener('click', () => this.returnToGrid());
    }

    // Add click event listener to the close (×) button
    if (this.projectDetailsClose) {
      this.projectDetailsClose.addEventListener('click', e => {
        e.stopPropagation();
        this.closeProjectDetails();
      });
    }

    // Add click event listener to close when clicking anywhere except on thumbnails and view project button
    this.projectDetails.addEventListener('click', e => {
      // Check if the clicked element is a thumbnail or the view project button
      const isThumbnail = e.target.closest('.project-details__thumbnail');
      const isViewProjectButton = e.target.closest('.project-details__external-link');

      // If not clicking on a thumbnail or view project button, close the details
      if (!isThumbnail && !isViewProjectButton) {
        this.returnToGrid();
      }
    });

    // Add escape key listener to close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.projectDetails.classList.contains('active')) {
        this.closeProjectDetails();
      }
    });

    // Add arrow key navigation for thumbnails
    document.addEventListener('keydown', e => {
      if (!this.projectDetails.classList.contains('active') || this.isGridView) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        // If we have multiple media for the current project, navigate between them
        if (this.currentProjectMedia && this.currentProjectMedia.length > 1) {
          let newImageIndex = this.currentImageIndex;
          if (e.key === 'ArrowLeft') {
            newImageIndex =
              (newImageIndex - 1 + this.currentProjectMedia.length) %
              this.currentProjectMedia.length;
          } else {
            newImageIndex = (newImageIndex + 1) % this.currentProjectMedia.length;
          }
          this.switchProjectImage(newImageIndex);
        } else {
          // Otherwise, navigate between projects
          let newProjectIndex = this.currentProjectIndex;
          if (e.key === 'ArrowLeft') {
            newProjectIndex =
              (newProjectIndex - 1 + this.projectItems.length) % this.projectItems.length;
          } else {
            newProjectIndex = (newProjectIndex + 1) % this.projectItems.length;
          }
          this.switchProject(newProjectIndex);
        }
      }
    });
  }

  openProjectDetails(item) {
    // Identify the clicked project, then populate the panel from its media data
    this.currentProjectIndex = this.projectItems.findIndex(p => p === item);
    this.loadProject(item);

    // Show project details container
    this.projectDetails.classList.add('active');
    this.projectDetailsDescription.style.opacity = '1';

    // Disable scrolling on body and Lenis scroll
    document.body.style.overflow = 'hidden';
    if (this.scroll) {
      this.scroll.stop();
    }

    // Hide the burger menu while the project is open (the × replaces it)
    if (this.burgerMenu) {
      this.burgerMenu.style.display = 'none';
    }

    // Set grid view state
    this.isGridView = false;

    // Animate the elements with a simple fade-in
    gsap.fromTo(
      this.projectDetailsTitle,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' }
    );

    // Animate thumbnails with a staggered effect
    gsap.fromTo(
      this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail'),
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        delay: 0.4,
        ease: 'power2.out',
      }
    );
  }

  // Populate the panel from a grid item (used on open and when switching project)
  loadProject(item) {
    this.currentProjectMedia = JSON.parse(item.dataset.projectMedia || '[]');
    this.currentImageIndex = 0;

    const title = item.dataset.projectTitle || '';
    this.projectDetailsTitle.textContent = title;
    this.projectDetailsDescription.innerHTML = item.dataset.projectDescription || '';
    this.setExternalLink(item.dataset.externalLink);

    this.showMedia(this.currentProjectMedia[0], title);
    this.buildThumbnails(title);
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

  // Show an image or a video in the main display area
  showMedia(media, alt) {
    const img = this.projectDetailsImage;
    const video = this.projectDetailsVideo;

    if (media && media.type === 'video') {
      img.style.display = 'none';
      img.removeAttribute('src');
      if (video) {
        video.src = media.full || media.url;
        video.style.display = '';
      }
    } else {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.style.display = 'none';
      }
      img.src = media ? media.full || media.url : '';
      img.alt = alt || '';
      img.style.display = '';
    }
  }

  buildThumbnails(title) {
    this.projectDetailsThumbnails.innerHTML = '';
    const media = this.currentProjectMedia;

    if (media.length > 1) {
      // One thumbnail per media of the current project
      media.forEach((m, idx) => {
        const thumb = this.createThumbnail(m, idx === this.currentImageIndex, `${title} - ${idx + 1}`);
        thumb.addEventListener('click', () => this.switchProjectImage(idx));
        this.projectDetailsThumbnails.appendChild(thumb);
      });
    } else {
      // Single media -> thumbnails point to every project
      this.projectItems.forEach((projectItem, idx) => {
        const itemMedia = JSON.parse(projectItem.dataset.projectMedia || '[]');
        const thumb = this.createThumbnail(
          itemMedia[0],
          idx === this.currentProjectIndex,
          projectItem.dataset.projectTitle || ''
        );
        thumb.addEventListener('click', () => this.switchProject(idx));
        this.projectDetailsThumbnails.appendChild(thumb);
      });
    }

    const count = media.length > 1 ? media.length : this.projectItems.length;
    this.projectDetailsThumbnails.classList.toggle('few-thumbnails', count <= 10);
  }

  createThumbnail(media, isActive, alt) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'project-details__thumbnail';
    if (isActive) {
      thumbnail.classList.add('active');
    }

    if (media && media.type === 'video') {
      thumbnail.classList.add('project-details__thumbnail--video');
      const video = document.createElement('video');
      video.src = `${media.full || media.url}#t=0.1`;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      thumbnail.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = media ? media.url || media.full : '';
      img.alt = alt || '';
      thumbnail.appendChild(img);
    }

    return thumbnail;
  }

  switchProject(index) {
    this.currentProjectIndex = index;
    const item = this.projectItems[index];

    gsap
      .timeline()
      .to(this.projectDetailsDescription, { opacity: 0, x: 20, duration: 0.3, ease: 'power2.in' })
      .to(
        this.projectDetailsImageWrap,
        { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' },
        '-=0.2'
      )
      .to(
        this.projectDetailsTitle,
        {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => this.loadProject(item),
        },
        '-=0.2'
      )
      .to(this.projectDetailsTitle, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
      .to(
        this.projectDetailsImageWrap,
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
        '-=0.2'
      )
      .to(this.projectDetailsDescription, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
  }

  switchProjectImage(index) {
    this.currentImageIndex = index;
    const media = this.currentProjectMedia[index];

    const thumbnails = this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail');
    thumbnails.forEach((thumb, i) => thumb.classList.toggle('active', i === index));

    gsap.to(this.projectDetailsImageWrap, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.showMedia(media, this.projectDetailsTitle.textContent);
        gsap.to(this.projectDetailsImageWrap, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
      },
    });
  }

  closeProjectDetails() {
    if (this.currentProjectIndex === -1) return;

    // Animate elements out sequentially
    const timeline = gsap.timeline({
      onComplete: () => {
        // Hide project details
        this.projectDetails.classList.remove('active');

        // Stop any playing video
        if (this.projectDetailsVideo) {
          this.projectDetailsVideo.pause();
        }

        // Re-enable scrolling on body
        document.body.style.overflow = '';

        // Restore the burger menu
        if (this.burgerMenu) {
          this.burgerMenu.style.display = '';
        }

        // Restart Lenis scroll
        if (this.scroll) {
          this.scroll.start();
          this.scroll.resize();
        }

        // Reset state
        this.isGridView = true;
        this.currentProjectIndex = -1;
      },
    });

    // Fade out elements sequentially
    timeline
      .to(this.projectDetailsDescription, {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power2.in',
      })
      .to(
        this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail'),
        {
          opacity: 0,
          y: 30,
          duration: 0.3,
          stagger: 0.03,
          ease: 'power2.in',
        },
        '-=0.2'
      )
      .to(
        this.projectDetailsTitle,
        {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: 'power2.in',
        },
        '-=0.2'
      )
      .to(
        this.projectDetailsImageWrap,
        {
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: 'power2.in',
        },
        '-=0.2'
      );
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
