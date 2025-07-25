import { gsap } from 'gsap';
import Lenis from 'lenis';

export default class ColumnScroll {
  constructor(container) {
    this.container = container;
    this.columns = [...container.querySelectorAll('.column')];
    // first and third columns
    this.oddColumns = this.columns.filter((_, index) => index !== 1);
    this.evenColumns = this.columns.filter((_, index) => index === 1);

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
    // Scroll cached value
    this.scrollSpeedEven = 1.2;
    this.scrollSpeedOdd = 2.5;

    // Initialize
    this.init();
    this.initProjectDetails();
  }

  init() {
    // Calculate the appropriate height for the columns container
    this.calculateColumnsHeight();

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
      infinite: false, // Change to false to avoid empty space
    });

    // Lenis scroll event: translate the first and third grid column based on scroll position
    this.scroll.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
      // Only apply the inverse scrolling effect if not on mobile
      if (window.innerWidth > 768) {
        this.oddColumns.forEach(
          column => (column.style.transform = `translateY(${scroll * this.scrollSpeedOdd}px)`)
        );
        this.evenColumns.forEach(
          column => (column.style.transform = `translateY(${-scroll * this.scrollSpeedEven}px)`)
        );
      } else {
        // On mobile, reset transforms to ensure normal scrolling
        this.oddColumns.forEach(column => (column.style.transform = 'none'));
        this.evenColumns.forEach(column => (column.style.transform = 'none'));
      }
    });

    // Set up the animation frame for Lenis
    const raf = time => {
      this.scroll.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Update scroll on window resize
    window.addEventListener('resize', () => {
      this.scroll.resize();
    });

    // Refresh scroll after a short delay to ensure all elements are properly sized
    setTimeout(() => {
      this.scroll.resize();
    }, 500);
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
    // If there are multiple images, start with the second image (index 1)
    this.currentImageIndex = projectImages.length > 1 ? 1 : 0;

    // Get the image source based on the current image index
    const imgSrc =
      projectImages.length > 1
        ? projectImages[1]
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

  calculateColumnsHeight() {
    // Get the tallest column
    let maxHeight = 0;

    // For mobile view (single column), calculate total height of all items
    if (window.innerWidth <= 768) {
      let totalHeight = 0;

      // Sum up heights of all items across all columns
      this.projectItems.forEach(item => {
        totalHeight += item.offsetHeight + parseInt(window.getComputedStyle(item).marginBottom);
      });

      // Add padding
      totalHeight += 100;
      maxHeight = totalHeight;
    } else {
      // For desktop view (3 columns), find the tallest column
      this.columns.forEach((column, index) => {
        const items = column.querySelectorAll('.column__item');
        let columnHeight = 0;

        // Sum up the heights of all items in the column
        items.forEach(item => {
          columnHeight += item.offsetHeight + parseInt(window.getComputedStyle(item).marginBottom);
        });

        // Add padding to account for spacing
        columnHeight += 100; // Extra padding

        // Apply scroll speed multiplier based on column type (odd or even)
        // This accounts for the different scroll speeds in the visual effect
        if (index === 1) {
          // Even column (middle)
          columnHeight *= this.scrollSpeedEven / 2;
        } else {
          // Odd columns (first and third)
          columnHeight *= this.scrollSpeedOdd / 2;
        }

        // Update max height if this column is taller
        maxHeight = Math.max(maxHeight, columnHeight);
      });
    }

    // Set the container height to the calculated height plus minimal padding
    // Ensure it's at least 100vh to allow for scrolling effects
    const minHeight = Math.max(window.innerHeight, maxHeight);
    const extraPadding = window.innerHeight * 0.2; // Add 20% of viewport height as extra padding
    this.container.style.height = `${minHeight + extraPadding}px`;

    // Remove existing resize listener to avoid duplicates
    window.removeEventListener('resize', this.resizeHandler);

    // Create a resize handler and store it for later removal
    this.resizeHandler = () => {
      this.calculateColumnsHeight();
    };

    // Add the resize listener
    window.addEventListener('resize', this.resizeHandler);
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
