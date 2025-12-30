// Data processing functions for snowfall calculations

/**
 * Calculate daily snowfall from snow depth changes
 * Rule: snowfall[i] = max(0, depth[i] - depth[i-1])
 * Negative depth changes (settling/melt) produce zero snowfall
 * @param {number[]} depths - Array of snow depth measurements
 * @returns {number[]} Array of daily snowfall values
 */
function calculateDailySnowfall(depths) {
    if (!Array.isArray(depths) || depths.length === 0) {
        return [];
    }

    const dailySnowfall = [];

    // First day has no previous day, so snowfall equals depth (if positive)
    dailySnowfall.push(Math.max(0, depths[0] || 0));

    // For subsequent days, calculate difference from previous day
    for (let i = 1; i < depths.length; i++) {
        const currentDepth = depths[i] || 0;
        const previousDepth = depths[i - 1] || 0;
        const snowfall = Math.max(0, currentDepth - previousDepth);
        dailySnowfall.push(snowfall);
    }

    return dailySnowfall;
}

/**
 * Calculate cumulative snowfall from daily values
 * Rule: cumulative[i] = sum(daily[0..i])
 * @param {number[]} dailyValues - Array of daily snowfall values
 * @returns {number[]} Array of cumulative snowfall values
 */
function calculateCumulative(dailyValues) {
    if (!Array.isArray(dailyValues) || dailyValues.length === 0) {
        return [];
    }

    const cumulative = [];
    let runningTotal = 0;

    for (let i = 0; i < dailyValues.length; i++) {
        runningTotal += dailyValues[i] || 0;
        cumulative.push(runningTotal);
    }

    return cumulative;
}

/**
 * Filter seasons by year range
 * @param {Object[]} seasons - Array of season objects with startYear property
 * @param {number} startYear - Minimum year to include
 * @param {number} endYear - Maximum year to include
 * @returns {Object[]} Filtered array of seasons
 */
function filterSeasonsByRange(seasons, startYear, endYear) {
    if (!Array.isArray(seasons)) {
        return [];
    }

    return seasons.filter(season => {
        const year = season.startYear;
        return year >= startYear && year <= endYear;
    });
}

/**
 * Get axis bounds from season data
 * @param {Object[]} seasons - Array of season objects with dailyData
 * @returns {Object} Axis bounds with min/max day of season and max cumulative
 */
function getAxisBounds(seasons) {
    if (!Array.isArray(seasons) || seasons.length === 0) {
        return {
            minDayOfSeason: 0,
            maxDayOfSeason: 365,
            maxCumulative: 0
        };
    }

    let minDayOfSeason = Infinity;
    let maxDayOfSeason = -Infinity;
    let maxCumulative = 0;

    seasons.forEach(season => {
        if (!season.dailyData || !Array.isArray(season.dailyData)) {
            return;
        }

        season.dailyData.forEach(record => {
            // Find earliest first-snow day (first non-zero snowfall)
            if (record.dailySnowfall > 0 && record.dayOfSeason < minDayOfSeason) {
                minDayOfSeason = record.dayOfSeason;
            }

            // Find latest last-snow day (last non-zero snowfall)
            if (record.dailySnowfall > 0 && record.dayOfSeason > maxDayOfSeason) {
                maxDayOfSeason = record.dayOfSeason;
            }

            // Find maximum cumulative snowfall
            if (record.cumulativeSnowfall > maxCumulative) {
                maxCumulative = record.cumulativeSnowfall;
            }
        });
    });

    // Handle case where no snowfall data exists
    if (minDayOfSeason === Infinity) {
        minDayOfSeason = 0;
    }
    if (maxDayOfSeason === -Infinity) {
        maxDayOfSeason = 365;
    }

    return {
        minDayOfSeason,
        maxDayOfSeason,
        maxCumulative
    };
}

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateDailySnowfall,
        calculateCumulative,
        filterSeasonsByRange,
        getAxisBounds
    };
}