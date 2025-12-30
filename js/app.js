// Main application entry point
// Temporary implementation for checkpoint testing - will be properly implemented in task 7

let currentChart = null;
let allSeasons = [];

// Load snowfall data from JSON file
async function loadSnowfallData() {
    try {
        const response = await fetch('data/snowfall-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.seasons;
    } catch (error) {
        console.error('Error loading snowfall data:', error);
        throw error;
    }
}

// Initialize the application
async function init() {
    console.log('Snowfall Tracker app initializing...');

    const loading = document.getElementById('loading');
    const appContent = document.getElementById('app-content');

    try {
        // Show loading indicator
        if (loading) loading.style.display = 'block';
        if (appContent) appContent.style.display = 'none';

        // Load data
        console.log('Loading snowfall data...');
        allSeasons = await loadSnowfallData();
        console.log(`Loaded ${allSeasons.length} seasons`);

        // Initialize chart with all seasons
        console.log('Initializing chart...');
        if (typeof initChart === 'function') {
            currentChart = initChart('snowfall-chart', allSeasons);
            console.log('Chart initialized successfully');
        } else {
            throw new Error('initChart function not available. Make sure chart-manager.js is loaded.');
        }

        // Hide loading indicator and show app
        if (loading) loading.style.display = 'none';
        if (appContent) appContent.style.display = 'block';

        console.log('Snowfall Tracker app initialized successfully!');

    } catch (error) {
        console.error('Error initializing app:', error);

        // Show error message
        if (loading) {
            loading.innerHTML = `
                <div style="color: red; text-align: center;">
                    <h3>Error Loading Application</h3>
                    <p>${error.message}</p>
                    <p>Please check the console for more details.</p>
                </div>
            `;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);