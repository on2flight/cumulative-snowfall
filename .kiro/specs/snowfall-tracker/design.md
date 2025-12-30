# Design Document: Snowfall Tracker

## Overview

A single-page web application that visualizes cumulative seasonal snowfall for Winter Park, CO using NOAA weather station data. The app displays overlaid line charts comparing multiple ski seasons, with interactive highlighting and year range filtering. Built as a static site for GitHub Pages hosting.

### Technology Stack

- **Frontend**: Vanilla JavaScript (no framework)
- **Charting**: Chart.js v4 (lightweight, interactive, mobile-friendly)
- **Styling**: CSS3 with CSS custom properties for theming
- **Data**: Pre-bundled JSON file with processed NOAA GHCND data
- **Hosting**: GitHub Pages (static files only)

### Design Rationale

- **Vanilla JS over React/Vue**: Simpler deployment, no build step, smaller bundle size
- **Chart.js over D3**: Easier to implement interactive line charts with hover/touch events
- **Static JSON over live API**: Faster load times, no CORS issues, works offline
- **NOAA data over SNOTEL**: Direct Winter Park measurements, 35+ year history, real data

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Header                            │   │
│  │  "Winter Park Cumulative Snowfall"                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Year Range Slider                       │   │
│  │  [2014] ════════●════════●════════ [2024]           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                  Chart Component                     │   │
│  │     Y-axis: Cumulative Inches                       │   │
│  │     X-axis: Calendar Months (Aug-Jul)               │   │
│  │     Lines: One per season, color-coded              │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Footer                            │   │
│  │  Data: SNOTEL Berthoud Summit | Methodology note    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Data Loader Module (`data-loader.js`)

Responsible for loading and parsing the static JSON data file.

```javascript
// Interface
async function loadSnowfallData(): Promise<SeasonData[]>

// Returns array of season objects, each containing:
interface SeasonData {
  season: string;           // e.g., "2023-24"
  startYear: number;        // e.g., 2023
  dailyData: DailyRecord[]; // Array of daily records
}

interface DailyRecord {
  date: string;             // ISO date string
  dayOfSeason: number;      // Days since Aug 1 (0-365)
  snowDepth: number;        // Snow depth in inches
  dailySnowfall: number;    // Calculated daily snowfall
  cumulativeSnowfall: number; // Running total
}
```

### 2. Data Processor Module (`data-processor.js`)

Transforms raw NOAA GHCND data into chart-ready format.

```javascript
// Process NOAA daily snowfall data (already measured, no calculation needed)
function processDailySnowfall(snowfallValues: number[]): number[]
// Rule: Use SNOW column values directly, handle missing/trace values

// Calculate cumulative snowfall
function calculateCumulative(dailyValues: number[]): number[]
// Rule: cumulative[i] = sum(daily[0..i])

// Filter seasons by year range
function filterSeasonsByRange(
  seasons: SeasonData[],
  startYear: number,
  endYear: number
): SeasonData[]

// Get axis bounds from data
function getAxisBounds(seasons: SeasonData[]): AxisBounds
interface AxisBounds {
  minDayOfSeason: number;  // Earliest first-snow day
  maxDayOfSeason: number;  // Latest last-snow day
  maxCumulative: number;   // Highest cumulative value
}
```

### 3. Chart Manager (`chart-manager.js`)

Manages Chart.js instance and interactions.

```javascript
// Initialize chart with data
function initChart(canvasId: string, seasons: SeasonData[]): Chart

// Update chart with filtered data
function updateChart(chart: Chart, seasons: SeasonData[]): void

// Generate color for season based on age
function getSeasonColor(seasonIndex: number, totalSeasons: number): string
// Rule: Most recent = darkest blue, oldest = lightest blue

// Format season label
function formatSeasonLabel(startYear: number): string
// Rule: Returns "YYYY-YY" format (e.g., "2023-24")

// Handle highlight state
interface HighlightState {
  highlightedSeason: string | null;
}
function toggleHighlight(state: HighlightState, season: string): void
```

### 4. Slider Controller (`slider-controller.js`)

Manages the year range slider UI.

```javascript
// Initialize slider with data bounds
function initSlider(
  containerId: string,
  minYear: number,
  maxYear: number,
  onChange: (start: number, end: number) => void
): void

// Get current slider values
function getSliderRange(): { start: number, end: number }
```

### 5. Main Application (`app.js`)

Orchestrates all components.

```javascript
// Application entry point
async function init(): void {
  // 1. Show loading indicator
  // 2. Load data
  // 3. Initialize slider with data bounds
  // 4. Initialize chart with all seasons
  // 5. Wire up slider change handler
  // 6. Hide loading indicator
}
```

## Data Models

### Static Data File Structure (`data/snowfall-data.json`)

```json
{
  "source": "NOAA Winter Park Station (USC00059175)",
  "elevation": 9100,
  "units": "inches",
  "lastUpdated": "2025-12-30",
  "dataRange": "1990-2025",
  "seasons": [
    {
      "season": "2024-25",
      "startYear": 2024,
      "totalSnowfall": 45.2,
      "dailyData": [
        {
          "date": "2024-10-15",
          "dayOfSeason": 75,
          "snowDepth": 12,
          "dailySnowfall": 5,
          "cumulativeSnowfall": 5
        }
      ]
    }
  ]
}
```

### Chart.js Dataset Structure

```javascript
{
  labels: [0, 1, 2, ...365],  // Day of season
  datasets: [
    {
      label: "2023-24",
      data: [{x: 75, y: 5}, {x: 76, y: 8}, ...],
      borderColor: "#1a365d",  // Dark blue for current
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1
    },
    {
      label: "2022-23",
      data: [...],
      borderColor: "#3182ce",  // Lighter blue
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Daily Snowfall Processing

*For any* sequence of NOAA daily snowfall measurements, the processed daily snowfall values should preserve the original measurements while handling missing values (null/undefined) and trace amounts ("T") appropriately by converting them to 0.

**Validates: Requirements 1.3**

### Property 2: Cumulative Snowfall Consistency

*For any* season's daily snowfall array, the cumulative snowfall value at index N should equal the sum of all daily snowfall values from index 0 through N.

**Validates: Requirements 1.4**

### Property 3: Axis Bounds Encompass Data

*For any* set of displayed seasons, the chart's Y-axis maximum should be greater than or equal to the maximum cumulative snowfall value across all displayed seasons, and the X-axis range should span from the earliest first-snow day to the latest last-snow day.

**Validates: Requirements 2.4, 2.5**

### Property 4: Color Gradient Ordering

*For any* set of N seasons ordered by year (newest first), the color assigned to season at index i should have higher blue intensity than the color assigned to season at index i+1.

**Validates: Requirements 2.6**

### Property 5: Season Label Format

*For any* season starting in year Y, the formatted label should be the string "Y-(Y+1 mod 100)" with proper zero-padding (e.g., 2023 → "2023-24", 1999 → "1999-00").

**Validates: Requirements 2.7**

### Property 6: Highlight State Toggle

*For any* series in any highlight state, invoking the toggle function should flip the state: if highlighted, become unhighlighted; if unhighlighted, become highlighted.

**Validates: Requirements 3.3, 3.4**

### Property 7: Slider Bounds Match Data

*For any* loaded dataset, the slider's minimum value should equal the earliest season's start year (1990), and the maximum value should equal the most recent season's start year.

**Validates: Requirements 4.1**

### Property 8: Season Filtering by Range

*For any* slider range [startYear, endYear] and any season with start year Y, the season should be included in the filtered results if and only if startYear ≤ Y ≤ endYear.

**Validates: Requirements 4.3**

## Error Handling

### Data Loading Errors

- If JSON file fails to load: Display error message with retry button
- If JSON is malformed: Display error message indicating data corruption

### Missing Data

- Days with missing snow depth: Interpolate or skip (mark as null in chart)
- Seasons with insufficient data (<30 days): Exclude from display with console warning

### Browser Compatibility

- If Chart.js fails to load: Display fallback message
- If browser doesn't support ES6: Display upgrade message

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

- Data loading from JSON file
- Season label formatting edge cases (year 1999→2000, 2099→2100)
- Empty data handling
- Single-season display

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs. Each property test should run a minimum of 100 iterations.

**Testing Framework**: fast-check (JavaScript property-based testing library)

**Test Annotations**: Each test must reference its design property using the format:
`// Feature: snowfall-tracker, Property N: [property description]`

Properties to test:
1. Daily snowfall calculation (Property 1)
2. Cumulative snowfall consistency (Property 2)
3. Axis bounds encompass data (Property 3)
4. Color gradient ordering (Property 4)
5. Season label formatting (Property 5)
6. Highlight state toggle (Property 6)
7. Slider bounds match data (Property 7)
8. Season filtering by range (Property 8)

### Integration Tests

- Full application load and render
- Slider interaction updates chart
- Hover/tap highlighting behavior
- Responsive layout at various viewport sizes
