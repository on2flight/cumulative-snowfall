/**
 * Property-based tests for chart manager functions
 * Feature: snowfall-tracker
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

// Import functions from chart-manager.js
const {
    getSeasonColor,
    formatSeasonLabel
} = require('../js/chart-manager.js');

// Property 4: Color Gradient Ordering
// Feature: snowfall-tracker, Property 4: Color gradient ordering from dark to light
test('Property 4: Color Gradient Ordering - newest seasons are darkest', async () => {
    await fc.assert(
        fc.property(
            // Generate number of seasons (at least 2 to test ordering)
            fc.integer({ min: 2, max: 20 }),
            (totalSeasons) => {
                // Property: For any set of N seasons ordered by year (newest first),
                // the color assigned to season at index i should have higher blue intensity
                // than the color assigned to season at index i+1

                const colors = [];
                for (let i = 0; i < totalSeasons; i++) {
                    colors.push(getSeasonColor(i, totalSeasons));
                }

                // Parse HSL colors and extract lightness values
                const lightnessValues = colors.map(color => {
                    // Expected format: "hsl(210, 70%, XX%)"
                    const match = color.match(/hsl\(\d+,\s*\d+%,\s*(\d+(?:\.\d+)?)%\)/);
                    assert.ok(match, `Color should be in HSL format: ${color}`);
                    return parseFloat(match[1]);
                });

                // Verify that lightness increases with index (darker to lighter)
                for (let i = 0; i < lightnessValues.length - 1; i++) {
                    assert.ok(
                        lightnessValues[i] <= lightnessValues[i + 1],
                        `Season ${i} lightness (${lightnessValues[i]}%) should be <= season ${i + 1} lightness (${lightnessValues[i + 1]}%)`
                    );
                }

                // Verify reasonable lightness range (25% to 65% based on implementation)
                lightnessValues.forEach((lightness, index) => {
                    assert.ok(
                        lightness >= 24 && lightness <= 66, // Allow small floating point variance
                        `Season ${index} lightness (${lightness}%) should be in reasonable range [25%, 65%]`
                    );
                });

                // Verify all colors have same hue and saturation (blue gradient)
                colors.forEach((color, index) => {
                    assert.ok(
                        color.includes('hsl(210, 70%'),
                        `Season ${index} color should have hue 210 and saturation 70%: ${color}`
                    );
                });

                // Verify first season (newest) is darkest
                assert.ok(
                    lightnessValues[0] <= lightnessValues[lightnessValues.length - 1],
                    `Newest season (${lightnessValues[0]}%) should be darker than oldest (${lightnessValues[lightnessValues.length - 1]}%)`
                );
            }
        ),
        { numRuns: 100 }
    );
});

// Property 5: Season Label Format
// Feature: snowfall-tracker, Property 5: Season label formatting consistency
test('Property 5: Season Label Format - YYYY-YY format consistency', async () => {
    await fc.assert(
        fc.property(
            // Generate valid start years
            fc.integer({ min: 1900, max: 2099 }),
            (startYear) => {
                const label = formatSeasonLabel(startYear);

                // Property: For any season starting in year Y,
                // the formatted label should be "Y-(Y+1 mod 100)" with proper zero-padding

                const expectedEndYear = startYear + 1;
                const expectedEndYearShort = String(expectedEndYear).slice(-2);
                const expectedLabel = `${startYear}-${expectedEndYearShort}`;

                assert.strictEqual(
                    label,
                    expectedLabel,
                    `Start year ${startYear} should format as "${expectedLabel}", got "${label}"`
                );

                // Verify format pattern: YYYY-YY
                const formatPattern = /^\d{4}-\d{2}$/;
                assert.ok(
                    formatPattern.test(label),
                    `Label "${label}" should match pattern YYYY-YY`
                );

                // Verify the year parts are correct
                const [yearPart, shortYearPart] = label.split('-');
                assert.strictEqual(
                    parseInt(yearPart),
                    startYear,
                    `Year part should be ${startYear}, got ${yearPart}`
                );

                // Verify short year is last 2 digits of next year
                const expectedShortYear = String(startYear + 1).slice(-2);
                assert.strictEqual(
                    shortYearPart,
                    expectedShortYear,
                    `Short year part should be ${expectedShortYear}, got ${shortYearPart}`
                );

                // Verify short year is always 2 digits (zero-padded)
                assert.strictEqual(
                    shortYearPart.length,
                    2,
                    `Short year part should be 2 digits, got "${shortYearPart}"`
                );
            }
        ),
        { numRuns: 100 }
    );
});

// Edge case tests for chart utilities
test('Edge cases: Chart utility functions', () => {
    // getSeasonColor edge cases

    // Single season should return dark blue
    const singleSeasonColor = getSeasonColor(0, 1);
    assert.strictEqual(singleSeasonColor, '#1a365d', 'Single season should be dark blue');

    // Zero seasons (edge case)
    const zeroSeasonColor = getSeasonColor(0, 0);
    assert.strictEqual(zeroSeasonColor, '#1a365d', 'Zero seasons should default to dark blue');

    // Negative index (edge case)
    const negativeIndexColor = getSeasonColor(-1, 5);
    assert.ok(negativeIndexColor.includes('hsl('), 'Negative index should still return HSL color');

    // Index beyond total (edge case)
    const beyondTotalColor = getSeasonColor(10, 5);
    assert.ok(beyondTotalColor.includes('hsl('), 'Index beyond total should still return HSL color');

    // formatSeasonLabel edge cases

    // Year 1999 -> 2000 (century boundary)
    assert.strictEqual(formatSeasonLabel(1999), '1999-00', 'Century boundary 1999-2000');

    // Year 2099 -> 2100 (century boundary)
    assert.strictEqual(formatSeasonLabel(2099), '2099-00', 'Century boundary 2099-2100');

    // Year 2009 -> 2010 (decade boundary with zero padding)
    assert.strictEqual(formatSeasonLabel(2009), '2009-10', 'Decade boundary 2009-2010');

    // Invalid inputs
    assert.strictEqual(formatSeasonLabel(null), 'Invalid', 'Null input should return Invalid');
    assert.strictEqual(formatSeasonLabel(undefined), 'Invalid', 'Undefined input should return Invalid');
    assert.strictEqual(formatSeasonLabel('2023'), 'Invalid', 'String input should return Invalid');
    assert.strictEqual(formatSeasonLabel(999), 'Invalid', 'Year < 1000 should return Invalid');
    assert.strictEqual(formatSeasonLabel(10000), 'Invalid', 'Year > 9999 should return Invalid');
    assert.strictEqual(formatSeasonLabel(NaN), 'Invalid', 'NaN input should return Invalid');
    assert.strictEqual(formatSeasonLabel(Infinity), 'Invalid', 'Infinity input should return Invalid');
});

// Additional property test: Color uniqueness for different season counts
test('Property: Color uniqueness across different season counts', async () => {
    await fc.assert(
        fc.property(
            fc.integer({ min: 2, max: 15 }),
            (totalSeasons) => {
                const colors = [];
                for (let i = 0; i < totalSeasons; i++) {
                    colors.push(getSeasonColor(i, totalSeasons));
                }

                // All colors should be unique (different lightness values)
                const uniqueColors = new Set(colors);
                assert.strictEqual(
                    uniqueColors.size,
                    colors.length,
                    `All ${totalSeasons} colors should be unique`
                );

                // Colors should span a reasonable range
                const lightnessValues = colors.map(color => {
                    const match = color.match(/hsl\(\d+,\s*\d+%,\s*(\d+(?:\.\d+)?)%\)/);
                    return parseFloat(match[1]);
                });

                const minLightness = Math.min(...lightnessValues);
                const maxLightness = Math.max(...lightnessValues);
                const range = maxLightness - minLightness;

                if (totalSeasons > 1) {
                    assert.ok(
                        range > 0,
                        `Color range should be > 0 for ${totalSeasons} seasons, got ${range}`
                    );
                }
            }
        ),
        { numRuns: 50 }
    );
});