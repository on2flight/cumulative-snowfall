# AGENTS.md

This file defines practical workflows and command conventions for contributors and coding agents in this repository.

## Project Context
- App type: static HTML/CSS/JS snowfall tracker.
- Runtime: Node.js (for tests and data scripts).
- Deploy target: GitHub Pages (no build step).
- Key data artifact: `data/snowfall-data.json`.

## Repository Layout
- `index.html`: app entrypoint.
- `css/styles.css`: styling.
- `js/*.js`: frontend modules.
- `data/`: source and generated snowfall data files.
- `scripts/`: data fetch/processing utilities.
- `test/`: Node test suite.

## Required Environment
- Node.js 18+ (uses built-in `fetch` and `node --test`).
- npm.
- Optional for quick local static serving: Python 3.

## Standard Workflows

### 1) Install dependencies
```bash
npm install
```

### 2) Run tests
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

### 3) Refresh snowfall data from NOAA
This command refreshes data only when `data/snowfall-data.json` is older than 24 hours.
```bash
npm run update-data
```

### 4) Generate simulated SNOTEL-style historical data
Use for local/demo datasets.
```bash
npm run generate-data
```

### 5) Process existing NOAA CSV into app JSON
```bash
node scripts/process-noaa-data.js
```

### 6) Run the static app locally
From repo root:
```bash
python3 -m http.server 8000
```

Open:
- `http://127.0.0.1:8000`

## Command Reference
- `npm test`: runs `node --test test/*.test.js`.
- `npm run test:watch`: reruns tests on file changes.
- `npm run generate-data`: executes `scripts/fetch-snotel-data.js`.
- `npm run update-data`: executes `scripts/update-snowfall-data.js`.
- `node scripts/process-noaa-data.js`: converts `data/USC00059175data.csv` to `data/snowfall-data.json`.

## Data Workflow Notes
- Canonical app data file is `data/snowfall-data.json`.
- NOAA source CSV is `data/USC00059175data.csv`.
- `scripts/update-snowfall-data.js` will:
  - check staleness via `lastUpdated`,
  - fetch latest NOAA CSV when stale,
  - regenerate JSON via `process-noaa-data`.

## Deployment Workflow (GitHub Pages)
1. Run tests: `npm test`.
2. Optionally refresh data: `npm run update-data`.
3. Verify `index.html` is at repository root.
4. Commit and push to `main`.
5. In GitHub Pages settings, deploy from `main` and root (`/`).

## Agent Operating Rules
- Prefer `rg`/`rg --files` for search.
- Keep app static; avoid introducing server-side dependencies.
- Preserve relative asset/data paths for GitHub Pages compatibility.
- When changing data scripts, validate with `npm test` and a quick local smoke test.
- Do not commit secrets or credentials.

## Change Validation Checklist
- Tests pass (`npm test`).
- App loads from local static server without console errors.
- Chart renders and slider interactions still work.
- If data changed, verify `data/snowfall-data.json` structure remains compatible with `js/data-processor.js`.
