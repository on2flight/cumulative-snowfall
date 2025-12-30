// Year range slider controller
// Manages dual-handle range slider for filtering seasons by year

let sliderState = {
    minYear: 1990,
    maxYear: 2024,
    currentStart: 1990,
    currentEnd: 2024,
    onChange: null,
    container: null
};

/**
 * Initialize the year range slider
 * @param {string} containerId - ID of the container element
 * @param {number} minYear - Minimum selectable year
 * @param {number} maxYear - Maximum selectable year
 * @param {function} onChange - Callback function called when range changes
 */
function initSlider(containerId, minYear, maxYear, onChange) {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container element with ID '${containerId}' not found`);
    }

    // Store state
    sliderState.minYear = minYear;
    sliderState.maxYear = maxYear;
    sliderState.currentStart = minYear;
    sliderState.currentEnd = maxYear;
    sliderState.onChange = onChange;
    sliderState.container = container;

    // Create slider HTML
    container.innerHTML = `
        <div class="year-slider">
            <div class="slider-header">
                <h3>Year Range</h3>
                <div class="year-display">
                    <span class="year-label" id="start-year-label">${minYear}</span>
                    <span class="year-separator">-</span>
                    <span class="year-label" id="end-year-label">${maxYear}</span>
                </div>
            </div>
            <div class="slider-track-container">
                <div class="slider-track" id="slider-track">
                    <div class="slider-range" id="slider-range"></div>
                    <div class="slider-handle" id="start-handle" data-handle="start">
                        <div class="handle-tooltip" id="start-tooltip">${minYear}</div>
                    </div>
                    <div class="slider-handle" id="end-handle" data-handle="end">
                        <div class="handle-tooltip" id="end-tooltip">${maxYear}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add CSS styles
    addSliderStyles();

    // Initialize handle positions
    updateSliderVisuals();

    // Add event listeners
    setupSliderEvents();

    console.log(`Slider initialized: ${minYear}-${maxYear}`);
}

/**
 * Get current slider range values
 * @returns {object} Object with start and end year values
 */
function getSliderRange() {
    return {
        start: sliderState.currentStart,
        end: sliderState.currentEnd
    };
}

/**
 * Set slider range programmatically
 * @param {number} start - Start year
 * @param {number} end - End year
 */
function setSliderRange(start, end) {
    if (start < sliderState.minYear || start > sliderState.maxYear ||
        end < sliderState.minYear || end > sliderState.maxYear ||
        start > end) {
        console.warn('Invalid slider range:', start, end);
        return;
    }

    sliderState.currentStart = start;
    sliderState.currentEnd = end;
    updateSliderVisuals();

    if (sliderState.onChange) {
        sliderState.onChange(start, end);
    }
}

/**
 * Add CSS styles for the slider
 */
function addSliderStyles() {
    if (document.getElementById('slider-styles')) {
        return; // Styles already added
    }

    const style = document.createElement('style');
    style.id = 'slider-styles';
    style.textContent = `
        .year-slider {
            width: 100%;
        }

        .slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .slider-header h3 {
            margin: 0;
            font-size: 1.125rem;
            color: var(--primary-blue);
        }

        .year-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: var(--text-color);
        }

        .year-label {
            font-size: 1rem;
            min-width: 3rem;
            text-align: center;
        }

        .year-separator {
            color: var(--secondary-blue);
        }

        .slider-track-container {
            position: relative;
            padding: 1rem 0;
        }

        .slider-track {
            position: relative;
            height: 6px;
            background-color: var(--border-color);
            border-radius: 3px;
            margin: 1rem 0;
        }

        .slider-range {
            position: absolute;
            height: 100%;
            background-color: var(--secondary-blue);
            border-radius: 3px;
            transition: all 0.2s ease;
        }

        .slider-handle {
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: var(--primary-blue);
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            top: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-handle:hover {
            background-color: var(--secondary-blue);
            transform: translate(-50%, -50%) scale(1.1);
        }

        .slider-handle:active {
            transform: translate(-50%, -50%) scale(1.2);
        }

        .handle-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--text-color);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            white-space: nowrap;
            margin-bottom: 0.5rem;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
        }

        .handle-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-top-color: var(--text-color);
        }

        .slider-handle:hover .handle-tooltip {
            opacity: 1;
        }

        /* Mobile optimizations */
        @media (max-width: 767px) {
            .slider-handle {
                width: 24px;
                height: 24px;
            }

            .slider-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .year-display {
                font-size: 1.125rem;
            }
        }

        /* Touch device optimizations */
        @media (pointer: coarse) {
            .slider-handle {
                width: 28px;
                height: 28px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Set up event listeners for slider interaction
 */
function setupSliderEvents() {
    const startHandle = document.getElementById('start-handle');
    const endHandle = document.getElementById('end-handle');
    const track = document.getElementById('slider-track');

    if (!startHandle || !endHandle || !track) {
        console.error('Slider elements not found');
        return;
    }

    let isDragging = false;
    let currentHandle = null;

    // Mouse events
    startHandle.addEventListener('mousedown', (e) => startDrag(e, 'start'));
    endHandle.addEventListener('mousedown', (e) => startDrag(e, 'end'));

    // Touch events
    startHandle.addEventListener('touchstart', (e) => startDrag(e, 'start'), { passive: false });
    endHandle.addEventListener('touchstart', (e) => startDrag(e, 'end'), { passive: false });

    // Global mouse/touch move and end events
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    // Track click to jump to position
    track.addEventListener('click', handleTrackClick);

    function startDrag(e, handle) {
        e.preventDefault();
        isDragging = true;
        currentHandle = handle;

        // Add visual feedback
        const handleElement = document.getElementById(`${handle}-handle`);
        if (handleElement) {
            handleElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
        }
    }

    function handleDrag(e) {
        if (!isDragging || !currentHandle) return;

        e.preventDefault();

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const trackRect = track.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (clientX - trackRect.left) / trackRect.width));

        const year = Math.round(sliderState.minYear + percentage * (sliderState.maxYear - sliderState.minYear));

        if (currentHandle === 'start') {
            sliderState.currentStart = Math.min(year, sliderState.currentEnd);
        } else {
            sliderState.currentEnd = Math.max(year, sliderState.currentStart);
        }

        updateSliderVisuals();

        if (sliderState.onChange) {
            sliderState.onChange(sliderState.currentStart, sliderState.currentEnd);
        }
    }

    function endDrag() {
        if (!isDragging) return;

        isDragging = false;

        // Remove visual feedback
        if (currentHandle) {
            const handleElement = document.getElementById(`${currentHandle}-handle`);
            if (handleElement) {
                handleElement.style.transform = 'translate(-50%, -50%)';
            }
        }

        currentHandle = null;
    }

    function handleTrackClick(e) {
        if (isDragging) return;

        const trackRect = track.getBoundingClientRect();
        const percentage = (e.clientX - trackRect.left) / trackRect.width;
        const year = Math.round(sliderState.minYear + percentage * (sliderState.maxYear - sliderState.minYear));

        // Determine which handle to move based on proximity
        const startDistance = Math.abs(year - sliderState.currentStart);
        const endDistance = Math.abs(year - sliderState.currentEnd);

        if (startDistance < endDistance) {
            sliderState.currentStart = Math.min(year, sliderState.currentEnd);
        } else {
            sliderState.currentEnd = Math.max(year, sliderState.currentStart);
        }

        updateSliderVisuals();

        if (sliderState.onChange) {
            sliderState.onChange(sliderState.currentStart, sliderState.currentEnd);
        }
    }
}

/**
 * Update slider visual elements based on current state
 */
function updateSliderVisuals() {
    const startHandle = document.getElementById('start-handle');
    const endHandle = document.getElementById('end-handle');
    const range = document.getElementById('slider-range');
    const startLabel = document.getElementById('start-year-label');
    const endLabel = document.getElementById('end-year-label');
    const startTooltip = document.getElementById('start-tooltip');
    const endTooltip = document.getElementById('end-tooltip');

    if (!startHandle || !endHandle || !range) {
        console.error('Slider visual elements not found');
        return;
    }

    const totalRange = sliderState.maxYear - sliderState.minYear;
    const startPercentage = (sliderState.currentStart - sliderState.minYear) / totalRange * 100;
    const endPercentage = (sliderState.currentEnd - sliderState.minYear) / totalRange * 100;

    // Position handles
    startHandle.style.left = `${startPercentage}%`;
    endHandle.style.left = `${endPercentage}%`;

    // Update range highlight
    range.style.left = `${startPercentage}%`;
    range.style.width = `${endPercentage - startPercentage}%`;

    // Update labels
    if (startLabel) startLabel.textContent = sliderState.currentStart;
    if (endLabel) endLabel.textContent = sliderState.currentEnd;
    if (startTooltip) startTooltip.textContent = sliderState.currentStart;
    if (endTooltip) endTooltip.textContent = sliderState.currentEnd;
}

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSlider,
        getSliderRange,
        setSliderRange
    };
}