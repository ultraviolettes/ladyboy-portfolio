import {gsap} from 'gsap';
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
        // Scroll cached value
        this.lastscroll = 0;
        this.scrollSpeedEven = 1.2;
        this.scrollSpeedOdd = 2.5;

        // Initialize
        this.init();
        this.initProjectDetails();
    }

    init() {

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
            infinite: false
        });

        // Lenis scroll event: translate the first and third grid column based on scroll position
        this.scroll.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
            this.oddColumns.forEach(column => column.style.transform = `translateY(${scroll * this.scrollSpeedOdd}px)`);
            this.evenColumns.forEach(column => column.style.transform = `translateY(${-scroll * this.scrollSpeedEven}px)`);
        });

        // Set up the animation frame for Lenis
        const raf = (time) => {
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

        // Create thumbnails for all project items (not just images of current project)
        // This creates the row of thumbnails beneath the main image
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
                if (isCurrentProject && projectImages.length > 1) {
                    // If clicking on current project thumbnail and it has multiple images,
                    // cycle through its images
                    const nextImageIndex = (this.currentImageIndex + 1) % projectImages.length;
                    this.switchProjectImage(nextImageIndex);
                } else {
                    // Otherwise switch to that project
                    this.switchProject(idx);
                }
            });

            this.projectDetailsThumbnails.appendChild(thumbnail);
        });

        // Show project details container (but keep content invisible)
        this.projectDetails.classList.add('active');

        // Disable scrolling on body and Lenis scroll
        document.body.style.overflow = 'hidden';
        if (this.scroll) {
            this.scroll.stop();
        }

        // Set grid view state
        this.isGridView = false;

        // Get the target position for the image animation
        setTimeout(() => {
            const targetRect = this.projectDetailsImage.getBoundingClientRect();

            // Animate the cloned image to the target position with a more dramatic scale effect
            gsap.to(imgClone, {
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
                duration: 1,
                ease: 'expo.out',
                onComplete: () => {
                    // Remove the clone and show the actual image
                    imgClone.remove();
                    this.projectDetailsImage.style.opacity = '1';

                    // Animate the header elements sequentially
                    gsap.fromTo(this.projectDetailsTitle,
                        {y: -20, opacity: 0},
                        {y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power2.out'}
                    );

                    gsap.fromTo(this.projectDetailsControls,
                        {y: -20, opacity: 0},
                        {y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out'}
                    );

                    // The main content (image and description) animations are handled by CSS transitions

                    // Animate thumbnails with a staggered effect
                    gsap.fromTo(this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail'),
                        {y: 30, opacity: 0},
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.5,
                            stagger: 0.05,
                            delay: 0.4,
                            ease: 'power2.out'
                        }
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

        // Update thumbnails to show the active project
        const thumbnails = this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail');
        thumbnails.forEach((thumb, idx) => {
            if (idx === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });

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
                    ease: 'expo.inOut',
                    onComplete: () => {
                        // Remove the clone
                        imgClone.remove();

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
            .to(this.projectDetailsThumbnails.querySelectorAll('.project-details__thumbnail'), {
                opacity: 0,
                y: 30,
                duration: 0.3,
                stagger: 0.03,
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
            // Update Lenis scroll
            this.scroll.resize();
        }, 1000); // Wait for the animation to complete
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.columns');
    if (container) {
        new ColumnScroll(container);
    }
});
