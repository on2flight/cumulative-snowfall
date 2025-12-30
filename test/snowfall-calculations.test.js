/**
 * Property-based tests for snowfall calculations
 * Feature: snowfall-tracker
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');
const { calculateDailySnowfall, calculateCumulative } = require('../js/snowfall-calculations.js');

// Property 1: Daily Snowfall Calculation
// Feature: snowfall-tracker, Property 1: Daily snowfall calculation from snow depth changes
test('Property 1: Daily Snowfall Calculation - positive changes only', async () => {
    await fc.assert(
        fc.property(
            fc.array(fc.float({ min: 0, max: 500, noNaN: true }), { minLength: 2, maxLength: 100 }),
            (depths) => {
                const dailySnowfall = calculateDailySnowfall(depths);

                // Property: For any sequence of snow depth measurements,
                // daily snowfall should equal max(0, depth[N] - depth[N-1])

                // Check length
                assert.strictEqual(dailySnowfall.length, depths.length);

                // First day should always be 0 (no previous day)
                assert.strictEqual(dailySnowfall[0], 0);

                // Check each subsequent day
                for (let i = 1; i < depths.length; i++) {
                    const expectedSnowfall = Math.max(0, depths[i] - depths[i - 1]);
                    assert.strictEqual(
                        dailySnowfall[i],
                        expectedSnowfall,
                        `Day ${i}: expected ${expectedSnowfall}, got ${dailySnowfall[i]} (depths: ${depths[i - 1]} -> ${depths[i]})`
                    );
                }

                // All values should be non-negative
                for (let i = 0; i < dailySnowfall.length; i++) {
                    assert.ok(
                        dailySnowfall[i] >= 0,
                        `Daily snowfall at index ${i} should be non-negative, got ${dailySnowfall[i]}`
                    );
                }
            }
        ),
        { numRuns: 100 }
    );
});

// Property 2: Cumulative Snowfall Consistency
// Feature: snowfall-tracker, Property 2: Cumulative snowfall consistency with daily values
test('Property 2: Cumulative Snowfall Consistency - running sum of daily values', async () => {
    await fc.assert(
        fc.property(
            fc.array(fc.float({ min: 0, max: 50, noNaN: true }), { minLength: 1, maxLength: 100 }),
            (dailyValues) => {
                const cumulative = calculateCumulative(dailyValues);

                // Property: For any season's daily snowfall array,
                // cumulative snowfall at index N should equal sum of daily values [0..N]

                // Check length
                assert.strictEqual(cumulative.length, dailyValues.length);

                // Check each cumulative value
                let expectedSum = 0;
                for (let i = 0; i < dailyValues.length; i++) {
                    expectedSum += dailyValues[i];
                    assert.ok(
                        Math.abs(cumulative[i] - expectedSum) < 0.0001,
                        `Cumulative at index ${i}: expected ${expectedSum}, got ${cumulative[i]}`
                    );
                }

                // Cumulative values should be non-decreasing
                for (let i = 1; i < cumulative.length; i++) {
                    assert.ok(
                        cumulative[i] >= cumulative[i - 1],
                        `Cumulative values should be non-decreasing: ${cumulative[i - 1]} -> ${cumulative[i]} at index ${i}`
                    );
                }

                // All values should be non-negative
                for (let i = 0; i < cumulative.length; i++) {
                    assert.ok(
                        cumulative[i] >= 0,
                        `Cumulative snowfall at index ${i} should be non-negative, got ${cumulative[i]}`
                    );
                }
            }
        ),
        { numRuns: 100 }
    );
});

// Combined property test: Daily calculation followed by cumulative calculation
// Feature: snowfall-tracker, Property 1+2: End-to-end snowfall calculation pipeline
test('Combined Property: Daily then Cumulative calculation pipeline', async () => {
    await fc.assert(
        fc.property(
            fc.array(fc.float({ min: 0, max: 500, noNaN: true }), { minLength: 2, maxLength: 50 }),
            (depths) => {
                const dailySnowfall = calculateDailySnowfall(depths);
                const cumulative = calculateCumulative(dailySnowfall);

                // Property: The pipeline should maintain consistency
                assert.strictEqual(dailySnowfall.length, depths.length);
                assert.strictEqual(cumulative.length, dailySnowfall.length);

                // Final cumulative should equal sum of all daily snowfall
                const totalDaily = dailySnowfall.reduce((sum, daily) => sum + daily, 0);
                const finalCumulative = cumulative[cumulative.length - 1];

                assert.ok(
                    Math.abs(finalCumulative - totalDaily) < 0.0001,
                    `Final cumulative (${finalCumulative}) should equal sum of daily values (${totalDaily})`
                );

                // Cumulative should never exceed total possible snowfall
                // (sum of all positive depth changes)
                let maxPossibleSnowfall = 0;
                for (let i = 1; i < depths.length; i++) {
                    if (depths[i] > depths[i - 1]) {
                        maxPossibleSnowfall += (depths[i] - depths[i - 1]);
                    }
                }

                assert.ok(
                    finalCumulative <= maxPossibleSnowfall + 0.0001,
                    `Final cumulative (${finalCumulative}) should not exceed max possible (${maxPossibleSnowfall})`
                );
            }
        ),
        { numRuns: 100 }
    );
});

// Edge case property tests
test('Edge cases: Empty and single-element arrays', () => {
    // Empty arrays
    assert.deepStrictEqual(calculateDailySnowfall([]), []);
    assert.deepStrictEqual(calculateCumulative([]), []);

    // Single element
    assert.deepStrictEqual(calculateDailySnowfall([10]), [0]);
    assert.deepStrictEqual(calculateCumulative([5]), [5]);

    // Two elements with no change
    assert.deepStrictEqual(calculateDailySnowfall([10, 10]), [0, 0]);

    // Two elements with decrease (melt)
    assert.deepStrictEqual(calculateDailySnowfall([10, 5]), [0, 0]);

    // Two elements with increase (snowfall)
    assert.deepStrictEqual(calculateDailySnowfall([5, 10]), [0, 5]);
});