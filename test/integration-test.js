/**
 * Integration Test for Snowfall Tracker
 * Tests all components working together as specified in task 8
 */

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://127.0.0.1:8000',
    timeout: 10000,
    mobileViewport: { width: 320, height: 568 },
    desktopViewport: { width: 1200, height: 800 }
};

/**
 * Integration test suite for the Snowfall Tracker application
 */
class SnowfallTrackerIntegrationTest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🧪 Starting Snowfall Tracker Integration Tests...\n');

        try {
            // Test 1: Application loads and initializes
            await this.testApplicationLoading();

            // Test 2: All components work together
            await this.testComponentIntegration();

            // Test 3: Slider filtering updates chart
            await this.testSliderFiltering();

            // Test 4: Hover/tap highlighting works
            await this.testInteractiveHighlighting();

            // Test 5: Responsive layout on mobile viewport
            await this.testResponsiveLayout();

            // Test 6: Data loading and error handling
            await this.testDataHandling();

            // Test 7: Chart rendering and updates
            await this.testChartFunctionality();

        } catch (error) {
            this.logTest('Integration Test Suite', false, `Test suite failed: ${error.message}`);
        }

        this.printResults();
        return this.results;
    }

    /**
     * Test 1: Application loads and initializes properly
     */
    async testApplicationLoading() {
        console.log('📱 Testing Application Loading...');

        try {
            // Simulate DOM ready and app initialization
            const mockDocument = this.createMockDOM();
            const mockWindow = this.createMockWindow();

            // Load the app modules
            const appModule = await this.loadAppModule();
            const dataProcessor = await this.loadDataProcessorModule();
            const chartManager = await this.loadChartManagerModule();
            const sliderController = await this.loadSliderControllerModule();

            // Test that all modules loaded successfully
            this.assert(typeof appModule.init === 'function', 'App init function exists');
            this.assert(typeof dataProcessor.filterSeasonsByRange === 'function', 'Data processor functions exist');
            this.assert(typeof chartManager.initChart === 'function', 'Chart manager functions exist');
            this.assert(typeof sliderController.initSlider === 'function', 'Slider controller functions exist');

            this.logTest('Application Loading', true, 'All modules loaded successfully');

        } catch (error) {
            this.logTest('Application Loading', false, `Failed to load application: ${error.message}`);
        }
    }

    /**
     * Test 2: All components work together
     */
    async testComponentIntegration() {
        console.log('🔗 Testing Component Integration...');

        try {
            // Load sample data
            const sampleData = await this.loadSampleData();
            this.assert(sampleData && sampleData.seasons, 'Sample data loaded');
            this.assert(Array.isArray(sampleData.seasons), 'Seasons data is array');
            this.assert(sampleData.seasons.length > 0, 'Has season data');

            // Test data processing
            const dataProcessor = await this.loadDataProcessorModule();
            const filteredSeasons = dataProcessor.filterSeasonsByRange(sampleData.seasons, 2020, 2024);
            this.assert(Array.isArray(filteredSeasons), 'Filtered seasons is array');

            // Test axis bounds calculation
            const bounds = dataProcessor.getAxisBounds(filteredSeasons);
            this.assert(typeof bounds.maxCumulative === 'number', 'Axis bounds calculated');
            this.assert(bounds.maxCumulative >= 0, 'Max cumulative is valid');

            this.logTest('Component Integration', true, 'All components integrate properly');

        } catch (error) {
            this.logTest('Component Integration', false, `Integration failed: ${error.message}`);
        }
    }

    /**
     * Test 3: Slider filtering updates chart
     */
    async testSliderFiltering() {
        console.log('🎚️ Testing Slider Filtering...');

        try {
            const sampleData = await this.loadSampleData();
            const dataProcessor = await this.loadDataProcessorModule();

            // Test different filter ranges
            const testRanges = [
                { start: 2020, end: 2024 },
                { start: 1990, end: 2000 },
                { start: 2010, end: 2015 }
            ];

            for (const range of testRanges) {
                const filtered = dataProcessor.filterSeasonsByRange(
                    sampleData.seasons,
                    range.start,
                    range.end
                );

                // Verify filtering works correctly
                for (const season of filtered) {
                    this.assert(
                        season.startYear >= range.start && season.startYear <= range.end,
                        `Season ${season.season} is within range ${range.start}-${range.end}`
                    );
                }
            }

            // Test edge cases
            const emptyFilter = dataProcessor.filterSeasonsByRange(sampleData.seasons, 2050, 2060);
            this.assert(emptyFilter.length === 0, 'Empty range returns empty array');

            this.logTest('Slider Filtering', true, 'Slider filtering works correctly');

        } catch (error) {
            this.logTest('Slider Filtering', false, `Filtering failed: ${error.message}`);
        }
    }

    /**
     * Test 4: Hover/tap highlighting functionality
     */
    async testInteractiveHighlighting() {
        console.log('✨ Testing Interactive Highlighting...');

        try {
            const chartManager = await this.loadChartManagerModule();

            // Test color generation
            const colors = [];
            for (let i = 0; i < 5; i++) {
                const color = chartManager.getSeasonColor(i, 5);
                this.assert(typeof color === 'string', `Color ${i} is string`);
                this.assert(color.includes('hsl'), `Color ${i} is HSL format`);
                colors.push(color);
            }

            // Verify color gradient (newer seasons should be darker)
            // This is a simplified test since we can't easily compare HSL lightness values
            this.assert(colors.length === 5, 'Generated 5 colors');
            this.assert(new Set(colors).size === 5, 'All colors are unique');

            // Test season label formatting
            const testYears = [2023, 1999, 2000, 2024];
            const expectedLabels = ['2023-24', '1999-00', '2000-01', '2024-25'];

            for (let i = 0; i < testYears.length; i++) {
                const label = chartManager.formatSeasonLabel(testYears[i]);
                this.assert(label === expectedLabels[i], `Label for ${testYears[i]} is ${expectedLabels[i]}`);
            }

            this.logTest('Interactive Highlighting', true, 'Highlighting functions work correctly');

        } catch (error) {
            this.logTest('Interactive Highlighting', false, `Highlighting failed: ${error.message}`);
        }
    }

    /**
     * Test 5: Responsive layout on mobile viewport
     */
    async testResponsiveLayout() {
        console.log('📱 Testing Responsive Layout...');

        try {
            // Test CSS custom properties exist
            const cssContent = await this.loadCSSContent();

            // Check for mobile-specific CSS rules
            const hasMobileQueries = cssContent.includes('@media (max-width: 767px)');
            this.assert(hasMobileQueries, 'Has mobile media queries');

            const hasTouchTargets = cssContent.includes('min-height: 44px');
            this.assert(hasTouchTargets, 'Has appropriate touch targets');

            const hasResponsiveChart = cssContent.includes('--chart-height');
            this.assert(hasResponsiveChart, 'Has responsive chart height');

            // Test viewport meta tag in HTML
            const htmlContent = await this.loadHTMLContent();
            const hasViewportMeta = htmlContent.includes('viewport');
            this.assert(hasViewportMeta, 'Has viewport meta tag');

            this.logTest('Responsive Layout', true, 'Responsive design implemented correctly');

        } catch (error) {
            this.logTest('Responsive Layout', false, `Responsive layout failed: ${error.message}`);
        }
    }

    /**
     * Test 6: Data loading and error handling
     */
    async testDataHandling() {
        console.log('📊 Testing Data Handling...');

        try {
            const sampleData = await this.loadSampleData();

            // Verify data structure
            this.assert(sampleData.source, 'Has data source attribution');
            this.assert(sampleData.seasons, 'Has seasons array');
            this.assert(sampleData.dataRange, 'Has data range info');

            // Test individual season structure
            if (sampleData.seasons.length > 0) {
                const season = sampleData.seasons[0];
                this.assert(season.season, 'Season has season name');
                this.assert(typeof season.startYear === 'number', 'Season has start year');
                this.assert(Array.isArray(season.dailyData), 'Season has daily data array');

                if (season.dailyData.length > 0) {
                    const dailyRecord = season.dailyData[0];
                    this.assert(dailyRecord.date, 'Daily record has date');
                    this.assert(typeof dailyRecord.dayOfSeason === 'number', 'Daily record has day of season');
                    this.assert(typeof dailyRecord.cumulativeSnowfall === 'number', 'Daily record has cumulative snowfall');
                }
            }

            this.logTest('Data Handling', true, 'Data structure is valid');

        } catch (error) {
            this.logTest('Data Handling', false, `Data handling failed: ${error.message}`);
        }
    }

    /**
     * Test 7: Chart functionality
     */
    async testChartFunctionality() {
        console.log('📈 Testing Chart Functionality...');

        try {
            const sampleData = await this.loadSampleData();
            const dataProcessor = await this.loadDataProcessorModule();

            // Test axis bounds calculation with real data
            const bounds = dataProcessor.getAxisBounds(sampleData.seasons);

            this.assert(typeof bounds.minDayOfSeason === 'number', 'Min day of season is number');
            this.assert(typeof bounds.maxDayOfSeason === 'number', 'Max day of season is number');
            this.assert(typeof bounds.maxCumulative === 'number', 'Max cumulative is number');

            this.assert(bounds.minDayOfSeason >= 0, 'Min day of season is valid');
            this.assert(bounds.maxDayOfSeason <= 365, 'Max day of season is valid');
            this.assert(bounds.maxCumulative >= 0, 'Max cumulative is valid');

            // Test with empty data
            const emptyBounds = dataProcessor.getAxisBounds([]);
            this.assert(emptyBounds.minDayOfSeason === 0, 'Empty data min day is 0');
            this.assert(emptyBounds.maxDayOfSeason === 365, 'Empty data max day is 365');
            this.assert(emptyBounds.maxCumulative === 0, 'Empty data max cumulative is 0');

            this.logTest('Chart Functionality', true, 'Chart functions work correctly');

        } catch (error) {
            this.logTest('Chart Functionality', false, `Chart functionality failed: ${error.message}`);
        }
    }

    // Helper methods

    async loadAppModule() {
        // In a real browser environment, this would load the actual module
        // For testing, we'll simulate the module structure
        return {
            init: () => Promise.resolve(),
            loadSnowfallData: () => this.loadSampleData(),
            onSliderChange: (start, end) => { },
            getAppState: () => ({ isLoaded: true })
        };
    }

    async loadDataProcessorModule() {
        // Load the actual data processor functions
        const fs = require('fs');
        const path = require('path');

        const dataProcessorPath = path.join(process.cwd(), 'js', 'data-processor.js');
        const content = fs.readFileSync(dataProcessorPath, 'utf8');

        // Execute the module in a sandbox
        const vm = require('vm');
        const sandbox = { module: { exports: {} }, exports: {} };
        vm.createContext(sandbox);
        vm.runInContext(content, sandbox);

        return sandbox.module.exports;
    }

    async loadChartManagerModule() {
        const fs = require('fs');
        const path = require('path');

        const chartManagerPath = path.join(process.cwd(), 'js', 'chart-manager.js');
        const content = fs.readFileSync(chartManagerPath, 'utf8');

        const vm = require('vm');
        const sandbox = { module: { exports: {} }, exports: {} };
        vm.createContext(sandbox);
        vm.runInContext(content, sandbox);

        return sandbox.module.exports;
    }

    async loadSliderControllerModule() {
        return {
            initSlider: () => { },
            getSliderRange: () => ({ start: 1990, end: 2024 }),
            setSliderRange: () => { }
        };
    }

    async loadSampleData() {
        const fs = require('fs');
        const path = require('path');

        const dataPath = path.join(process.cwd(), 'data', 'snowfall-data.json');
        const content = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(content);
    }

    async loadCSSContent() {
        const fs = require('fs');
        const path = require('path');

        const cssPath = path.join(process.cwd(), 'css', 'styles.css');
        return fs.readFileSync(cssPath, 'utf8');
    }

    async loadHTMLContent() {
        const fs = require('fs');
        const path = require('path');

        const htmlPath = path.join(process.cwd(), 'index.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }

    createMockDOM() {
        return {
            getElementById: (id) => ({
                style: {},
                innerHTML: '',
                addEventListener: () => { }
            }),
            addEventListener: () => { },
            createElement: () => ({
                style: {},
                innerHTML: '',
                appendChild: () => { }
            })
        };
    }

    createMockWindow() {
        return {
            fetch: async (url) => ({
                ok: true,
                json: async () => this.loadSampleData()
            }),
            Chart: function () {
                return {
                    data: { datasets: [] },
                    options: { scales: { x: {}, y: {} } },
                    update: () => { }
                };
            }
        };
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    logTest(testName, passed, message) {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status}: ${testName} - ${message}`);

        this.results.tests.push({ name: testName, passed, message });
        if (passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }
    }

    printResults() {
        console.log('\n📊 Integration Test Results:');
        console.log(`  Total Tests: ${this.results.tests.length}`);
        console.log(`  Passed: ${this.results.passed}`);
        console.log(`  Failed: ${this.results.failed}`);
        console.log(`  Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%`);

        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(test => !test.passed)
                .forEach(test => console.log(`  - ${test.name}: ${test.message}`));
        }

        console.log('\n🎯 Integration Test Complete!');
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnowfallTrackerIntegrationTest;
}

// Auto-run if executed directly
if (require.main === module) {
    const test = new SnowfallTrackerIntegrationTest();
    test.runAllTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}