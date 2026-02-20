#!/usr/bin/env node

/**
 * Process NOAA GHCND data from Winter Park station (USC00059175)
 * Converts CSV data to JSON format for the snowfall tracker application
 */

const fs = require('fs');
const path = require('path');

// Input and output paths
const INPUT_CSV = path.join(__dirname, '../data/USC00059175data.csv');
const OUTPUT_JSON = path.join(__dirname, '../data/snowfall-data.json');

/**
 * Parse a date string in YYYY-MM-DD format
 */
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Get the ski season for a given date
 * Ski season runs Aug 1 - Jul 31
 */
function getSkiSeason(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based

    if (month >= 7) { // Aug-Dec (months 7-11)
        return `${year}-${String(year + 1).slice(-2)}`;
    } else { // Jan-Jul (months 0-6)
        return `${year - 1}-${String(year).slice(-2)}`;
    }
}

/**
 * Get day of season (0-365, where Aug 1 = 0)
 */
function getDayOfSeason(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    let seasonStart;
    if (month >= 7) { // Aug-Dec
        seasonStart = new Date(year, 7, 1); // Aug 1 of current year
    } else { // Jan-Jul
        seasonStart = new Date(year - 1, 7, 1); // Aug 1 of previous year
    }

    const diffTime = date - seasonStart;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Parse and clean snowfall value
 */
function parseSnowfall(value) {
    if (!value || value === '' || value === 'T') {
        return 0; // Trace amounts or missing = 0
    }
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Parse and clean snow depth value
 */
function parseSnowDepth(value) {
    if (!value || value === '' || value === 'T') {
        return 0;
    }
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Parse a single CSV line into columns (handles quoted fields)
 */
function parseCsvLine(line) {
    const columns = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            columns.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    columns.push(current.trim());
    return columns;
}

/**
 * Process the NOAA CSV data
 * CSV format: STATION, DATE, SNOW, SNWD (from NCEI daily-summaries)
 */
function processNoaaData() {
    console.log('Reading NOAA data from:', INPUT_CSV);

    const csvContent = fs.readFileSync(INPUT_CSV, 'utf8');
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('CSV has no data rows');
    }

    const headerLine = lines[0];
    const dataLines = lines.slice(1);

    const headerCols = parseCsvLine(headerLine);
    const dateIdx = headerCols.indexOf('DATE');
    const snowIdx = headerCols.indexOf('SNOW');
    const snwdIdx = headerCols.indexOf('SNWD');

    if (dateIdx === -1 || snowIdx === -1 || snwdIdx === -1) {
        throw new Error(`CSV missing required columns. Header: ${headerCols.join(', ')}`);
    }

    console.log(`Processing ${dataLines.length} data records...`);

    // Group data by season
    const seasonData = new Map();
    let processedCount = 0;

    for (const line of dataLines) {
        const columns = parseCsvLine(line);

        if (columns.length <= Math.max(dateIdx, snowIdx, snwdIdx)) {
            continue;
        }

        const dateStr = columns[dateIdx];
        const snowfall = columns[snowIdx];
        const snowDepth = columns[snwdIdx];

        if (!dateStr || dateStr.length !== 10) {
            continue;
        }

        try {
            const date = parseDate(dateStr);
            const season = getSkiSeason(date);
            const dayOfSeason = getDayOfSeason(date);

            const dailySnowfall = parseSnowfall(snowfall);
            const currentSnowDepth = parseSnowDepth(snowDepth);

            // Initialize season if not exists
            if (!seasonData.has(season)) {
                seasonData.set(season, []);
            }

            seasonData.get(season).push({
                date: dateStr,
                dayOfSeason,
                snowDepth: currentSnowDepth,
                dailySnowfall,
                originalDate: date
            });

            processedCount++;

        } catch (error) {
            continue;
        }
    }

    console.log(`Successfully processed ${processedCount} records`);
    console.log(`Found data for ${seasonData.size} seasons`);

    // Process each season
    const seasons = [];

    for (const [seasonName, dailyRecords] of seasonData) {
        // Sort by date
        dailyRecords.sort((a, b) => a.originalDate - b.originalDate);

        // Calculate cumulative snowfall
        let cumulativeSnowfall = 0;
        const processedRecords = [];

        for (const record of dailyRecords) {
            cumulativeSnowfall += record.dailySnowfall;

            processedRecords.push({
                date: record.date,
                dayOfSeason: record.dayOfSeason,
                snowDepth: record.snowDepth,
                dailySnowfall: record.dailySnowfall,
                cumulativeSnowfall: Math.round(cumulativeSnowfall * 10) / 10 // Round to 1 decimal
            });
        }

        const startYear = parseInt(seasonName.split('-')[0]);
        const totalSnowfall = Math.round(cumulativeSnowfall * 10) / 10;

        seasons.push({
            season: seasonName,
            startYear,
            totalSnowfall,
            dailyData: processedRecords
        });
    }

    // Sort seasons by start year
    seasons.sort((a, b) => a.startYear - b.startYear);

    // Create output JSON
    const output = {
        source: "NOAA Winter Park Station (USC00059175)",
        elevation: 9100, // Winter Park elevation in feet
        units: "inches",
        lastUpdated: new Date().toISOString().split('T')[0],
        dataRange: `${seasons[0]?.startYear || 1990}-${new Date().getFullYear()}`,
        note: "Processed from NOAA Global Historical Climatology Network Daily (GHCND) data. Daily snowfall from SNOW column, snow depth from SNWD column.",
        seasons
    };

    console.log(`Writing processed data to: ${OUTPUT_JSON}`);
    console.log(`Seasons: ${seasons.length} (${output.dataRange})`);
    console.log(`Total records: ${seasons.reduce((sum, s) => sum + s.dailyData.length, 0)}`);

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));

    console.log('✅ NOAA data processing complete!');

    // Print some stats
    const recentSeasons = seasons.slice(-5);
    console.log('\nRecent seasons:');
    for (const season of recentSeasons) {
        console.log(`  ${season.season}: ${season.totalSnowfall}" total, ${season.dailyData.length} days`);
    }
}

// Run the processing
if (require.main === module) {
    try {
        processNoaaData();
    } catch (error) {
        console.error('❌ Error processing NOAA data:', error);
        process.exit(1);
    }
}

module.exports = { processNoaaData };