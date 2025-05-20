import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default class ColumnScroll {
  constructor(container) {
    this.container = container;
    this.columns = [...container.querySelectorAll('.column')];
    this.columnCount = this.columns.length;
    this.projectItems = [...container.querySelectorAll('.column__item')];
    this.projectDetails = document.querySelector('.project-details');
    this.projectDetailsContent = this.projectDetails.querySelector('.project-details__content');
    this.projectDetailsTitle = this.projectDetails.querySelector('.project-details__title');
    this.projectDetailsImage = this.projectDetails.querySelector('.project-details__image img');
    this.projectDetailsDescription = this.projectDetails.querySelector('.project-details__description');
    this.projectDetailsClose = this.projectDetails.querySelector('.project-details__close');
    this.projectDetailsBackButton = this.projectDetails.querySelector('.project-details__back-button');
    this.projectDetailsThumbnails = this.projectDetails.querySelector('.project-details__thumbnails');

    // State
    this.isGridView = true;
    this.currentProjectIndex = -1;

    // Initialize
    this.init();
    this.initProjectDetails();
  }

  init() {
    // Set up the scroll animations for each column
    this.columns.forEach((column, index) => {
      const direction = index % 2 ? 1 : -1; // Alternate direction
      const speed = 0.1 + (index * 0.05); // Vary speed slightly

      // Create scroll animation for this column
      gsap.to(column, {
        y: () => direction * (ScrollTrigger.maxScroll(window) - column.offsetHeight),
        ease: 'none',
        scrollTrigger: {
          trigger: this.container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: speed,
          invalidateOnRefresh: true
        }
      });
    });
  }

  initProjectDetails() {
    // Add click event listeners to project items
    this.projectItems.forEach(item => {
      item.addEventListener('click', () => this.openProjectDetails(item));
    });

    // Add click event listener to close button
    this.projectDetailsClose.addEventListener('click', () => this.closeProjectDetails());

    // Add click event listener to back button
    if (this.projectDetailsBackButton) {
      this.projectDetailsBackButton.addEventListener('click', () => this.returnToGrid());
    }

    // Add click event listener to background to close
    this.projectDetails.addEventListener('click', (e) => {
      if (e.target === this.projectDetails) {
        this.closeProjectDetails();
      }
    });

    // Add escape key listener to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.projectDetails.classList.contains('active')) {
        this.closeProjectDetails();
      }
    });

    // Add arrow key navigation for thumbnails
    document.addEventListener('keydown', (e) => {
      if (!this.projectDetails.classList.contains('active') || this.isGridView) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        // If we have multiple images for the current project, navigate between them
        if (this.currentProjectImages && this.currentProjectImages.length > 1) {
          let newImageIndex = this.currentImageIndex;
          if (e.key === 'ArrowLeft') {
            newImageIndex = (newImageIndex - 1 + this.currentProjectImages.length) % this.currentProjectImages.length;
          } else {
            newImageIndex = (newImageIndex + 1) % this.currentProjectImages.length;
          }
          this.switchProjectImage(newImageIndex);
        } else {
          // Otherwise, navigate between projects
          let newProjectIndex = this.currentProjectIndex;
          if (e.key === 'ArrowLeft') {
            newProjectIndex = (newProjectIndex - 1 + this.projectItems.length) % this.projectItems.length;
          } else {
            newProjectIndex = (newProjectIndex + 1) % this.projectItems.length;
          }
          this.switchProject(newProjectIndex);
        }
      }
    });
  }

  openProjectDetails(item) {
    const projectId = item.dataset.projectId;
    const projectTitle = item.dataset.projectTitle;
    const projectDescription = item.dataset.projectDescription;
    const projectImages = JSON.parse(item.dataset.projectImages || '[]');
    const imgSrc = item.querySelector('img').src;
    const imgAlt = item.querySelector('img').alt;

    // Find the index of the clicked project
    this.currentProjectIndex = this.projectItems.findIndex(p => p === item);

    // Store the current image index within the project
    this.currentImageIndex = 0;

    // Store all images for the current project
    this.currentProjectImages = projectImages;

    // Get the position and dimensions of the clicked item
    const itemRect = item.getBoundingClientRect();
    const itemImg = item.querySelector('img');

    // Create a clone of the image for the animation
    const imgClone = itemImg.cloneNode(true);
    imgClone.style.position = 'fixed';
    imgClone.style.top = `${itemRect.top}px`;
    imgClone.style.left = `${itemRect.left}px`;
    imgClone.style.width = `${itemRect.width}px`;
    imgClone.style.height = `${itemRect.height}px`;
    imgClone.style.borderRadius = '10px';
    imgClone.style.zIndex = '1000';
    imgClone.style.transition = 'none';
    document.body.appendChild(imgClone);

    // Populate project details from data attributes
    this.projectDetailsTitle.textContent = projectTitle || imgAlt;
    this.projectDetailsImage.style.opacity = '0'; // Hide the target image initially
    this.projectDetailsImage.src = imgSrc;
    this.projectDetailsImage.alt = imgAlt;
    this.projectDetailsDescription.innerHTML = projectDescription || '';

    // Clear existing thumbnails
    this.projectDetailsThumbnails.innerHTML = '';

    // Create thumbnails for all images of the current project
    if (projectImages.length > 0) {
      projectImages.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'project-details__thumbnail';
        if (index === 0) {
          thumbnail.classList.add('active');
        }

        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = imageUrl;
        thumbnailImg.alt = `${projectTitle} - Image ${index + 1}`;

        thumbnail.appendChild(thumbnailImg);

        // Add click event to thumbnail
        thumbnail.addEventListener('click', () => {
          this.switchProjectImage(index);
        });

        this.projectDetailsThumbnails.appendChild(thumbnail);
      });
    } else {
      // Fallback if no images are found
      const thumbnail = document.createElement('div');
      thumbnail.className = 'project-details__thumbnail active';

      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = imgSrc;
      thumbnailImg.alt = imgAlt;

      thumbnail.appendChild(thumbnailImg);
      this.projectDetailsThumbnails.appendChild(thumbnail);
    }

    // Show project details container (but keep content invisible)
    this.projectDetails.classList.add('active');

    // Disable scrolling on body
    document.body.style.overflow = 'hidden';

    // Set grid view state
    this.isGridView = false;

    // Get the target position for the image animation
    setTimeout(() => {
      const targetRect = this.projectDetailsImage.getBoundingClientRect();

      // Animate the cloned image to the target position
      gsap.to(imgClone, {
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => {
          // Remove the clone and show the actual image
          imgClone.remove();
          this.projectDetailsImage.style.opacity = '1';

          // Animate the header elements sequentially
          gsap.fromTo(this.projectDetailsTitle,
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' }
          );

          gsap.fromTo(this.projectDetailsControls,
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' }
          );

          // The main content (image and description) animations are handled by CSS transitions

          // Animate thumbnails
          gsap.fromTo(this.projectDetailsThumbnails,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, delay: 0.6, ease: 'power2.out' }
          );
        }
      });
    }, 100);
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

    // Get the main content container
    const mainContent = this.projectDetails.querySelector('.project-details__main-content');

    // Clear existing thumbnails
    this.projectDetailsThumbnails.innerHTML = '';

    // Create thumbnails for all images of the current project
    if (projectImages.length > 0) {
      projectImages.forEach((imageUrl, idx) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'project-details__thumbnail';
        if (idx === 0) {
          thumbnail.classList.add('active');
        }

        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = imageUrl;
        thumbnailImg.alt = `${projectTitle} - Image ${idx + 1}`;

        thumbnail.appendChild(thumbnailImg);

        // Add click event to thumbnail
        thumbnail.addEventListener('click', () => {
          this.switchProjectImage(idx);
        });

        this.projectDetailsThumbnails.appendChild(thumbnail);
      });
    } else {
      // Fallback if no images are found
      const thumbnail = document.createElement('div');
      thumbnail.className = 'project-details__thumbnail active';

      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = imgSrc;
      thumbnailImg.alt = imgAlt;

      thumbnail.appendChild(thumbnailImg);
      this.projectDetailsThumbnails.appendChild(thumbnail);
    }

    // Animate content change
    gsap.timeline()
      // Fade out elements sequentially
      .to(this.projectDetailsDescription, {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power2.in'
      })
      .to(this.projectDetailsImage, {
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in'
      }, '-=0.2')
      .to(this.projectDetailsTitle, {
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
        }
      }, '-=0.2')
      // Fade in elements sequentially
      .to(this.projectDetailsTitle, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      })
      .to(this.projectDetailsImage, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2')
      .to(this.projectDetailsDescription, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2');
  }

  switchProjectImage(index) {
    // Update current image index
    this.currentImageIndex = index;

    // Get the image URL
    const imageUrl = this.currentProjectImages[index];

    // Update thumbnails
    const thumbnails = this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail');
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
          ease: 'power2.out'
        });
      }
    });
  }

  closeProjectDetails() {
    if (this.currentProjectIndex === -1) return;

    // Get the current project item in the grid
    const item = this.projectItems[this.currentProjectIndex];
    const itemRect = item.getBoundingClientRect();

    // Get the current image in the details view
    const detailsImage = this.projectDetailsImage;
    const detailsImageRect = detailsImage.getBoundingClientRect();

    // Create a clone of the image for the animation
    const imgClone = detailsImage.cloneNode(true);
    imgClone.style.position = 'fixed';
    imgClone.style.top = `${detailsImageRect.top}px`;
    imgClone.style.left = `${detailsImageRect.left}px`;
    imgClone.style.width = `${detailsImageRect.width}px`;
    imgClone.style.height = `${detailsImageRect.height}px`;
    imgClone.style.borderRadius = '10px';
    imgClone.style.zIndex = '1000';
    imgClone.style.transition = 'none';
    document.body.appendChild(imgClone);

    // Hide the original image
    detailsImage.style.opacity = '0';

    // Animate elements out sequentially
    const timeline = gsap.timeline({
      onComplete: () => {
        // Animate the cloned image back to the grid position
        gsap.to(imgClone, {
          top: itemRect.top,
          left: itemRect.left,
          width: itemRect.width,
          height: itemRect.height,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => {
            // Remove the clone
            imgClone.remove();

            // Hide project details
            this.projectDetails.classList.remove('active');

            // Re-enable scrolling on body
            document.body.style.overflow = '';

            // Reset state
            this.isGridView = true;
            this.currentProjectIndex = -1;
          }
        });
      }
    });

    // Fade out elements sequentially
    timeline
      .to(this.projectDetailsDescription, {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power2.in'
      })
      .to(this.projectDetailsThumbnails, {
        opacity: 0,
        y: 30,
        duration: 0.3,
        ease: 'power2.in'
      }, '-=0.2')
      .to(this.projectDetailsTitle, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in'
      }, '-=0.2')
      .to(this.projectDetailsControls, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in'
      }, '-=0.2');
  }

  returnToGrid() {
    // Use the same animation as closeProjectDetails
    this.closeProjectDetails();

    // Restore the scroll position and animation after the animation completes
    setTimeout(() => {
      this.init();
    }, 1000); // Wait for the animation to complete
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.content');
  if (container) {
    new ColumnScroll(container);
  }
});
