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
        const errorMessage = error.message || 'Failed to load snowfall data. Please refresh the page to try again.';
        showError(errorMessage);
    }
}

/**
 * Load snowfall data from static JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
async function loadSnowfallData() {
    const timeout = 30000; // 30 second timeout for large file

    try {
        // Build a data URL that works both on GitHub Pages and when loaded without a trailing slash
        // Example: https://example.github.io/repo (no slash) should still resolve to
        // https://example.github.io/repo/data/snowfall-data.json instead of https://example.github.io/data/...
        let dataUrl = 'data/snowfall-data.json';

        if (typeof window !== 'undefined' && window.location) {
            const { origin, pathname } = window.location;
            const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
            const baseHref = `${origin}${normalizedPath}`;

            dataUrl = new URL('data/snowfall-data.json', baseHref);
        }

        console.log(`Fetching data from: ${dataUrl}`);
        console.log(`Current location: ${window.location.href}`);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(dataUrl, {
            signal: controller.signal,
            cache: 'no-cache' // Ensure fresh fetch
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Provide helpful error message for 404
            if (response.status === 404) {
                throw new Error(`HTTP 404: File not found at ${dataUrl}. Please ensure the snowfall-data.json file exists in the data/ directory and is committed to the repository.`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json') && !contentType.includes('text/json')) {
            console.warn(`Unexpected content type: ${contentType}, but proceeding with parse`);
        }

        console.log('Response received, parsing JSON...');
        const data = await response.json();
        console.log('JSON parsed successfully');
        return data;

    } catch (error) {
        console.error('Error loading snowfall data:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            url: dataUrl,
            location: window.location.href
        });

        // Provide more specific error messages
        if (error.name === 'AbortError') {
            throw new Error('Request timed out after 30 seconds. The data file (2.1MB) may be too large for your connection. Please try again or check your internet connection.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('TypeError')) {
            throw new Error('Network error. Please check your internet connection and try again. If the problem persists, the data file may not be accessible.');
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
            throw new Error('Data file not found (404). Please ensure the snowfall-data.json file exists in the data/ directory and is committed to the GitHub repository.');
        } else if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('Unexpected token')) {
            throw new Error('Invalid JSON data. The data file may be corrupted or incomplete.');
        } else {
            throw new Error(`Failed to load data: ${error.message}`);
        }
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