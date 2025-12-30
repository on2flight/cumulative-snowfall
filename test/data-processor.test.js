/**
 * Property-based tests for data processor functions
 * Feature: snowfall-tracker
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

// Import functions from data-processor.js
// Note: These functions need to be exported for testing
const {
    calculateDailySnowfall,
    calculateCumulative,
    filterSeasonsByRange,
    getAxisBounds
} = require('../js/data-processor.js');

// Property 3: Axis Bounds Encompass Data
// Feature: snowfall-tracker, Property 3: Axis bounds encompass all displayed data
test('Property 3: Axis Bounds Encompass Data', async () => {
    await fc.assert(
        fc.property(
            // Generate array of seasons with realistic data
            fc.array(
                fc.record({
                    season: fc.string({ minLength: 7, maxLength: 7 }), // e.g., "2023-24"
                    startYear: fc.integer({ min: 2000, max: 2030 }),
                    dailyData: fc.array(
                        fc.record({
                            date: fc.string(),
                            dayOfSeason: fc.integer({ min: 0, max: 365 }),
                            snowDepth: fc.float({ min: 0, max: 500, noNaN: true }),
                            dailySnowfall: fc.float({ min: 0, max: 50, noNaN: true }),
                            cumulativeSnowfall: fc.float({ min: 0, max: 1000, noNaN: true })
                        }),
                        { minLength: 1, maxLength: 50 }
                    )
                }),
                { minLength: 1, maxLength: 10 }
            ),
            (seasons) => {
                const bounds = getAxisBounds(seasons);

                // Property: For any set of displayed seasons, the chart's Y-axis maximum
                // should be >= the maximum cumulative snowfall value across all displayed seasons,
                // and the X-axis range should span from the earliest first-snow day to the latest last-snow day

                let actualMaxCumulative = 0;
                let actualMinSnowDay = Infinity;
                let actualMaxSnowDay = -Infinity;
                let hasSnowfall = false;

                seasons.forEach(season => {
                    if (season.dailyData && Array.isArray(season.dailyData)) {
                        season.dailyData.forEach(record => {
                            // Track maximum cumulative snowfall
                            if (record.cumulativeSnowfall > actualMaxCumulative) {
                                actualMaxCumulative = record.cumulativeSnowfall;
                            }

                            // Track snow day range (only for days with snowfall)
                            if (record.dailySnowfall > 0) {
                                hasSnowfall = true;
                                if (record.dayOfSeason < actualMinSnowDay) {
                                    actualMinSnowDay = record.dayOfSeason;
                                }
                                if (record.dayOfSeason > actualMaxSnowDay) {
                                    actualMaxSnowDay = record.dayOfSeason;
                                }
                            }
                        });
                    }
                });

                // Y-axis should encompass maximum cumulative snowfall
                assert.ok(
                    bounds.maxCumulative >= actualMaxCumulative,
                    `Y-axis max (${bounds.maxCumulative}) should be >= actual max cumulative (${actualMaxCumulative})`
                );

                // X-axis should encompass snow day range
                if (hasSnowfall) {
                    assert.ok(
                        bounds.minDayOfSeason <= actualMinSnowDay,
                        `X-axis min (${bounds.minDayOfSeason}) should be <= actual min snow day (${actualMinSnowDay})`
                    );
                    assert.ok(
                        bounds.maxDayOfSeason >= actualMaxSnowDay,
                        `X-axis max (${bounds.maxDayOfSeason}) should be >= actual max snow day (${actualMaxSnowDay})`
                    );
                } else {
                    // If no snowfall, should have default bounds
                    assert.ok(bounds.minDayOfSeason >= 0, 'Min day should be non-negative when no snowfall');
                    assert.ok(bounds.maxDayOfSeason <= 365, 'Max day should be <= 365 when no snowfall');
                }

                // Bounds should be reasonable
                assert.ok(bounds.maxCumulative >= 0, 'Max cumulative should be non-negative');
                assert.ok(bounds.minDayOfSeason >= 0, 'Min day of season should be non-negative');
                assert.ok(bounds.maxDayOfSeason <= 365, 'Max day of season should be <= 365');
                assert.ok(bounds.minDayOfSeason <= bounds.maxDayOfSeason, 'Min day should be <= max day');
            }
        ),
        { numRuns: 100 }
    );
});

// Property 8: Season Filtering by Range
// Feature: snowfall-tracker, Property 8: Season filtering by year range
test('Property 8: Season Filtering by Range', async () => {
    await fc.assert(
        fc.property(
            // Generate array of seasons with different start years
            fc.array(
                fc.record({
                    season: fc.string({ minLength: 7, maxLength: 7 }),
                    startYear: fc.integer({ min: 2000, max: 2030 }),
                    totalSnowfall: fc.float({ min: 0, max: 1000, noNaN: true }),
                    dailyData: fc.array(fc.record({
                        date: fc.string(),
                        dayOfSeason: fc.integer({ min: 0, max: 365 }),
                        snowDepth: fc.float({ min: 0, max: 500, noNaN: true }),
                        dailySnowfall: fc.float({ min: 0, max: 50, noNaN: true }),
                        cumulativeSnowfall: fc.float({ min: 0, max: 1000, noNaN: true })
                    }), { minLength: 1, maxLength: 10 })
                }),
                { minLength: 0, maxLength: 20 }
            ),
            // Generate filter range
            fc.integer({ min: 2000, max: 2030 }),
            fc.integer({ min: 2000, max: 2030 }),
            (seasons, startYear, endYear) => {
                // Ensure startYear <= endYear
                const actualStartYear = Math.min(startYear, endYear);
                const actualEndYear = Math.max(startYear, endYear);

                const filtered = filterSeasonsByRange(seasons, actualStartYear, actualEndYear);

                // Property: For any slider range [startYear, endYear] and any season with start year Y,
                // the season should be included in filtered results if and only if startYear <= Y <= endYear

                // Check that all filtered seasons are within range
                filtered.forEach(season => {
                    assert.ok(
                        season.startYear >= actualStartYear && season.startYear <= actualEndYear,
                        `Filtered season ${season.season} (year ${season.startYear}) should be within range [${actualStartYear}, ${actualEndYear}]`
                    );
                });

                // Check that all seasons within range are included
                seasons.forEach(season => {
                    const shouldBeIncluded = season.startYear >= actualStartYear && season.startYear <= actualEndYear;
                    const isIncluded = filtered.some(filteredSeason =>
                        filteredSeason.season === season.season &&
                        filteredSeason.startYear === season.startYear
                    );

                    if (shouldBeIncluded) {
                        assert.ok(
                            isIncluded,
                            `Season ${season.season} (year ${season.startYear}) should be included in filtered results`
                        );
                    } else {
                        assert.ok(
                            !isIncluded,
                            `Season ${season.season} (year ${season.startYear}) should NOT be included in filtered results`
                        );
                    }
                });

                // Filtered array should not be longer than original
                assert.ok(
                    filtered.length <= seasons.length,
                    `Filtered array length (${filtered.length}) should not exceed original length (${seasons.length})`
                );

                // All filtered seasons should exist in original array
                filtered.forEach(filteredSeason => {
                    const existsInOriginal = seasons.some(originalSeason =>
                        originalSeason.season === filteredSeason.season &&
                        originalSeason.startYear === filteredSeason.startYear
                    );
                    assert.ok(
                        existsInOriginal,
                        `Filtered season ${filteredSeason.season} should exist in original array`
                    );
                });
            }
        ),
        { numRuns: 100 }
    );
});

// Edge case tests for data processor functions
test('Edge cases: Data processor functions', () => {
    // filterSeasonsByRange edge cases
    assert.deepStrictEqual(filterSeasonsByRange([], 2020, 2024), []);
    assert.deepStrictEqual(filterSeasonsByRange(null, 2020, 2024), []);
    assert.deepStrictEqual(filterSeasonsByRange(undefined, 2020, 2024), []);

    const testSeasons = [
        { season: '2019-20', startYear: 2019 },
        { season: '2020-21', startYear: 2020 },
        { season: '2021-22', startYear: 2021 },
        { season: '2022-23', startYear: 2022 }
    ];

    // Filter with exact range
    const filtered = filterSeasonsByRange(testSeasons, 2020, 2021);
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.some(s => s.startYear === 2020));
    assert.ok(filtered.some(s => s.startYear === 2021));

    // Filter with no matches
    const noMatches = filterSeasonsByRange(testSeasons, 2025, 2030);
    assert.strictEqual(noMatches.length, 0);

    // getAxisBounds edge cases
    const emptyBounds = getAxisBounds([]);
    assert.strictEqual(emptyBounds.minDayOfSeason, 0);
    assert.strictEqual(emptyBounds.maxDayOfSeason, 365);
    assert.strictEqual(emptyBounds.maxCumulative, 0);

    const nullBounds = getAxisBounds(null);
    assert.strictEqual(nullBounds.minDayOfSeason, 0);
    assert.strictEqual(nullBounds.maxDayOfSeason, 365);
    assert.strictEqual(nullBounds.maxCumulative, 0);

    // Season with no daily data
    const noDataBounds = getAxisBounds([{ season: '2023-24', startYear: 2023 }]);
    assert.strictEqual(noDataBounds.minDayOfSeason, 0);
    assert.strictEqual(noDataBounds.maxDayOfSeason, 365);
    assert.strictEqual(noDataBounds.maxCumulative, 0);

    // Season with empty daily data
    const emptyDataBounds = getAxisBounds([{
        season: '2023-24',
        startYear: 2023,
        dailyData: []
    }]);
    assert.strictEqual(emptyDataBounds.minDayOfSeason, 0);
    assert.strictEqual(emptyDataBounds.maxDayOfSeason, 365);
    assert.strictEqual(emptyDataBounds.maxCumulative, 0);
});