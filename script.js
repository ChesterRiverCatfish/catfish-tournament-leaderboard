/* ============================================
   Catfish Tournament Live Leaderboard - Script
   ============================================ */

// =============================================
// CONFIGURATION — Edit these values to customize
// =============================================
const CONFIG = {
    // Tournament Info
    tournamentName: "2026 Chester River Catfish Tournament",
    tournamentDate: "Saturday, August 29th, 2026",                         // e.g., "June 14, 2026"
    tournamentBanner: "images/catfish_tournament_logo.png",

    // Google Sheets CSV URLs
    // Instructions: Publish each Google Sheet tab as CSV, then paste the URLs here
    // Format: https://docs.google.com/spreadsheets/d/e/SPREADSHEET_ID/pub?gid=TAB_GID&single=true&output=csv
    sheets: {
        channelCatfish:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=0&single=true&output=csv",
        blueFlathead:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1954833042&single=true&output=csv",
        stringer:         "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1361461277&single=true&output=csv",
        junior:           "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1116047246&single=true&output=csv",
        settings:         "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=822712516&single=true&output=csv"
    },

    // Refresh interval in minutes
    refreshInterval: 2,

    // Sponsors — Add your sponsors here
    // Each sponsor: { name: "Sponsor Name", logo: "images/sponsor-logo.png", url: "https://example.com" }
    // The url and logo fields are optional
    sponsors: [
         { name: "Chestertown Animal Hospital", logo: "images/sponsors/Chestertown Animal Hospital Logo.png" },
         { name: "Heller the Seller", logo: "images/sponsors/Heller the Seller.png" },
         { name: "Revere Seed", logo: "images/sponsors/REVERE_color_logo.png" },
    ],

    // Maximum entries to display per category/division (0 = show all)
    maxDisplay: 10,

    // Footer text
    footerText: "Catfish Tournament Leaderboard"
};

// =============================================
// INITIALIZATION
// =============================================
// Track current tournament status
let tournamentStatus = 'live'; // default: 'before', 'live', or 'after'
let refreshTimerId = null;

document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    fetchSettingsAndRefresh();
    startAutoRefresh();
});

/**
 * Apply configuration values to the page
 */
function applyConfig() {
    // Tournament name
    const nameEl = document.getElementById('tournament-name');
    if (nameEl) nameEl.textContent = CONFIG.tournamentName;

    // Tournament date
    const dateEl = document.getElementById('tournament-date');
    if (dateEl) dateEl.textContent = CONFIG.tournamentDate;

    // Tournament banner
    const bannerEl = document.getElementById('tournament-banner');
    if (bannerEl && CONFIG.tournamentBanner) {
        bannerEl.src = CONFIG.tournamentBanner;
        bannerEl.alt = CONFIG.tournamentName;
    }

    // Update OG meta tags dynamically (for client-side, though crawlers won't see these)
    document.title = CONFIG.tournamentName + " — Live Leaderboard";

    // Footer
    const footerEl = document.getElementById('footer-text');
    if (footerEl) footerEl.textContent = CONFIG.footerText;

    // Sponsors
    renderSponsors();
}

/**
 * Render sponsor logos and names into the sponsors grid
 */
function renderSponsors() {
    const grid = document.getElementById('sponsors-grid');
    const section = document.getElementById('sponsors-section');
    if (!grid || !section) return;

    if (!CONFIG.sponsors || CONFIG.sponsors.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    grid.innerHTML = '';

    CONFIG.sponsors.forEach(sponsor => {
        const el = document.createElement(sponsor.url ? 'a' : 'div');
        el.className = 'sponsor-item';
        if (sponsor.url) {
            el.href = sponsor.url;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
        }

        let html = '';
        if (sponsor.logo) {
            html += `<img class="sponsor-logo" src="${sponsor.logo}" alt="${sponsor.name}" onerror="this.style.display='none'">`;
        }
        if (sponsor.name) {
            html += `<span class="sponsor-name">${sponsor.name}</span>`;
        }
        el.innerHTML = html;
        grid.appendChild(el);
    });
}

// =============================================
// DATA LOADING
// =============================================

/**
 * Load all leaderboard data from Google Sheets
 */
async function loadAllData() {
    const tasks = [
        { url: CONFIG.sheets.channelCatfish, tableId: 'channel-catfish-table', prizeCount: 3 },
        { url: CONFIG.sheets.blueFlathead,   tableId: 'blue-flathead-table',   prizeCount: 3 },
        { url: CONFIG.sheets.stringer,       tableId: 'stringer-table',        prizeCount: 3 },
        { url: CONFIG.sheets.junior,         tableId: 'junior-table',          prizeCount: 4 }
    ];

    const promises = tasks.map(task => loadLeaderboard(task.url, task.tableId, task.prizeCount));

    try {
        await Promise.allSettled(promises);
    } catch (err) {
        console.error('Error loading leaderboard data:', err);
    }

    // Update timestamp
    updateTimestamp();
}

/**
 * Load and render a single leaderboard
 * @param {string} csvUrl - The published Google Sheets CSV URL
 * @param {string} tableId - The table element ID to render into
 * @param {number} prizeCount - Number of prize-winning positions to highlight
 */
async function loadLeaderboard(csvUrl, tableId, prizeCount) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');

    // Check if URL is configured
    if (!csvUrl || csvUrl.includes('YOUR_') || csvUrl.includes('_HERE')) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-message">Configure the Google Sheets CSV URL in script.js</td></tr>';
        return;
    }

    try {
        // Add cache-busting parameter to prevent stale cached responses
        const cacheBuster = '_cb=' + Date.now();
        const separator = csvUrl.includes('?') ? '&' : '?';
        const fetchUrl = csvUrl + separator + cacheBuster;

        const response = await fetch(fetchUrl, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const csvText = await response.text();
        const entries = parseCSV(csvText);

        // Only update the table if we got valid data
        // This prevents wiping out good data if Google Sheets returns an empty response
        if (entries.length === 0) {
            // Only show empty message on initial load, not on refresh
            const hasExistingData = tbody.querySelectorAll('tr:not(.loading-message):not(.empty-message):not(.error-message)').length > 0;
            if (!hasExistingData) {
                tbody.innerHTML = '<tr><td colspan="3" class="empty-message">🎣 No weigh-ins recorded yet — stay tuned!</td></tr>';
            }
            // If we already have data displayed, keep it and skip this empty update
            return;
        }

        // Sort by weight descending
        entries.sort((a, b) => b.totalOunces - a.totalOunces);

        // Render
        renderTable(tbody, entries, prizeCount);

    } catch (err) {
        console.error(`Error loading ${tableId}:`, err);
        // Only show error message if there's no existing data displayed
        // This prevents wiping out good data on a transient network error
        const existingRows = tbody.querySelectorAll('tr');
        const hasRealData = existingRows.length > 0 &&
            !existingRows[0].querySelector('.loading-message, .empty-message, .error-message');
        if (!hasRealData) {
            tbody.innerHTML = '<tr><td colspan="3" class="error-message">Unable to load data. Will retry on next refresh.</td></tr>';
        }
    }
}

// =============================================
// CSV PARSING
// =============================================

/**
 * Parse CSV text into an array of entry objects
 * Expected columns: Name, Weight
 * @param {string} csvText - Raw CSV text from Google Sheets
 * @returns {Array} Array of { name, weight, totalOunces }
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return []; // Need at least header + 1 row

    const entries = [];

    // Skip header row (line 0)
    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length < 2) continue;

        const name = fields[0].trim();
        const weightStr = fields[1].trim();

        if (!name || !weightStr) continue;

        const totalOunces = parseWeight(weightStr);

        entries.push({
            name: name,
            weight: weightStr,
            totalOunces: totalOunces
        });
    }

    return entries;
}

/**
 * Parse a single CSV line, handling quoted fields
 * @param {string} line - A single line of CSV
 * @returns {Array} Array of field values
 */
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }

    fields.push(current); // Last field
    return fields;
}

/**
 * Parse a weight string like "12 lbs 8 oz" into total ounces
 * Supports formats: "12 lbs 8 oz", "12lbs 8oz", "12 lb 8 oz", "12-8", etc.
 * @param {string} weightStr - Weight string
 * @returns {number} Total ounces for sorting
 */
function parseWeight(weightStr) {
    // Try "X lbs Y oz" format (most common) — supports decimals like "9 lbs 2.5 oz"
    const match = weightStr.match(/([\d.]+)\s*(?:lbs?|pounds?)[\s.,]*([\d.]+)\s*(?:oz|ounces?)/i);
    if (match) {
        const pounds = parseFloat(match[1]) || 0;
        const ounces = parseFloat(match[2]) || 0;
        return (pounds * 16) + ounces;
    }

    // Try just pounds: "12 lbs" or "12.5 lbs"
    const lbsOnly = weightStr.match(/([\d.]+)\s*(?:lbs?|pounds?)/i);
    if (lbsOnly) {
        return parseFloat(lbsOnly[1]) * 16;
    }

    // Try just ounces: "8 oz" or "8.5 oz"
    const ozOnly = weightStr.match(/([\d.]+)\s*(?:oz|ounces?)/i);
    if (ozOnly) {
        return parseFloat(ozOnly[1]);
    }

    // Try numeric value (assume pounds)
    const numOnly = parseFloat(weightStr);
    if (!isNaN(numOnly)) {
        return numOnly * 16;
    }

    return 0;
}

// =============================================
// RENDERING
// =============================================

/**
 * Render sorted entries into a table tbody
 * @param {HTMLElement} tbody - The tbody element
 * @param {Array} entries - Sorted array of entry objects
 * @param {number} prizeCount - Number of prize positions to highlight
 */
function renderTable(tbody, entries, prizeCount) {
    tbody.innerHTML = '';

    const prizeIcons = ['🥇', '🥈', '🥉', '🏅'];

    // Limit to top N entries if configured
    const maxDisplay = CONFIG.maxDisplay || 0;
    const displayEntries = (maxDisplay > 0) ? entries.slice(0, maxDisplay) : entries;

    displayEntries.forEach((entry, index) => {
        const rank = index + 1;
        const tr = document.createElement('tr');

        // Add prize row class
        if (rank <= prizeCount) {
            tr.className = `prize-row-${rank}`;
        }

        // Rank cell
        const rankTd = document.createElement('td');
        rankTd.className = 'col-rank';
        if (rank <= prizeCount && rank <= prizeIcons.length) {
            rankTd.innerHTML = `<span class="rank-icon">${prizeIcons[rank - 1]}</span> ${rank}`;
        } else {
            rankTd.textContent = rank;
        }

        // Name cell
        const nameTd = document.createElement('td');
        nameTd.className = 'col-name';
        nameTd.textContent = entry.name;

        // Weight cell
        const weightTd = document.createElement('td');
        weightTd.className = 'col-weight';
        weightTd.textContent = entry.weight;

        tr.appendChild(rankTd);
        tr.appendChild(nameTd);
        tr.appendChild(weightTd);
        tbody.appendChild(tr);
    });
}

// =============================================
// AUTO-REFRESH
// =============================================

/**
 * Update the "Last Updated" timestamp
 */
function updateTimestamp() {
    const el = document.getElementById('last-updated');
    if (!el) return;

    const now = new Date();
    const options = {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    el.textContent = now.toLocaleTimeString('en-US', options);
}

/**
 * Fetch the Settings tab from Google Sheets and update the badge
 * Settings tab format: Row 1 = headers (status), Row 2 = value (before/live/after)
 */
async function fetchSettings() {
    const settingsUrl = CONFIG.sheets.settings;
    if (!settingsUrl) {
        // No settings URL configured — default to 'live'
        return 'live';
    }

    try {
        const cacheBuster = `_cb=${Date.now()}`;
        const separator = settingsUrl.includes('?') ? '&' : '?';
        const fetchUrl = `${settingsUrl}${separator}${cacheBuster}`;
        const response = await fetch(fetchUrl, { cache: 'no-store' });
        const text = await response.text();

        // Parse simple CSV: first row is header, second row is value
        const lines = text.trim().split('\n');
        if (lines.length >= 2) {
            const value = lines[1].trim().toLowerCase().replace(/['"]/g, '');
            if (['before', 'live', 'after'].includes(value)) {
                return value;
            }
        }
    } catch (err) {
        console.warn('Could not fetch settings:', err);
    }

    return tournamentStatus; // Keep current status on error
}

/**
 * Update the status badge based on tournament state
 */
function updateBadge(status) {
    const badge = document.getElementById('status-badge');
    if (!badge) return;

    // Remove all state classes
    badge.classList.remove('before', 'final');

    switch (status) {
        case 'before':
            badge.textContent = '📋 WEIGH-INS COMING SOON';
            badge.classList.add('before');
            break;
        case 'after':
            badge.textContent = '🏁 FINAL RESULTS';
            badge.classList.add('final');
            break;
        case 'live':
        default:
            badge.textContent = '🔴 LIVE';
            break;
    }
}

/**
 * Fetch settings, update badge, then load leaderboard data
 */
async function fetchSettingsAndRefresh() {
    const newStatus = await fetchSettings();
    tournamentStatus = newStatus;
    updateBadge(tournamentStatus);
    await loadAllData();
}

/**
 * Start the auto-refresh timer
 */
function startAutoRefresh() {
    const intervalMs = (CONFIG.refreshInterval || 2) * 60 * 1000;

    refreshTimerId = setInterval(() => {
        // Always check settings (even in 'after' mode, in case they switch back)
        console.log('Auto-refreshing leaderboard data...');
        fetchSettingsAndRefresh();
    }, intervalMs);
}
