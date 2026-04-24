# 🎣 Catfish Tournament Live Leaderboard

A live, auto-refreshing leaderboard for catfish tournaments. Officials enter data in Google Sheets, and the leaderboard displays on a mobile-friendly website that can be shared on Facebook and social media.

## Features

- **Adult Division** — 3 separate leaderboards:
  - Channel Catfish (top 3 win prizes 🥇🥈🥉)
  - Blue/Flathead Catfish (top 3 win prizes 🥇🥈🥉)
  - 3 Fish Stringer (winner takes all 🥇)
- **Junior Division** — 1 combined leaderboard (top 4 win prizes 🥇🥈🥉🏅) with "Show All / Show Top 10" toggle
- **Top 10 display** — Only the top 10 entries per category/division are shown (configurable); Junior Division includes a toggle to expand all entries
- **Auto-refresh** every 2 minutes
- **Mobile-first** responsive design with light theme optimized for outdoor/sunlight viewing
- **Favicon** using the tournament logo for browser tab identification
- **Live / Before / After status toggle** — controlled from Google Sheets, no code changes needed
- **Social media sharing** with Open Graph meta tags for rich Facebook previews
- **Unofficial results disclaimer** banner displayed below the header
- **Google Analytics (GA4)** tracking for visitor/traffic insights
- **Admin announcement banner** — display a custom message from the Google Sheet Settings tab
- **Customizable** tournament name, date, banner image, and display limits
- **Tiered sponsor system** — Presenting, Weigh-In, Junior Division, and General sponsors managed from a dedicated Google Sheet Sponsors tab
- **No backend required** — Google Sheets is the database

---

## Quick Start

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Create **6 tabs** (rename the sheet tabs at the bottom):
   - `Channel Catfish`
   - `Blue/Flathead Catfish`
   - `3 Fish Stringer`
   - `Junior`
   - `Settings`
   - `Sponsors`

3. In the **Sponsors** tab, set up 4 columns with a header row:

   | A (Tier) | B (Name) | C (Logo) | D (URL) |
   |---|---|---|---|
   | **Tier** | **Name** | **Logo URL** | **URL** |
   | presenting | ABC Tackle Co. | https://lh3.googleusercontent.com/d/FILE_ID_1 | https://abctackle.com |
   | weighin | Fishermans Wharf | https://lh3.googleusercontent.com/d/FILE_ID_2 | |
   | junior | Kids Cast Foundation | https://lh3.googleusercontent.com/d/FILE_ID_3 | https://kidscast.org |
   | general | Chestertown Animal Hospital | https://lh3.googleusercontent.com/d/FILE_ID_4 | |
   | general | Heller the Seller | https://lh3.googleusercontent.com/d/FILE_ID_5 | |
   | general | Revere Seed | https://lh3.googleusercontent.com/d/FILE_ID_6 | |

   - **Tier values:** `presenting`, `weighin`, `junior`, `general`
   - Only 1 presenting, 1 weighin, 1 junior sponsor (first match wins)
   - Unlimited general sponsors — just add rows
   - Logo (Column C) and URL (Column D) are optional
   - Logo supports full URLs (Google Drive, etc.) or local paths (`images/sponsors/logo.png`)
   - To remove a sponsor, delete the row or clear the Name column

   #### Using Google Drive for Sponsor Logos

   Instead of uploading logo files to the GitHub repo, you can host them in Google Drive:

   1. Upload the logo image (PNG, JPG, or SVG) to a Google Drive folder
   2. Right-click the file → **Share** → set to **"Anyone with the link"**
   3. Copy the share link — it looks like:
      ```
      https://drive.google.com/file/d/1Ai9Rdhq8FGHtoLd9kMaEA9E0LFvVDZzq/view?usp=sharing
      ```
   4. Extract the **File ID** — the long string between `/d/` and `/view`:
      ```
      1Ai9Rdhq8FGHtoLd9kMaEA9E0LFvVDZzq
      ```
   5. Build the direct image URL using this format:
      ```
      https://lh3.googleusercontent.com/d/1Ai9Rdhq8FGHtoLd9kMaEA9E0LFvVDZzq
      ```
   6. Paste this URL into **Column C (Logo)** of the Sponsors tab

   > **⚠️ Important:** Do NOT use `https://drive.google.com/uc?export=view&id=...` — Google now blocks this with an interstitial page. The `lh3.googleusercontent.com/d/` format works reliably.

3. In the **Settings** tab, add key-value settings (Column A = key, Column B = value):

   | A (Key) | B (Value) |
   |---|---|
   | **status** | **before** |
   | **tournamentName** | **2026 Chester River Catfish Tournament** |
   | **tournamentDate** | **Saturday, August 29th, 2026** |
   | **announcement** | *(leave blank or add a message)* |

   **Settings keys:**
   - `status` → Controls the badge: `before`, `live`, or `after`
   - `tournamentName` → Overrides the tournament name displayed in the header and page title
   - `tournamentDate` → Overrides the tournament date displayed in the header
   - `announcement` → Displays a blue info banner below the header (leave blank to hide)

   **Status values:**
   - `before` → 📋 WEIGH-INS COMING SOON (blue badge)
   - `live` → 🔴 LIVE (red pulsing badge) + "⚠️ UNOFFICIAL RESULTS" disclaimer
   - `after` → 🏁 FINAL RESULTS (green badge)

4. In each of the other 4 tabs, add these column headers in **Row 1**:

   | A | B |
   |---|---|
   | **Name** | **Weight** |

5. Enter fish data below the headers. Weight format: `X lbs Y oz`

   Example:
   | Name | Weight |
   |------|--------|
   | John Smith | 12 lbs 8 oz |
   | Jane Doe | 9 lbs 4 oz |
   | Bob Wilson | 4.14 lbs |

### Step 2: Publish the Google Sheet

1. In Google Sheets, go to **File > Share > Publish to web**
2. In the dialog:
   - Click the **Link** tab
   - Under "Published content & settings," select each individual sheet tab
   - Choose **Comma-separated values (.csv)** as the format
   - Click **Publish**
3. **Copy the URL** for each tab. Each URL will look like:
   ```
   https://docs.google.com/spreadsheets/d/e/2PACX-XXXX.../pub?gid=0&single=true&output=csv
   ```
4. Repeat for all **5 tabs** (including Settings). Note which URL goes with which tab.

### Step 3: Configure the Leaderboard

1. Open `script.js`
2. Edit the `CONFIG` section at the top of the file:

```javascript
const CONFIG = {
    // Tournament Info
    tournamentName: "Your Tournament Name Here",
    tournamentDate: "June 14, 2026",
    tournamentBanner: "images/catfish_tournament_logo.png",

    // Paste your Google Sheets CSV URLs here
    sheets: {
        channelCatfish:   "https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv",
        blueFlathead:     "https://docs.google.com/spreadsheets/d/e/.../pub?gid=123456&single=true&output=csv",
        stringer:         "https://docs.google.com/spreadsheets/d/e/.../pub?gid=789012&single=true&output=csv",
        junior:           "https://docs.google.com/spreadsheets/d/e/.../pub?gid=345678&single=true&output=csv",
        settings:         "https://docs.google.com/spreadsheets/d/e/.../pub?gid=SETTINGS_GID&single=true&output=csv"
    },

    // Refresh interval in minutes
    refreshInterval: 2,

    // Maximum entries to display per category/division (0 = show all)
    maxDisplay: 10,

    // Footer text
    footerText: "Your Tournament Name — Leaderboard"
};
```

### Step 4: Add Images (Optional)

1. Create an `images/` folder in the project directory
2. Add your tournament banner/logo image (e.g., `images/catfish_tournament_logo.png`)
3. For sponsor logos, use **Google Drive URLs** (recommended) or local files:
   - **Google Drive (recommended):** Upload logos to Drive and use `https://lh3.googleusercontent.com/d/FILE_ID` URLs in the Sponsors sheet — see [Using Google Drive for Sponsor Logos](#using-google-drive-for-sponsor-logos)
   - **Local files:** Create `images/sponsors/` and add logo images, then use relative paths like `images/sponsors/logo.png` in the sheet

### Step 5: Set Up Google Analytics (Optional)

The page includes Google Analytics GA4 tracking. To use your own:

1. Go to [analytics.google.com](https://analytics.google.com) and create a property
2. Get your **Measurement ID** (looks like `G-XXXXXXXXXX`)
3. In `index.html`, find the Google Analytics section in `<head>` and replace the Measurement ID:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ID_HERE"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-YOUR_ID_HERE');
</script>
```

This tracks real-time visitors, traffic sources (Facebook vs direct), device types, and more.

### Step 6: Update Open Graph Meta Tags

For the best Facebook sharing preview, edit `index.html` and update these meta tags:

```html
<meta property="og:title" content="Your Tournament Name — Live Leaderboard">
<meta property="og:description" content="Live standings for Your Tournament Name!">
<meta property="og:image" content="https://YOUR-GITHUB-USERNAME.github.io/catfish-tournament-leaderboard/images/catfish_tournament_logo.png">
<meta property="og:url" content="https://YOUR-GITHUB-USERNAME.github.io/catfish-tournament-leaderboard/">
```

> **Note:** The `og:image` URL must be a full absolute URL for Facebook to display it.

### Step 7: Deploy to GitHub Pages

1. Create a new repository on [GitHub](https://github.com) (e.g., `catfish-tournament-leaderboard`)
2. Upload all project files:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `images/` folder (with your tournament banner; sponsor logos are optional if using Google Drive URLs)
3. Go to **Settings > Pages** in your repository
4. Under "Source," select **Deploy from a branch**
5. Select `main` branch and `/ (root)` folder
6. Click **Save**
7. Wait 1-2 minutes — your site will be live at:
   ```
   https://YOUR-GITHUB-USERNAME.github.io/catfish-tournament-leaderboard/
   ```

### Step 8: Share on Social Media

Copy the GitHub Pages URL and share it on Facebook, Twitter, or any social media platform. The Open Graph meta tags will generate a rich preview card.

---

## During the Tournament

1. **Before the tournament** — Set the Settings tab status to `before`. The badge shows "📋 WEIGH-INS COMING SOON". No disclaimer banner is shown.
2. **Tournament starts** — Change the status to `live`. The badge switches to "🔴 LIVE" with a pulsing animation. The "⚠️ UNOFFICIAL RESULTS" disclaimer banner appears.
3. **Officials** open the Google Sheet on a phone, tablet, or laptop
4. Enter each weigh-in: type the angler's **Name** and **Weight** (e.g., `14 lbs 6 oz`)
5. The leaderboard website **auto-refreshes every 2 minutes** to show the latest standings
6. Only the **top 10** entries per category are displayed (configurable via `maxDisplay`). The **Junior Division** includes a "Show All / Show Top 10" toggle button when more than 10 entries exist
7. Viewers on Facebook can tap the shared link anytime to see live results
8. The **"⚠️ UNOFFICIAL RESULTS"** disclaimer banner is displayed only in `live` mode
9. **Tournament ends** — Change the status to `after`. The badge shows "🏁 FINAL RESULTS", the disclaimer hides, and auto-refresh continues checking the setting

---

## Customization

### Refresh Interval
Change `refreshInterval` in the CONFIG section. Value is in minutes.

### Tournament Status (Live / Before / After)
Change the status badge from your Google Sheet — no code changes needed:
1. Go to the **Settings** tab in your Google Sheet
2. Change the `status` value to one of: `before`, `live`, or `after`
3. The leaderboard picks up the change on the next auto-refresh (every 2 minutes)

| Value | Badge | Color | Disclaimer |
|---|---|---|---|
| `before` | 📋 WEIGH-INS COMING SOON | Blue (static) | Hidden |
| `live` | 🔴 LIVE | Red (pulsing) | Shown |
| `after` | 🏁 FINAL RESULTS | Green (static) | Hidden |

If the Settings URL is not configured, the badge defaults to "🔴 LIVE".

### Tournament Name & Date (from Google Sheet)
You can override the tournament name and date from the Settings tab without editing code:
1. Add a row with key `tournamentName` and the desired name in column B
2. Add a row with key `tournamentDate` and the desired date in column B
3. These override the CONFIG defaults in `script.js` when present
4. If the keys are missing from the sheet, the CONFIG values are used as fallbacks

### Display Limit
Change `maxDisplay` in the CONFIG section to control how many entries are shown per category/division:
- `10` — Show top 10 (default)
- `20` — Show top 20
- `0` — Show all entries (no limit)

**Junior Division Toggle:** When the Junior Division has more than `maxDisplay` entries, a "▼ Show All (N)" / "▲ Show Top 10" toggle button appears below the table. This lets viewers expand or collapse the full list without affecting the adult categories. The toggle state persists across auto-refreshes.

### Weight Format
The parser supports flexible weight formats, including decimals:
- `12 lbs 8 oz` (recommended)
- `9 lbs 2.5 oz` (decimal ounces supported)
- `12 lb 8 oz`
- `12lbs 8oz`
- `12 pounds 8 ounces`
- `4.14 lbs` (decimal pounds, no ounces)
- `12 lbs` (ounces default to 0)
- `8 oz` (pounds default to 0)

### Disclaimer Banner
The disclaimer text "⚠️ UNOFFICIAL RESULTS" only appears when status is `live`. It is hidden for `before` and `after` states. Edit the text in the `<div class="disclaimer-banner">` element in `index.html` as needed.

### Admin Announcement
Display a custom message to all participants from the Settings tab:
1. Add a row with key `announcement` in Column A
2. Type the message in Column B (e.g., "Weigh-ins delayed 30 minutes due to weather")
3. The message appears in a blue info banner below the header with a 📢 prefix
4. To hide the announcement, clear Column B (leave it empty)
5. Updates automatically on the next refresh cycle (every 2 minutes)

### Sponsors
All sponsors are managed from the **Sponsors** tab in the Google Sheet — no code changes needed:

| Tier | Placement on Page | Logo Size | Visual Treatment |
|---|---|---|---|
| `presenting` | Below banners, above all leaderboards | Large (200px) | Gold gradient background, "⭐ Presented by" label |
| `weighin` | Bottom of adult division column | Medium (140px) | Gray background, "⚖️ Weigh-In Sponsor" label |
| `junior` | Inside junior section, above table | Medium (140px) | Green tint, "🐟 Junior Division Sponsor" label |
| `general` | Bottom of page in grid | Small (100px) | Existing "Our Sponsors" grid |

**To add/change sponsors:**
1. Open the **Sponsors** tab in Google Sheets
2. Add or edit a row: `Tier | Name | Logo URL | URL`
3. Changes appear on the website within 2 minutes (next auto-refresh)

**To remove a sponsor:** Delete the row or clear the Name column.

**Note:** The `CONFIG.sheets.sponsors` URL in `script.js` must be set to the published CSV URL of the Sponsors tab. If the URL is empty, no sponsors will be displayed.

### Styling
Edit `styles.css` to change colors, fonts, and layout. The design uses a light color scheme optimized for outdoor/sunlight viewing on mobile devices.

---

## Cache Busting for Updates

When you update `styles.css` or `script.js` and push to GitHub Pages, browsers may cache the old files. To force a refresh:

1. In `index.html`, increment the `?v=` query parameter on the CSS and JS references:
   ```html
   <link rel="stylesheet" href="styles.css?v=22">
   <script src="script.js?v=18"></script>
   ```
2. Push the updated `index.html` along with your changed CSS/JS files.

---

## Project Structure

```
catfish-tournament-leaderboard/
├── index.html          # Main page — layout, meta tags, GA4 tracking
├── styles.css          # All styles — responsive, mobile-first, light theme
├── script.js           # All logic — fetch, parse, sort, render, auto-refresh
├── README.md           # This file — setup instructions
├── images/             # Tournament images
│   └── catfish_tournament_logo.png
└── plans/              # Architecture documentation
    └── catfish-tournament-leaderboard.md
```

---

## Troubleshooting

### Data not loading?
- Verify the Google Sheet is **published to web** (File > Share > Publish to web)
- Verify the CSV URLs are correct in `script.js`
- Check the browser console (F12) for error messages
- Make sure the sheet tab names in Google Sheets match what you published

### Weight not sorting correctly?
- Use the recommended format: `X lbs Y oz` (e.g., `12 lbs 8 oz`)
- Decimal values are supported: `9 lbs 2.5 oz` or `4.14 lbs`
- Make sure there are no extra spaces or special characters

### Changes not showing on the leaderboard?
- Google Sheets publish-to-web can have a delay of 1-5 minutes
- The leaderboard polls every 2 minutes by default
- Try a hard refresh in your browser: `Ctrl + Shift + R`

### Changes not showing after GitHub push?
- Increment the `?v=` cache-busting parameter on CSS/JS references in `index.html`
- GitHub Pages can take 1-2 minutes to deploy after a push
- Try `Ctrl + Shift + R` to force a hard refresh

### Facebook not showing the preview image?
- The `og:image` URL must be an absolute URL (starting with `https://`)
- Use the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to test your URL
- Images should be at least 1200x630 pixels for best results

---

## License

This project is free to use for personal and non-commercial tournament purposes.
