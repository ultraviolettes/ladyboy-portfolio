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
    this.projectDetailsImage = this.projectDetails.querySelector('.project-details__image img');
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

        // If we have multiple images for the current project, navigate between them
        if (this.currentProjectImages && this.currentProjectImages.length > 1) {
          let newImageIndex = this.currentImageIndex;
          if (e.key === 'ArrowLeft') {
            newImageIndex =
              (newImageIndex - 1 + this.currentProjectImages.length) %
              this.currentProjectImages.length;
          } else {
            newImageIndex = (newImageIndex + 1) % this.currentProjectImages.length;
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
    const projectTitle = item.dataset.projectTitle;
    const projectDescription = item.dataset.projectDescription;
    const projectImages = JSON.parse(item.dataset.projectImages || '[]');
    const imgAlt = item.querySelector('img').alt;
    const externalLink = item.dataset.externalLink;

    // Find the index of the clicked project
    this.currentProjectIndex = this.projectItems.findIndex(p => p === item);

    // Store all images for the current project
    this.currentProjectImages = projectImages;

    // Store the current image index within the project
    // Always start with the first image (index 0)
    this.currentImageIndex = 0;

    // Get the image source based on the current image index
    const imgSrc =
      projectImages.length > 0
        ? projectImages[0]
        : item.dataset.originalImage || item.querySelector('img').src;

    // Populate project details from data attributes
    this.projectDetailsTitle.textContent = projectTitle || imgAlt;
    this.projectDetailsImage.src = imgSrc;
    this.projectDetailsImage.alt = imgAlt;
    this.projectDetailsDescription.innerHTML = projectDescription || '';

    // Handle external link
    if (externalLink && externalLink.trim() !== '') {
      this.projectDetailsExternalLink.href = externalLink;
      this.projectDetailsExternalLink.parentElement.style.display = 'block';
    } else {
      this.projectDetailsExternalLink.href = '#';
      this.projectDetailsExternalLink.parentElement.style.display = 'none';
    }

    // Clear existing thumbnails
    this.projectDetailsThumbnails.innerHTML = '';

    // Check if current project has multiple images
    if (projectImages.length > 1) {
      // Create thumbnails for all images of the current project
      projectImages.forEach((imgSrc, idx) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'project-details__thumbnail';
        if (idx === this.currentImageIndex) {
          thumbnail.classList.add('active');
        }

        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = imgSrc;
        thumbnailImg.alt = `${projectTitle || imgAlt} - Image ${idx + 1}`;

        thumbnail.appendChild(thumbnailImg);

        // Add click event to thumbnail to switch images
        thumbnail.addEventListener('click', () => {
          this.switchProjectImage(idx);
        });

        this.projectDetailsThumbnails.appendChild(thumbnail);
      });
    } else {
      // If current project doesn't have multiple images, create thumbnails for all project items
      this.projectItems.forEach((projectItem, idx) => {
        const isCurrentProject = idx === this.currentProjectIndex;
        const thumbImgSrc = projectItem.querySelector('img').src;
        const thumbImgAlt = projectItem.querySelector('img').alt;

        const thumbnail = document.createElement('div');
        thumbnail.className = 'project-details__thumbnail';
        if (isCurrentProject) {
          thumbnail.classList.add('active');
        }

        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = thumbImgSrc;
        thumbnailImg.alt = thumbImgAlt;

        thumbnail.appendChild(thumbnailImg);

        // Add click event to thumbnail to switch projects
        thumbnail.addEventListener('click', () => {
          this.switchProject(idx);
        });

        this.projectDetailsThumbnails.appendChild(thumbnail);
      });
    }

    // Add 'few-thumbnails' class if there are 10 or fewer thumbnails
    if (
      (projectImages.length > 1 && projectImages.length <= 10) ||
      (projectImages.length <= 1 && this.projectItems.length <= 10)
    ) {
      this.projectDetailsThumbnails.classList.add('few-thumbnails');
    } else {
      this.projectDetailsThumbnails.classList.remove('few-thumbnails');
    }

    // Show project details container
    this.projectDetails.classList.add('active');
    this.projectDetailsImage.style.opacity = '1';
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

  switchProject(index) {
    // Update current index
    this.currentProjectIndex = index;
    this.currentImageIndex = 0;

    // Get the project item
    const item = this.projectItems[index];

    // Parse project images
    const projectImages = JSON.parse(item.dataset.projectImages || '[]');
    this.currentProjectImages = projectImages;

    // Update project details
    const projectTitle = item.dataset.projectTitle;
    const projectDescription = item.dataset.projectDescription;
    const imgSrc = projectImages.length > 0 ? projectImages[0] : item.querySelector('img').src;
    const imgAlt = item.querySelector('img').alt;
    const externalLink = item.dataset.externalLink;

    // Get the main content container
    this.projectDetails.querySelector('.project-details__main-content');
    // Update thumbnails to show the active project
    const thumbnails = this.projectDetailsThumbnails.querySelectorAll(
      '.project-details__thumbnail'
    );
    thumbnails.forEach((thumb, idx) => {
      if (idx === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });

    // Animate content change
    gsap
      .timeline()
      // Fade out elements sequentially
      .to(this.projectDetailsDescription, {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power2.in',
      })
      .to(
        this.projectDetailsImage,
        {
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: 'power2.in',
        },
        '-=0.2'
      )
      .to(
        this.projectDetailsTitle,
        {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            // Update content
            this.projectDetailsTitle.textContent = projectTitle || imgAlt;
            this.projectDetailsImage.src = imgSrc;
            this.projectDetailsImage.alt = imgAlt;
            this.projectDetailsDescription.innerHTML = projectDescription || '';

            // Handle external link
            if (externalLink && externalLink.trim() !== '') {
              this.projectDetailsExternalLink.href = externalLink;
              this.projectDetailsExternalLink.parentElement.style.display = 'block';
            } else {
              this.projectDetailsExternalLink.href = '#';
              this.projectDetailsExternalLink.parentElement.style.display = 'none';
            }
          },
        },
        '-=0.2'
      )
      // Fade in elements sequentially
      .to(this.projectDetailsTitle, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      })
      .to(
        this.projectDetailsImage,
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
        },
        '-=0.2'
      )
      .to(
        this.projectDetailsDescription,
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
        },
        '-=0.2'
      );
  }

  switchProjectImage(index) {
    // Update current image index
    this.currentImageIndex = index;

    // Get the image URL
    const imageUrl = this.currentProjectImages[index];

    // Update thumbnails
    const thumbnails = this.projectDetailsThumbnails.querySelectorAll(
      '.project-details__thumbnail'
    );
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });

    // Animate image change
    gsap.to(this.projectDetailsImage, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        // Update image
        this.projectDetailsImage.src = imageUrl;

        // Fade in image
        gsap.to(this.projectDetailsImage, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
        });
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
        this.projectDetailsImage,
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
