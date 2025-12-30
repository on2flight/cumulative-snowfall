// Chart management functions for snowfall visualization

/**
 * Initialize Chart.js chart with season data
 * @param {string} canvasId - ID of the canvas element
 * @param {Object[]} seasons - Array of season objects with dailyData
 * @returns {Chart} Chart.js instance
 */
function initChart(canvasId, seasons) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    const ctx = canvas.getContext('2d');

    // Get axis bounds from data
    const bounds = getAxisBounds(seasons);

    // Convert seasons to Chart.js datasets
    const datasets = seasons.map((season, index) => {
        const color = getSeasonColor(index, seasons.length);
        const label = formatSeasonLabel(season.startYear);

        // Convert daily data to chart points
        const data = season.dailyData
            .filter(record => record.cumulativeSnowfall > 0 || record.dailySnowfall > 0)
            .map(record => ({
                x: record.dayOfSeason,
                y: record.cumulativeSnowfall
            }));

        return {
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
            fill: false
        };
    });

    // Create month labels for X-axis (Aug through Jul)
    const monthLabels = [
        'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan',
        'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'
    ];

    const config = {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false // We'll show labels at the end of lines instead
                },
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            const dayOfSeason = context[0].parsed.x;
                            const monthIndex = Math.floor(dayOfSeason / 30.4); // Approximate days per month
                            const month = monthLabels[Math.min(monthIndex, 11)];
                            return `${month} (Day ${dayOfSeason})`;
                        },
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}"`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: Math.max(0, bounds.minDayOfSeason - 10),
                    max: Math.min(365, bounds.maxDayOfSeason + 10),
                    title: {
                        display: true,
                        text: 'Season Progress'
                    },
                    ticks: {
                        callback: function (value) {
                            // Convert day of season to month labels
                            const monthIndex = Math.floor(value / 30.4);
                            return monthLabels[Math.min(monthIndex, 11)] || '';
                        },
                        stepSize: 30.4 // Approximately one month
                    }
                },
                y: {
                    beginAtZero: true,
                    max: Math.ceil(bounds.maxCumulative * 1.1), // Add 10% padding
                    title: {
                        display: true,
                        text: 'Cumulative Snowfall (inches)'
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(0) + '"';
                        }
                    }
                }
            },
            onHover: (event, activeElements) => {
                // Handle hover highlighting for desktop
                if (activeElements.length > 0) {
                    const datasetIndex = activeElements[0].datasetIndex;
                    highlightSeries(event.chart, datasetIndex);
                } else {
                    clearHighlight(event.chart);
                }
            },
            onClick: (event, activeElements) => {
                // Handle tap highlighting for mobile
                if (activeElements.length > 0) {
                    const datasetIndex = activeElements[0].datasetIndex;
                    toggleHighlight(event.chart, datasetIndex);
                }
            }
        }
    };

    return new Chart(ctx, config);
}

/**
 * Update existing chart with new season data
 * @param {Chart} chart - Chart.js instance
 * @param {Object[]} seasons - Array of season objects with dailyData
 */
function updateChart(chart, seasons) {
    if (!chart || !seasons) {
        return;
    }

    // Get new axis bounds
    const bounds = getAxisBounds(seasons);

    // Update datasets
    chart.data.datasets = seasons.map((season, index) => {
        const color = getSeasonColor(index, seasons.length);
        const label = formatSeasonLabel(season.startYear);

        // Convert daily data to chart points
        const data = season.dailyData
            .filter(record => record.cumulativeSnowfall > 0 || record.dailySnowfall > 0)
            .map(record => ({
                x: record.dayOfSeason,
                y: record.cumulativeSnowfall
            }));

        return {
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
            fill: false
        };
    });

    // Update axis bounds
    chart.options.scales.x.min = Math.max(0, bounds.minDayOfSeason - 10);
    chart.options.scales.x.max = Math.min(365, bounds.maxDayOfSeason + 10);
    chart.options.scales.y.max = Math.ceil(bounds.maxCumulative * 1.1);

    // Clear any existing highlight state
    clearHighlight(chart);

    chart.update();
}

/**
 * Generate color for season based on age (newest = darkest blue)
 * @param {number} seasonIndex - Index of season (0 = newest)
 * @param {number} totalSeasons - Total number of seasons
 * @returns {string} CSS color string
 */
function getSeasonColor(seasonIndex, totalSeasons) {
    if (totalSeasons <= 1) {
        return '#1a365d'; // Dark blue for single season
    }

    // Create gradient from dark blue (newest) to light blue (oldest)
    // HSL: Hue=210 (blue), Saturation=70%, Lightness varies from 25% to 65%
    const minLightness = 25; // Darkest (newest)
    const maxLightness = 65; // Lightest (oldest)

    const lightness = minLightness + (seasonIndex / (totalSeasons - 1)) * (maxLightness - minLightness);

    return `hsl(210, 70%, ${lightness}%)`;
}

/**
 * Format season label from start year
 * @param {number} startYear - Starting year of season (e.g., 2023)
 * @returns {string} Formatted label (e.g., "2023-24")
 */
function formatSeasonLabel(startYear) {
    if (typeof startYear !== 'number' || isNaN(startYear) || !isFinite(startYear) || startYear < 1000 || startYear > 9999) {
        return 'Invalid';
    }

    const endYear = startYear + 1;
    const endYearShort = String(endYear).slice(-2); // Last 2 digits

    return `${startYear}-${endYearShort}`;
}

// Highlight state management
let highlightState = {
    highlightedDatasetIndex: null,
    isToggled: false // For mobile tap-to-toggle
};

/**
 * Highlight a specific series (for hover on desktop)
 * @param {Chart} chart - Chart.js instance
 * @param {number} datasetIndex - Index of dataset to highlight
 */
function highlightSeries(chart, datasetIndex) {
    chart.data.datasets.forEach((dataset, index) => {
        if (index === datasetIndex) {
            dataset.borderWidth = 4; // Thicker line for highlighted
            dataset.borderColor = dataset.borderColor.replace(/[\d.]+\)$/, '1)'); // Full opacity
        } else {
            dataset.borderWidth = 2;
            dataset.borderColor = dataset.borderColor.replace(/[\d.]+\)$/, '0.3)'); // Dimmed
        }
    });

    chart.update('none'); // Update without animation
}

/**
 * Clear all highlighting (restore normal display)
 * @param {Chart} chart - Chart.js instance
 */
function clearHighlight(chart) {
    highlightState.highlightedDatasetIndex = null;
    highlightState.isToggled = false;

    chart.data.datasets.forEach((dataset, index) => {
        dataset.borderWidth = 2;
        const color = getSeasonColor(index, chart.data.datasets.length);
        dataset.borderColor = color;
    });

    chart.update('none');
}

/**
 * Toggle highlight state for mobile tap interaction
 * @param {Chart} chart - Chart.js instance
 * @param {number} datasetIndex - Index of dataset to toggle
 */
function toggleHighlight(chart, datasetIndex) {
    if (highlightState.highlightedDatasetIndex === datasetIndex && highlightState.isToggled) {
        // Tapped the same series again - clear highlight
        clearHighlight(chart);
    } else {
        // Highlight this series
        highlightState.highlightedDatasetIndex = datasetIndex;
        highlightState.isToggled = true;
        highlightSeries(chart, datasetIndex);
    }
}

/**
 * Add season labels at the right end of each series
 * @param {Chart} chart - Chart.js instance
 */
function addSeasonLabels(chart) {
    // This will be called after chart render to position labels
    // For now, we'll rely on Chart.js built-in legend or tooltip
    // In a future enhancement, we could add custom canvas text rendering
}

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initChart,
        updateChart,
        getSeasonColor,
        formatSeasonLabel,
        highlightSeries,
        clearHighlight,
        toggleHighlight,
        addSeasonLabels
    };
} else if (typeof window !== 'undefined') {
    // Make functions available globally in browser
    window.initChart = initChart;
    window.updateChart = updateChart;
    window.getSeasonColor = getSeasonColor;
    window.formatSeasonLabel = formatSeasonLabel;
    window.highlightSeries = highlightSeries;
    window.clearHighlight = clearHighlight;
    window.toggleHighlight = toggleHighlight;
    window.addSeasonLabels = addSeasonLabels;
}