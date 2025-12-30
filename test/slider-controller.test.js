/**
 * Property-based tests for slider controller functions
 * Feature: snowfall-tracker
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

// Mock DOM environment for testing
global.document = {
    getElementById: () => null,
    createElement: () => ({ id: '', textContent: '', style: {}, appendChild: () => { } }),
    head: { appendChild: () => { } }
};

// Import functions from slider-controller.js
const {
    initSlider,
    getSliderRange,
    setSliderRange
} = require('../js/slider-controller.js');

// Property 7: Slider Bounds Match Data
// Feature: snowfall-tracker, Property 7: Slider bounds match loaded data range
test('Property 7: Slider Bounds Match Data', async () => {
    await fc.assert(
        fc.property(
            // Generate realistic year ranges for snowfall data
            fc.integer({ min: 1990, max: 2020 }), // minYear
            fc.integer({ min: 2021, max: 2030 }), // maxYear
            (minYear, maxYear) => {
                // Property: For any loaded dataset, the slider's minimum value should equal
                // the earliest season's start year, and the maximum value should equal
                // the most recent season's start year

                // Mock container element
                const mockContainer = {
                    innerHTML: '',
                    style: {}
                };

                // Mock getElementById to return our mock container
                const originalGetElementById = global.document.getElementById;
                global.document.getElementById = (id) => {
                    if (id === 'test-slider-container') {
                        return mockContainer;
                    }
                    return null;
                };

                let onChangeCallCount = 0;
                let lastOnChangeArgs = null;

                const mockOnChange = (start, end) => {
                    onChangeCallCount++;
                    lastOnChangeArgs = { start, end };
                };

                try {
                    // Initialize slider with test data bounds
                    initSlider('test-slider-container', minYear, maxYear, mockOnChange);

                    // Get initial slider range
                    const initialRange = getSliderRange();

                    // Verify slider bounds match the provided data range
                    assert.strictEqual(
                        initialRange.start,
                        minYear,
                        `Slider start should match data minimum year: expected ${minYear}, got ${initialRange.start}`
                    );

                    assert.strictEqual(
                        initialRange.end,
                        maxYear,
                        `Slider end should match data maximum year: expected ${maxYear}, got ${initialRange.end}`
                    );

                    // Verify slider range is valid
                    assert.ok(
                        initialRange.start <= initialRange.end,
                        `Slider start (${initialRange.start}) should be <= end (${initialRange.end})`
                    );

                    // Verify bounds are within reasonable range for snowfall data
                    assert.ok(
                        initialRange.start >= 1900 && initialRange.start <= 2100,
                        `Slider start year should be reasonable: ${initialRange.start}`
                    );

                    assert.ok(
                        initialRange.end >= 1900 && initialRange.end <= 2100,
                        `Slider end year should be reasonable: ${initialRange.end}`
                    );

                    // Test setSliderRange functionality
                    const testStart = minYear + Math.floor((maxYear - minYear) * 0.25);
                    const testEnd = minYear + Math.floor((maxYear - minYear) * 0.75);

                    setSliderRange(testStart, testEnd);
                    const updatedRange = getSliderRange();

                    assert.strictEqual(
                        updatedRange.start,
                        testStart,
                        `Updated slider start should match set value: expected ${testStart}, got ${updatedRange.start}`
                    );

                    assert.strictEqual(
                        updatedRange.end,
                        testEnd,
                        `Updated slider end should match set value: expected ${testEnd}, got ${updatedRange.end}`
                    );

                    // Verify onChange callback was called
                    assert.ok(
                        onChangeCallCount > 0,
                        'onChange callback should be called when slider range is set'
                    );

                    assert.deepStrictEqual(
                        lastOnChangeArgs,
                        { start: testStart, end: testEnd },
                        'onChange callback should receive correct arguments'
                    );

                } finally {
                    // Restore original getElementById
                    global.document.getElementById = originalGetElementById;
                }
            }
        ),
        { numRuns: 100 }
    );
});

// Additional property test: Slider range validation
test('Property: Slider range validation and constraints', async () => {
    await fc.assert(
        fc.property(
            fc.integer({ min: 2000, max: 2020 }),
            fc.integer({ min: 2021, max: 2030 }),
            fc.integer({ min: 2000, max: 2030 }),
            fc.integer({ min: 2000, max: 2030 }),
            (minYear, maxYear, testStart, testEnd) => {
                // Mock container
                const mockContainer = { innerHTML: '', style: {} };
                const originalGetElementById = global.document.getElementById;
                global.document.getElementById = (id) => {
                    return id === 'test-slider-container' ? mockContainer : null;
                };

                let onChangeCallCount = 0;
                const mockOnChange = () => { onChangeCallCount++; };

                try {
                    initSlider('test-slider-container', minYear, maxYear, mockOnChange);

                    // Test setting valid range
                    if (testStart >= minYear && testEnd <= maxYear && testStart <= testEnd) {
                        setSliderRange(testStart, testEnd);
                        const range = getSliderRange();

                        assert.strictEqual(range.start, testStart, 'Valid range should be set correctly');
                        assert.strictEqual(range.end, testEnd, 'Valid range should be set correctly');
                        assert.ok(onChangeCallCount > 0, 'onChange should be called for valid range');
                    }

                    // Test setting invalid range (should be rejected or corrected)
                    const initialRange = getSliderRange();
                    const initialCallCount = onChangeCallCount;

                    // Try to set invalid range
                    if (testStart > testEnd || testStart < minYear || testEnd > maxYear) {
                        setSliderRange(testStart, testEnd);
                        const rangeAfterInvalid = getSliderRange();

                        // Range should either be unchanged or corrected to valid values
                        assert.ok(
                            rangeAfterInvalid.start >= minYear && rangeAfterInvalid.end <= maxYear,
                            'Range should remain within bounds after invalid input'
                        );
                        assert.ok(
                            rangeAfterInvalid.start <= rangeAfterInvalid.end,
                            'Range should maintain start <= end after invalid input'
                        );
                    }

                } finally {
                    global.document.getElementById = originalGetElementById;
                }
            }
        ),
        { numRuns: 100 }
    );
});

// Edge case tests for slider controller
test('Edge cases: Slider controller functions', () => {
    const mockContainer = { innerHTML: '', style: {} };
    const originalGetElementById = global.document.getElementById;

    // Test with missing container
    global.document.getElementById = () => null;

    try {
        assert.throws(
            () => initSlider('nonexistent-container', 2000, 2024, () => { }),
            /Container element.*not found/,
            'Should throw error for missing container'
        );
    } finally {
        global.document.getElementById = originalGetElementById;
    }

    // Test with valid container
    global.document.getElementById = (id) => {
        return id === 'test-container' ? mockContainer : null;
    };

    try {
        // Test single year range
        initSlider('test-container', 2024, 2024, () => { });
        const singleYearRange = getSliderRange();
        assert.strictEqual(singleYearRange.start, 2024, 'Single year range start');
        assert.strictEqual(singleYearRange.end, 2024, 'Single year range end');

        // Test minimum range (2 years)
        initSlider('test-container', 2023, 2024, () => { });
        const minRange = getSliderRange();
        assert.strictEqual(minRange.start, 2023, 'Minimum range start');
        assert.strictEqual(minRange.end, 2024, 'Minimum range end');

        // Test large range
        initSlider('test-container', 1990, 2030, () => { });
        const largeRange = getSliderRange();
        assert.strictEqual(largeRange.start, 1990, 'Large range start');
        assert.strictEqual(largeRange.end, 2030, 'Large range end');

        // Test setSliderRange with boundary values
        setSliderRange(1990, 1990); // Same year
        const boundaryRange = getSliderRange();
        assert.strictEqual(boundaryRange.start, 1990, 'Boundary range start');
        assert.strictEqual(boundaryRange.end, 1990, 'Boundary range end');

    } finally {
        global.document.getElementById = originalGetElementById;
    }
});

// Test slider initialization with callback
test('Slider initialization and callback behavior', () => {
    const mockContainer = { innerHTML: '', style: {} };
    const originalGetElementById = global.document.getElementById;
    global.document.getElementById = (id) => {
        return id === 'callback-test-container' ? mockContainer : null;
    };

    let callbackInvocations = [];
    const testCallback = (start, end) => {
        callbackInvocations.push({ start, end });
    };

    try {
        // Initialize slider
        initSlider('callback-test-container', 2020, 2024, testCallback);

        // Clear previous invocations
        callbackInvocations = [];

        // Test callback is called when range changes
        setSliderRange(2021, 2023);
        assert.strictEqual(callbackInvocations.length, 1, 'Callback should be called once');
        assert.deepStrictEqual(
            callbackInvocations[0],
            { start: 2021, end: 2023 },
            'Callback should receive correct arguments'
        );

        // Test multiple range changes
        setSliderRange(2020, 2022);
        setSliderRange(2022, 2024);
        assert.strictEqual(callbackInvocations.length, 3, 'Callback should be called for each change');

        // Test callback with same range (should still be called)
        setSliderRange(2022, 2024);
        assert.strictEqual(callbackInvocations.length, 4, 'Callback should be called even for same range');

    } finally {
        global.document.getElementById = originalGetElementById;
    }
});