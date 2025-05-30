import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('character-container');
    const frames = document.querySelectorAll('.character-frame');
    const frameCount = frames.length;

    // Show first frame by default
    gsap.set(frames[0], { opacity: 1 });

    // Keep track of the currently visible frame
    let currentFrameIndex = 0;

    // Create a virtual grid around the character
    // We'll use a 3x3 grid (9 cells) to track mouse position relative to the character
    function getFrameForGridPosition(gridX, gridY) {
        // Map grid positions to specific frames
        // This creates a more natural eye-following effect

        // Center
        if (gridX === 1 && gridY === 1) return 0; // Center - default position

        // Top row
        if (gridY === 0) {
            if (gridX === 0) return 1; // Top-left
            if (gridX === 1) return 2; // Top-center
            if (gridX === 2) return 3; // Top-right
        }

        // Middle row
        if (gridY === 1) {
            if (gridX === 0) return 8; // Middle-left
            if (gridX === 2) return 4; // Middle-right
        }

        // Bottom row
        if (gridY === 2) {
            if (gridX === 0) return 7; // Bottom-left (same as top-left)
            if (gridX === 1) return 6; // Bottom-center (same as top-center)
            if (gridX === 2) return 5; // Bottom-right (same as top-right)
        }

        // Fallback
        return 0;
    }

    // Track mouse movement
    document.addEventListener('mousemove', function(e) {
        // Get character container bounds
        const containerRect = container.getBoundingClientRect();

        // Calculate mouse position relative to the character container
        const relativeX = e.clientX - containerRect.left;
        const relativeY = e.clientY - containerRect.top;

        // Determine which cell of the virtual grid the mouse is in
        // Divide the container into a 3x3 grid
        const gridX = Math.floor((relativeX / containerRect.width) * 3);
        const gridY = Math.floor((relativeY / containerRect.height) * 3);

        // Clamp values to ensure they're within the 3x3 grid
        const clampedGridX = Math.max(0, Math.min(2, gridX));
        const clampedGridY = Math.max(0, Math.min(2, gridY));

        // Get the appropriate frame for this grid position
        const newFrameIndex = getFrameForGridPosition(clampedGridX, clampedGridY);

        // Only update if the frame has changed
        if (newFrameIndex !== currentFrameIndex && newFrameIndex < frameCount) {

            // Hide all frames (no transition)
            frames.forEach(frame => {
                frame.style.opacity = 0;
            });

            // Show the new frame (no transition)
            frames[newFrameIndex].style.opacity = 1;

            // Update current frame index
            currentFrameIndex = newFrameIndex;
        }
    });

    container.addEventListener('click', function() {
        window.location.href = '/portfolio';
    });
});
