/**
 * Core snowfall calculation functions
 * These functions implement the business logic for calculating daily and cumulative snowfall
 */

/**
 * Calculate daily snowfall from snow depth measurements
 * @param {number[]} depths - Array of snow depth measurements in inches
 * @returns {number[]} Array of daily snowfall amounts (positive changes only)
 */
function calculateDailySnowfall(depths) {
    if (!Array.isArray(depths) || depths.length === 0) {
        return [];
    }

    const dailySnowfall = [0]; // First day has no previous day to compare

    for (let i = 1; i < depths.length; i++) {
        const change = depths[i] - depths[i - 1];
        // Only positive changes count as snowfall (negative = settling/melt)
        dailySnowfall.push(Math.max(0, change));
    }

    return dailySnowfall;
}

/**
 * Calculate cumulative snowfall from daily snowfall amounts
 * @param {number[]} dailyValues - Array of daily snowfall amounts
 * @returns {number[]} Array of cumulative snowfall totals
 */
function calculateCumulative(dailyValues) {
    if (!Array.isArray(dailyValues) || dailyValues.length === 0) {
        return [];
    }

    const cumulative = [];
    let sum = 0;

    for (const daily of dailyValues) {
        sum += daily;
        cumulative.push(sum);
    }

    return cumulative;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateDailySnowfall,
        calculateCumulative
    };
}