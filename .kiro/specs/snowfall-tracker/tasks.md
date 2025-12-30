# Implementation Plan: Snowfall Tracker

## Overview

Build a single-page web application displaying cumulative seasonal snowfall for Winter Park, CO. The implementation follows a modular approach with vanilla JavaScript and Chart.js, designed for static hosting on GitHub Pages.

## Tasks

- [x] 1. Set up project structure and static data
  - [x] 1.1 Create project directory structure with index.html, css/, js/, and data/ folders
    - Create index.html with basic HTML5 structure
    - Create styles.css with CSS custom properties for theming
    - Set up responsive layout with mobile-first approach
    - _Requirements: 5.1, 6.1, 6.4_
  - [x] 1.2 Fetch and process SNOTEL data into static JSON file
    - Download historical data from SNOTEL Berthoud Summit (station 335)
    - Process raw data to calculate daily snowfall from snow depth changes
    - Calculate cumulative snowfall for each season
    - Save as data/snowfall-data.json
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.3 Write property tests for snowfall calculations
    - **Property 1: Daily Snowfall Calculation**
    - **Property 2: Cumulative Snowfall Consistency**
    - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 2. Implement data processing module
  - [x] 2.1 Create data-processor.js with calculation functions
    - Implement calculateDailySnowfall(depths) function
    - Implement calculateCumulative(dailyValues) function
    - Implement filterSeasonsByRange(seasons, startYear, endYear) function
    - Implement getAxisBounds(seasons) function
    - _Requirements: 1.3, 1.5, 2.4, 2.5, 4.3_
  - [x] 2.2 Write property tests for data processor
    - **Property 3: Axis Bounds Encompass Data**
    - **Property 8: Season Filtering by Range**
    - **Validates: Requirements 2.4, 2.5, 4.3**

- [x] 3. Implement chart visualization
  - [x] 3.1 Create chart-manager.js with Chart.js integration
    - Implement initChart(canvasId, seasons) function
    - Implement updateChart(chart, seasons) function
    - Configure Chart.js for line chart with multiple datasets
    - Set up X-axis for calendar months (Aug-Jul)
    - Set up Y-axis for cumulative inches with dynamic scaling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 3.2 Implement color gradient and labeling
    - Implement getSeasonColor(seasonIndex, totalSeasons) function
    - Implement formatSeasonLabel(startYear) function
    - Apply dark-to-light blue gradient (newest = darkest)
    - Add season labels at right end of each series
    - _Requirements: 2.6, 2.7_
  - [x] 3.3 Write property tests for chart utilities
    - **Property 4: Color Gradient Ordering**
    - **Property 5: Season Label Format**
    - **Validates: Requirements 2.6, 2.7**

- [ ] 4. Checkpoint - Verify core visualization
  - Ensure chart renders with sample data
  - Verify color gradient and labels display correctly
  - Ask the user if questions arise

- [ ] 5. Implement interactive highlighting
  - [ ] 5.1 Add hover/tap highlighting to chart
    - Implement highlight state management
    - Add Chart.js hover event handlers for desktop
    - Add touch event handlers for mobile tap-to-toggle
    - Style highlighted series with increased thickness
    - Dim non-highlighted series when one is selected
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ] 5.2 Write property test for highlight toggle
    - **Property 6: Highlight State Toggle**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 6. Implement year range slider
  - [ ] 6.1 Create slider-controller.js with range slider
    - Implement initSlider(containerId, minYear, maxYear, onChange) function
    - Create dual-handle range slider UI
    - Display min/max year labels dynamically
    - Wire onChange callback to filter chart data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 6.2 Write property test for slider bounds
    - **Property 7: Slider Bounds Match Data**
    - **Validates: Requirements 4.1**

- [ ] 7. Implement main application
  - [ ] 7.1 Create app.js to orchestrate components
    - Implement init() function as entry point
    - Load data and show loading indicator
    - Initialize slider with data bounds
    - Initialize chart with all seasons
    - Wire slider changes to chart updates
    - Hide loading indicator when ready
    - _Requirements: 1.1, 1.6, 4.5_
  - [ ] 7.2 Add data source attribution
    - Add footer with SNOTEL attribution text
    - Include methodology note about snow depth calculation
    - Ensure attribution is visible without scrolling on desktop
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 8. Checkpoint - Full integration test
  - Ensure all components work together
  - Test slider filtering updates chart
  - Test hover/tap highlighting
  - Verify responsive layout on mobile viewport
  - Ask the user if questions arise

- [ ] 9. Final polish and deployment prep
  - [ ] 9.1 Add responsive styling and mobile optimizations
    - Ensure chart is readable on 320px viewport
    - Size touch targets appropriately for mobile
    - Test slider usability on touch devices
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 9.2 Verify GitHub Pages compatibility
    - Ensure all paths are relative
    - Test loading from file:// protocol
    - Verify no build step required
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Notes

- All tasks including property tests are required
- Property tests use fast-check library for JavaScript
- Each property test should run minimum 100 iterations
- SNOTEL data processing (task 1.2) may require a one-time Node.js script to fetch and transform data
