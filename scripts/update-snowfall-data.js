#!/usr/bin/env node

/**
 * Refresh NOAA snowfall data if it is older than 24 hours.
 */

const fs = require('fs');
const path = require('path');
const { processNoaaData } = require('./process-noaa-data');

const DATA_JSON_PATH = path.join(__dirname, '..', 'data', 'snowfall-data.json');
const NOAA_CSV_PATH = path.join(__dirname, '..', 'data', 'USC00059175data.csv');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function parseLastUpdatedDate(lastUpdated) {
    if (!lastUpdated || typeof lastUpdated !== 'string') {
        return null;
    }
    const parsed = new Date(`${lastUpdated}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function shouldRefresh(dataJsonPath) {
    if (!fs.existsSync(dataJsonPath)) {
        return true;
    }

    const fileContent = fs.readFileSync(dataJsonPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    const lastUpdatedDate = parseLastUpdatedDate(parsed.lastUpdated);

    if (!lastUpdatedDate) {
        return true;
    }

    const ageMs = Date.now() - lastUpdatedDate.getTime();
    return ageMs > ONE_DAY_MS;
}

function buildNoaaUrl() {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
        dataset: 'daily-summaries',
        stations: 'USC00059175',
        startDate: '1989-08-01',
        endDate: today,
        dataTypes: 'SNOW,SNWD',
        format: 'csv',
        units: 'standard',
        includeAttributes: 'false',
        includeStationName: 'false',
        includeStationLocation: 'false'
    });

    return `https://www.ncei.noaa.gov/access/services/data/v1?${params.toString()}`;
}

async function fetchNoaaCsv() {
    const url = buildNoaaUrl();
    console.log(`Fetching NOAA data from ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'cumulative-snowfall-data-updater'
        }
    });

    if (!response.ok) {
        throw new Error(`NOAA request failed: HTTP ${response.status} ${response.statusText}`);
    }

    const csv = await response.text();
    if (!csv || !csv.includes('DATE')) {
        throw new Error('NOAA response did not contain expected CSV data');
    }

    fs.writeFileSync(NOAA_CSV_PATH, csv);
    console.log(`Saved NOAA CSV to ${NOAA_CSV_PATH}`);
}

async function main() {
    if (!shouldRefresh(DATA_JSON_PATH)) {
        console.log('Snowfall data is less than 24 hours old. Skipping refresh.');
        return;
    }

    console.log('Snowfall data is older than 24 hours. Refreshing...');
    await fetchNoaaCsv();
    processNoaaData();
    console.log('Snowfall data refresh complete.');
}

main().catch((error) => {
    console.error('Failed to refresh snowfall data:', error);
    process.exit(1);
});
