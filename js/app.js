// Main application orchestration
// Coordinates data loading, chart initialization, and slider interaction

let appState = {
    allSeasons: [],
    filteredSeasons: [],
    chart: null,
    isLoaded: false
};

/**
 * Application entry point
 * Initializes all components and wires them together
 */
async function init() {
    try {
        console.log('Initializing Snowfall Tracker...');

        // Show loading indicator
        showLoading();

        // Load snowfall data
        console.log('Loading snowfall data...');
        const data = await loadSnowfallData();

        if (!data || !data.seasons || !Array.isArray(data.seasons)) {
            throw new Error('Invalid data format received');
        }

        appState.allSeasons = data.seasons;
        appState.filteredSeasons = [...data.seasons]; // Start with all seasons

        console.log(`Loaded ${data.seasons.length} seasons of data`);

        // Get data bounds for slider initialization
        const minYear = Math.min(...data.seasons.map(s => s.startYear));
        const maxYear = Math.max(...data.seasons.map(s => s.startYear));

        console.log(`Data range: ${minYear}-${maxYear}`);

        // Initialize slider with data bounds
        initSlider('year-slider-container', minYear, maxYear, onSliderChange);

        // Initialize chart with all seasons
        appState.chart = initChart('snowfall-chart', appState.filteredSeasons);

        // Mark as loaded and hide loading indicator
        appState.isLoaded = true;
        hideLoading();

        console.log('Snowfall Tracker initialized successfully');

    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to load snowfall data. Please refresh the page to try again.');
    }
}

/**
 * Load snowfall data from static JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
async function loadSnowfallData() {
    try {
        // Build a data URL that works both on GitHub Pages and when loaded without a trailing slash
        // Example: https://example.github.io/repo (no slash) should still resolve to
        // https://example.github.io/repo/data/snowfall-data.json instead of https://example.github.io/data/...
        let dataUrl = 'data/snowfall-data.json';

        if (typeof window !== 'undefined' && window.location) {
            const { origin, pathname } = window.location;

            // Strip the filename (e.g., index.html) if present so we always resolve from the directory root.
            const basePath = pathname.endsWith('/')
                ? pathname
                : pathname.substring(0, pathname.lastIndexOf('/') + 1);

            dataUrl = new URL('data/snowfall-data.json', `${origin}${basePath}`).toString();
        }

        const response = await fetch(dataUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error loading snowfall data:', error);
        throw new Error(`Failed to load data: ${error.message}`);
    }
}

/**
 * Handle slider range changes
 * Filters seasons and updates chart
 * @param {number} startYear - Selected start year
 * @param {number} endYear - Selected end year
 */
function onSliderChange(startYear, endYear) {
    if (!appState.isLoaded) {
        console.warn('App not fully loaded, ignoring slider change');
        return;
    }

    console.log(`Filtering seasons: ${startYear}-${endYear}`);

    // Filter seasons by selected range
    appState.filteredSeasons = filterSeasonsByRange(appState.allSeasons, startYear, endYear);

    console.log(`Filtered to ${appState.filteredSeasons.length} seasons`);

    // Update chart with filtered data
    if (appState.chart) {
        updateChart(appState.chart, appState.filteredSeasons);
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    const loading = document.getElementById('loading');
    const appContent = document.getElementById('app-content');

    if (loading) {
        loading.style.display = 'block';
    }

    if (appContent) {
        appContent.style.display = 'none';
    }
}

/**
 * Hide loading indicator and show app content
 */
function hideLoading() {
    const loading = document.getElementById('loading');
    const appContent = document.getElementById('app-content');

    if (loading) {
        loading.style.display = 'none';
    }

    if (appContent) {
        appContent.style.display = 'block';
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const loading = document.getElementById('loading');

    if (loading) {
        loading.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
    }
}

/**
 * Get current application state (for debugging)
 * @returns {Object} Current app state
 */
function getAppState() {
    return {
        totalSeasons: appState.allSeasons.length,
        filteredSeasons: appState.filteredSeasons.length,
        isLoaded: appState.isLoaded,
        hasChart: !!appState.chart
    };
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        init,
        loadSnowfallData,
        onSliderChange,
        showLoading,
        hideLoading,
        showError,
        getAppState
    };
} else if (typeof window !== 'undefined') {
    // Make functions available globally in browser
    window.init = init;
    window.loadSnowfallData = loadSnowfallData;
    window.onSliderChange = onSliderChange;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.showError = showError;
    window.getAppState = getAppState;
}