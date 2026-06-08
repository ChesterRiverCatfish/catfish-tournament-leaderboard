/* ============================================
   Catfish Tournament Live Leaderboard - Script
   ============================================ */

// =============================================
// CONFIGURATION — Edit these values to customize
// =============================================
const CONFIG = {
    // Tournament Info
    tournamentName: "2026 Chester River Catfish Tournament",
    tournamentDate: "Saturday, August 29th, 2026",
    tournamentBanner: "images/catfish_tournament_logo.png",

    // Google Sheets CSV URLs
    // Instructions: Publish each Google Sheet tab as CSV, then paste the URLs here
    // Format: https://docs.google.com/spreadsheets/d/e/SPREADSHEET_ID/pub?gid=TAB_GID&single=true&output=csv
    sheets: {
        channelCatfish:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=0&single=true&output=csv",
        blueFlathead:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1954833042&single=true&output=csv",
        stringer:         "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1361461277&single=true&output=csv",
        junior:           "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1116047246&single=true&output=csv",
        settings:         "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=822712516&single=true&output=csv",
        sponsors:         "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesRUtCsBmtAUfXuJIQ9A_MJCESJC2Tbe2WWOJpx-tpvjwqTk2lUBsl_vN-SzSwimkiv5NwTk4Ioo9/pub?gid=1844937710&single=true&output=csv"
    },

    // Refresh interval in minutes
    refreshInterval: 2,

    // Maximum entries to display per category/division (0 = show all)
    maxDisplay: 10,

    // Footer text
    footerText: "Chester River Catfish Tournament Leaderboard"
};

// =============================================
// INITIALIZATION
// =============================================
// Track current tournament status
let tournamentStatus = 'live'; // default: 'before', 'live', or 'after'
let refreshTimerId = null;
// True after the first successful settings fetch — used to avoid showing
// a misleading "🔴 LIVE" badge if the very first fetch fails.
let hasReceivedSettings = false;
// Guards against overlapping refreshes if a fetch takes longer than the
// 2-minute interval (e.g., during a Google Sheets slowdown).
let isRefreshing = false;

// Toggle state for Junior Division "Show All" view
let juniorShowAll = false;

// Sponsor data rarely changes — refetch on first load and every Nth cycle.
// At a 2-minute refresh interval, 15 cycles ≈ 30 minutes.
const SPONSOR_REFRESH_CYCLES = 15;
let sponsorRefreshCounter = 0;

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
}

// =============================================
// SPONSOR MANAGEMENT
// =============================================

/**
 * Fetch and parse sponsors from the Sponsors Google Sheet tab.
 * Sheet format: Row 1 = header; Columns: Tier | Name | Logo | URL
 * Tier values: presenting, weighin, junior, general
 * @returns {Object} { presenting: {}, weighin: {}, junior: {}, general: [] }
 */
async function fetchSponsors() {
    const sponsorsUrl = CONFIG.sheets.sponsors;
    const result = { presenting: null, weighin: null, junior: null, general: [] };

    if (!sponsorsUrl || sponsorsUrl.includes('YOUR_') || sponsorsUrl.includes('_HERE') || sponsorsUrl === '') {
        return result;
    }

    try {
        // Bucket to 30-second windows so concurrent viewers share the same URL
        // and Google's CDN can serve cached responses instead of every request
        // hitting origin. Still gives near-fresh data on a 2-minute poll cadence.
        const cacheBuster = '_cb=' + Math.floor(Date.now() / 30000);
        const separator = sponsorsUrl.includes('?') ? '&' : '?';
        const fetchUrl = sponsorsUrl + separator + cacheBuster;
        const response = await fetch(fetchUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();

        const rows = parseCSVRows(text);
        // Skip header row (row 0)
        for (let i = 1; i < rows.length; i++) {
            const fields = rows[i];
            if (fields.length < 2) continue;

            const tier = fields[0].trim().toLowerCase();
            const name = fields[1].trim();
            if (!name) continue; // skip rows without a name

            const logo = (fields.length > 2) ? fields[2].trim() : '';
            const url  = (fields.length > 3) ? fields[3].trim() : '';

            const sponsor = { name, logo, url };

            if (tier === 'presenting' && !result.presenting) {
                result.presenting = sponsor;
            } else if (tier === 'weighin' && !result.weighin) {
                result.weighin = sponsor;
            } else if (tier === 'junior' && !result.junior) {
                result.junior = sponsor;
            } else if (tier === 'general') {
                result.general.push(sponsor);
            }
        }
    } catch (err) {
        console.warn('Could not fetch sponsors:', err);
    }

    return result;
}

/**
 * Return the input URL only if it uses an allowed protocol (http/https),
 * otherwise return an empty string. Prevents javascript:, data:, etc.
 */
function safeUrl(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (e) {
        // Allow relative paths that URL() rejects in some browsers — fall through
        if (/^[\w./-]+$/.test(url)) return url;
    }
    return '';
}

/**
 * Build a sponsor logo + name fragment using safe DOM APIs (no innerHTML).
 * @returns {DocumentFragment}
 */
function buildSponsorContent(sponsor) {
    const frag = document.createDocumentFragment();
    const logoUrl = safeUrl(sponsor.logo);
    if (logoUrl) {
        const img = document.createElement('img');
        img.className = 'sponsor-logo';
        img.src = logoUrl;
        img.alt = sponsor.name || '';
        img.onerror = function() { this.style.display = 'none'; };
        frag.appendChild(img);
    }
    if (sponsor.name) {
        const span = document.createElement('span');
        span.className = 'sponsor-name';
        span.textContent = sponsor.name;
        frag.appendChild(span);
    }
    return frag;
}

/**
 * Render a tier sponsor (presenting, weighin, or junior) into its container div.
 * @param {string} elementId - The container element ID
 * @param {Object|null} sponsor - Sponsor object { name, logo, url } or null to hide
 * @param {string} label - The tier label text (e.g., "⭐ Presented by")
 */
function renderTierSponsor(elementId, sponsor, label) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = '';

    if (!sponsor || !sponsor.name) {
        el.style.display = 'none';
        return;
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'tier-label';
    labelDiv.textContent = label;
    el.appendChild(labelDiv);

    const sponsorUrl = safeUrl(sponsor.url);
    const wrapper = document.createElement(sponsorUrl ? 'a' : 'div');
    wrapper.className = sponsorUrl
        ? 'sponsor-content tier-sponsor-link'
        : 'sponsor-content';
    if (sponsorUrl) {
        wrapper.href = sponsorUrl;
        wrapper.target = '_blank';
        wrapper.rel = 'noopener noreferrer';
    }
    wrapper.appendChild(buildSponsorContent(sponsor));
    el.appendChild(wrapper);

    el.style.display = '';
}

/**
 * Render general sponsors into the bottom sponsors grid.
 * @param {Array} sponsors - Array of sponsor objects { name, logo, url }
 */
function renderSponsors(sponsors) {
    const grid = document.getElementById('sponsors-grid');
    const section = document.getElementById('sponsors-section');
    if (!grid || !section) return;

    if (!sponsors || sponsors.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    grid.textContent = '';

    sponsors.forEach(sponsor => {
        const sponsorUrl = safeUrl(sponsor.url);
        const el = document.createElement(sponsorUrl ? 'a' : 'div');
        el.className = 'sponsor-item';
        if (sponsorUrl) {
            el.href = sponsorUrl;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
        }
        el.appendChild(buildSponsorContent(sponsor));
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
    const defaultMax = CONFIG.maxDisplay || 10;
    const tasks = [
        { url: CONFIG.sheets.channelCatfish, tableId: 'channel-catfish-table', prizeCount: 3, maxDisplay: defaultMax },
        { url: CONFIG.sheets.blueFlathead,   tableId: 'blue-flathead-table',   prizeCount: 3, maxDisplay: defaultMax },
        { url: CONFIG.sheets.stringer,       tableId: 'stringer-table',        prizeCount: 1, maxDisplay: defaultMax },
        { url: CONFIG.sheets.junior,         tableId: 'junior-table',          prizeCount: 4, maxDisplay: juniorShowAll ? 0 : defaultMax }
    ];

    const promises = tasks.map(task => loadLeaderboard(task.url, task.tableId, task.prizeCount, task.maxDisplay));

    let anySuccess = false;
    try {
        const results = await Promise.allSettled(promises);
        anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
    } catch (err) {
        console.error('Error loading leaderboard data:', err);
    }

    // Only update timestamp when at least one leaderboard fetch succeeded
    if (anySuccess) {
        updateTimestamp();
    }
}

/**
 * Load and render a single leaderboard
 * @param {string} csvUrl - The published Google Sheets CSV URL
 * @param {string} tableId - The table element ID to render into
 * @param {number} prizeCount - Number of prize-winning positions to highlight
 */
async function loadLeaderboard(csvUrl, tableId, prizeCount, maxDisplay) {
    const table = document.getElementById(tableId);
    if (!table) return false;

    const tbody = table.querySelector('tbody');

    // Check if URL is configured
    if (!csvUrl || csvUrl.includes('YOUR_') || csvUrl.includes('_HERE')) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-message">Configure the Google Sheets CSV URL in script.js</td></tr>';
        return false;
    }

    try {
        // Add cache-busting parameter to prevent stale cached responses
        // Bucket to 30-second windows so concurrent viewers share the same URL
        // and Google's CDN can serve cached responses instead of every request
        // hitting origin. Still gives near-fresh data on a 2-minute poll cadence.
        const cacheBuster = '_cb=' + Math.floor(Date.now() / 30000);
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
            const existingRows = tbody.querySelectorAll('tr');
            const hasExistingData = existingRows.length > 0 &&
                !existingRows[0].querySelector('.loading-message, .empty-message, .error-message');
            if (!hasExistingData) {
                tbody.innerHTML = '<tr><td colspan="3" class="empty-message">🎣 No weigh-ins recorded yet — stay tuned!</td></tr>';
            }
            // If we already have data displayed, keep it and skip this empty update
            return false;
        }

        // Sort by weight descending
        entries.sort((a, b) => b.totalOunces - a.totalOunces);

        // Render
        renderTable(tbody, entries, prizeCount, maxDisplay, tableId);
        return true;

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
        return false;
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
    const rows = parseCSVRows(csvText);
    if (rows.length < 2) return []; // Need at least header + 1 row

    const entries = [];

    // Skip header row (row 0)
    for (let i = 1; i < rows.length; i++) {
        const fields = rows[i];
        if (fields.length < 2) continue;

        const name = fields[0].trim();
        const weightStr = fields[1].trim();

        if (!name || !weightStr) continue;

        entries.push({
            name: name,
            weight: weightStr,
            totalOunces: parseWeight(weightStr)
        });
    }

    return entries;
}

/**
 * Parse a CSV document into an array of rows. Correctly handles quoted
 * fields containing commas, escaped quotes ("") and embedded newlines.
 * @param {string} text - Raw CSV text
 * @returns {Array<Array<string>>} Array of rows, each an array of field values
 */
function parseCSVRows(text) {
    const rows = [];
    let row = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(current);
                current = '';
            } else if (ch === '\r') {
                // ignore — handled by \n
            } else if (ch === '\n') {
                row.push(current);
                rows.push(row);
                row = [];
                current = '';
            } else {
                current += ch;
            }
        }
    }

    // Flush trailing field/row if the file doesn't end with a newline
    if (current !== '' || row.length > 0) {
        row.push(current);
        rows.push(row);
    }
    return rows;
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
 * @param {number} maxDisplay - Max entries to show (0 = show all)
 * @param {string} tableId - Table element ID (used for toggle state)
 */
function renderTable(tbody, entries, prizeCount, maxDisplay, tableId) {
    tbody.innerHTML = '';

    const prizeIcons = ['🥇', '🥈', '🥉', '🏅'];

    // Limit to top N entries if configured.
    // Ties are broken by weigh-in order: entries are listed in the Google
    // Sheet in the order officials record them, and Array.prototype.sort is
    // stable, so the angler who weighed in first naturally ranks higher.
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
            const icon = document.createElement('span');
            icon.className = 'rank-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = prizeIcons[rank - 1];
            rankTd.appendChild(icon);
            rankTd.appendChild(document.createTextNode(' ' + rank));
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

    // Add "Show All / Show Top 10" toggle for Junior Division
    const defaultMax = CONFIG.maxDisplay || 10;
    if (tableId === 'junior-table' && entries.length > defaultMax) {
        const toggleRow = document.createElement('tr');
        const toggleTd = document.createElement('td');
        toggleTd.colSpan = 3;
        toggleTd.className = 'toggle-cell';

        const btn = document.createElement('button');
        btn.className = 'toggle-btn';
        // aria-expanded reflects whether the table is currently showing all entries.
        // maxDisplay > 0 means the table is collapsed to top N; maxDisplay === 0 means expanded.
        const isExpanded = (maxDisplay === 0);
        btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        if (isExpanded) {
            btn.textContent = '\u25B2 Show Top ' + defaultMax;
        } else {
            btn.textContent = '\u25BC Show All (' + entries.length + ')';
        }
        btn.addEventListener('click', function() {
            juniorShowAll = !juniorShowAll;
            const newMax = juniorShowAll ? 0 : defaultMax;
            renderTable(tbody, entries, prizeCount, newMax, tableId);
        });

        toggleTd.appendChild(btn);
        toggleRow.appendChild(toggleTd);
        tbody.appendChild(toggleRow);
    }
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
        hour12: true,
        timeZoneName: 'short'
    };
    el.textContent = now.toLocaleTimeString('en-US', options);
}

/**
 * Fetch all settings from the Settings tab in Google Sheets
 * Settings tab format: Column A = key, Column B = value (one key-value pair per row)
 * Supported keys: status (before/live/after), tournamentName, tournamentDate
 * @returns {Object} Settings object with lowercase keys
 */
async function fetchSettings() {
    const settingsUrl = CONFIG.sheets.settings;
    if (!settingsUrl) {
        // No settings URL configured — return defaults
        return { status: 'live' };
    }

    try {
        const cacheBuster = `_cb=${Math.floor(Date.now() / 30000)}`;
        const separator = settingsUrl.includes('?') ? '&' : '?';
        const fetchUrl = `${settingsUrl}${separator}${cacheBuster}`;
        const response = await fetch(fetchUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();

        // Parse settings CSV — each row is a key,value pair
        // Google Sheet Settings tab layout:
        //   Column A (Key)      | Column B (Value)
        //   status              | live
        //   tournamentName      | 2026 Chester River Catfish Tournament
        //   tournamentDate      | Saturday, August 29th, 2026
        const rows = parseCSVRows(text);
        const settings = {};

        // The Settings tab must NOT have a header row. Every row is treated as
        // a key/value pair (Column A = key, Column B = value, starting at row 1).
        for (const fields of rows) {
            if (fields.length >= 2) {
                const key = fields[0].trim().toLowerCase();
                const value = fields[1].trim();
                if (key) {
                    settings[key] = value;
                }
            }
        }

        // Normalize status value
        if (settings.status) {
            settings.status = settings.status.toLowerCase();
            if (!['before', 'live', 'after'].includes(settings.status)) {
                settings.status = 'live'; // fallback to live if invalid
            }
        }

        return settings;
    } catch (err) {
        console.warn('Could not fetch settings:', err);
        return null;
    }
}

/**
 * Update the status badge based on tournament state
 */
function updateBadge(status) {
    const badge = document.getElementById('status-badge');
    if (!badge) return;

    // Remove all state classes
    badge.classList.remove('before', 'after');

    switch (status) {
        case 'before':
            badge.textContent = '📋 WEIGH-INS COMING SOON';
            badge.classList.add('before');
            break;
        case 'after':
            badge.textContent = '🏁 FINAL RESULTS (pending polygraphs)';
            badge.classList.add('after');
            break;
        case 'live':
        default:
            badge.textContent = '🔴 LIVE';
            break;
    }

    // Show/hide the unofficial results disclaimer (only visible when live)
    const disclaimer = document.querySelector('.disclaimer-banner');
    if (disclaimer) {
        disclaimer.style.display = (status === 'live') ? '' : 'none';
    }

    // Reveal badge now that correct status is set (hidden on load to prevent flash)
    badge.style.visibility = 'visible';
}

/**
 * Fetch settings, update badge, then load leaderboard data
 */
async function fetchSettingsAndRefresh() {
    // Skip if a previous refresh is still in flight (e.g., Google is slow).
    if (isRefreshing) {
        console.log('Refresh already in progress — skipping this tick.');
        return;
    }
    isRefreshing = true;

    try {
        const settings = await fetchSettings();

        if (settings) {
            // Successful fetch — apply settings.
            hasReceivedSettings = true;
            tournamentStatus = settings.status || 'live';
            updateBadge(tournamentStatus);

            if (settings.tournamentname) {
                const nameEl = document.getElementById('tournament-name');
                if (nameEl) nameEl.textContent = settings.tournamentname;
                document.title = settings.tournamentname + ' — Live Leaderboard';
            }
            if (settings.tournamentdate) {
                const dateEl = document.getElementById('tournament-date');
                if (dateEl) dateEl.textContent = settings.tournamentdate;
            }

            // Show/hide admin announcement
            const announcementEl = document.getElementById('admin-announcement');
            if (announcementEl) {
                const msg = settings.announcement || '';
                if (msg.trim()) {
                    announcementEl.textContent = '📢 ' + msg.trim();
                    announcementEl.style.display = '';
                } else {
                    announcementEl.style.display = 'none';
                }
            }
        } else if (hasReceivedSettings) {
            // Transient failure on a later refresh — keep showing the last
            // known status. updateBadge stays as-is.
        }
        // First-fetch failure: leave the badge in its hidden "Loading..." state
        // so viewers don't see a misleading default badge.

        // Sponsors rarely change — fetch on first load and every Nth cycle.
        if (sponsorRefreshCounter === 0) {
            const sponsorData = await fetchSponsors();
            renderTierSponsor('presenting-sponsor', sponsorData.presenting, '⭐ Presented by');
            renderTierSponsor('weighin-sponsor', sponsorData.weighin, '⚖️ Weigh-In Sponsor');
            renderTierSponsor('junior-sponsor', sponsorData.junior, '🐟 Junior Division Sponsor');
            renderSponsors(sponsorData.general);
        }
        sponsorRefreshCounter = (sponsorRefreshCounter + 1) % SPONSOR_REFRESH_CYCLES;

        await loadAllData();
    } finally {
        isRefreshing = false;
    }
}

/**
 * Start the auto-refresh timer
 */
function startAutoRefresh() {
    const intervalMs = (CONFIG.refreshInterval || 2) * 60 * 1000;
    // Stagger the first refresh by 0-15 seconds so concurrent viewers who
    // open the page at the same moment don't all hit Google in lockstep.
    // The offset persists through the rest of the session.
    const jitterMs = Math.floor(Math.random() * 15000);

    setTimeout(() => {
        fetchSettingsAndRefresh();
        refreshTimerId = setInterval(() => {
            console.log('Auto-refreshing leaderboard data...');
            fetchSettingsAndRefresh();
        }, intervalMs);
    }, intervalMs + jitterMs);
}
