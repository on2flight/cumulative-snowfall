# Winter Park Cumulative Snowfall Tracker

[Live Site (GitHub Pages)](https://on2flight.github.io/cumulative-snowfall/)

Static HTML/CSS/JS app for exploring cumulative seasonal snowfall in Winter Park, Colorado, using NOAA station data.

## Features

- Interactive cumulative snowfall chart
- Year range slider for comparing seasons
- Mobile-friendly layout
- NOAA-based dataset (`data/snowfall-data.json`)

## Project Structure

- `index.html`: app entrypoint
- `css/styles.css`: styles
- `js/`: frontend modules
- `data/`: source and generated snowfall data
- `scripts/`: data fetch and processing scripts
- `test/`: Node test suite

## Requirements

- Node.js 18+
- npm
- Optional: Python 3 (for quick local static server)

## Quick Start

```bash
npm install
npm test
python3 -m http.server 8000
```

Then open: `http://127.0.0.1:8000`

## Data Commands

Refresh NOAA data only if the current JSON is older than 24 hours:

```bash
npm run update-data
```

Generate simulated SNOTEL-style historical data:

```bash
npm run generate-data
```

Convert existing NOAA CSV to app JSON:

```bash
node scripts/process-noaa-data.js
```

## Testing

Run all tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Deployment (GitHub Pages)

1. Run `npm test`.
2. Optionally run `npm run update-data`.
3. Commit and push to `main`.
4. In GitHub repository settings, set Pages to deploy from `main` and `/ (root)`.

## Data Notes

- Canonical app data file: `data/snowfall-data.json`
- NOAA source CSV: `data/USC00059175data.csv`
- Station: `USC00059175` (Winter Park, 9,100 ft)
