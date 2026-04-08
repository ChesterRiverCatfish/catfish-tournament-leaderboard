# 🎣 Catfish Tournament Live Leaderboard

A live, auto-refreshing leaderboard for catfish tournaments. Officials enter data in Google Sheets, and the leaderboard displays on a mobile-friendly website that can be shared on Facebook and social media.

## Features

- **Adult Division** — 3 separate leaderboards:
  - Channel Catfish (top 3 win prizes 🥇🥈🥉)
  - Blue/Flathead Catfish (top 3 win prizes 🥇🥈🥉)
  - 3 Fish Stringer (top 3 win prizes 🥇🥈🥉)
- **Junior Division** — 1 combined leaderboard (top 4 win prizes 🥇🥈🥉🏅)
- **Auto-refresh** every 2 minutes
- **Mobile-first** responsive design
- **Social media sharing** with Open Graph meta tags for rich Facebook previews
- **Customizable** tournament name, date, banner image, and sponsors
- **No backend required** — Google Sheets is the database

---

## Quick Start

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Create **4 tabs** (rename the sheet tabs at the bottom):
   - `Channel Catfish`
   - `Blue/Flathead Catfish`
   - `3 Fish Stringer`
   - `Junior`

3. In each tab, add these column headers in **Row 1**:

   | A | B |
   |---|---|
   | **Name** | **Weight** |

4. Enter fish data below the headers. Weight format: `X lbs Y oz`

   Example:
   | Name | Weight |
   |------|--------|
   | John Smith | 12 lbs 8 oz |
   | Jane Doe | 9 lbs 4 oz |
   | Bob Wilson | 7 lbs 2 oz |

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
4. Repeat for all 4 tabs. Note which URL goes with which tab.

### Step 3: Configure the Leaderboard

1. Open `script.js`
2. Edit the `CONFIG` section at the top of the file:

```javascript
const CONFIG = {
    // Tournament Info
    tournamentName: "Your Tournament Name Here",
    tournamentDate: "June 14, 2026",
    tournamentBanner: "images/tournament-banner.jpg",

    // Paste your Google Sheets CSV URLs here
    sheets: {
        channelCatfish:   "https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv",
        blueFlathead:     "https://docs.google.com/spreadsheets/d/e/.../pub?gid=123456&single=true&output=csv",
        stringer:         "https://docs.google.com/spreadsheets/d/e/.../pub?gid=789012&single=true&output=csv",
        junior:           "https://docs.google.com/spreadsheets/d/e/.../pub?gid=345678&single=true&output=csv"
    },

    // Refresh interval in minutes
    refreshInterval: 2,

    // Sponsors (optional)
    sponsors: [
        { name: "Bait Shop Pro", logo: "images/sponsors/baitshop.png", url: "https://baitshoppro.com" },
        { name: "Lake Marina", logo: "images/sponsors/marina.png" }
    ],

    // Footer text
    footerText: "Your Tournament Name — Leaderboard"
};
```

### Step 4: Add Images (Optional)

1. Create an `images/` folder in the project directory
2. Add your tournament banner image as `images/tournament-banner.jpg`
3. For sponsors, create `images/sponsors/` and add logo images
4. Update the file paths in the `CONFIG` section if needed

### Step 5: Update Open Graph Meta Tags

For the best Facebook sharing preview, edit `index.html` and update these meta tags:

```html
<meta property="og:title" content="Your Tournament Name — Live Leaderboard">
<meta property="og:description" content="Live standings for Your Tournament Name!">
<meta property="og:image" content="https://YOUR-GITHUB-USERNAME.github.io/catfish-tournament-leaderboard/images/tournament-banner.jpg">
<meta property="og:url" content="https://YOUR-GITHUB-USERNAME.github.io/catfish-tournament-leaderboard/">
```

> **Note:** The `og:image` URL must be a full absolute URL for Facebook to display it.

### Step 6: Deploy to GitHub Pages

1. Create a new repository on [GitHub](https://github.com) (e.g., `catfish-tournament-leaderboard`)
2. Upload all project files:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `images/` folder (with your banner and sponsor logos)
3. Go to **Settings > Pages** in your repository
4. Under "Source," select **Deploy from a branch**
5. Select `main` branch and `/ (root)` folder
6. Click **Save**
7. Wait 1-2 minutes — your site will be live at:
   ```
   https://YOUR-GITHUB-USERNAME.github.io/catfish-tournament-leaderboard/
   ```

### Step 7: Share on Social Media

Copy the GitHub Pages URL and share it on Facebook, Twitter, or any social media platform. The Open Graph meta tags will generate a rich preview card.

---

## During the Tournament

1. **Officials** open the Google Sheet on a phone, tablet, or laptop
2. Enter each weigh-in: type the angler's **Name** and **Weight** (e.g., `14 lbs 6 oz`)
3. The leaderboard website **auto-refreshes every 2 minutes** to show the latest standings
4. Viewers on Facebook can tap the shared link anytime to see live results

---

## Customization

### Refresh Interval
Change `refreshInterval` in the CONFIG section. Value is in minutes.

### Weight Format
The parser supports flexible weight formats:
- `12 lbs 8 oz` (recommended)
- `12 lb 8 oz`
- `12lbs 8oz`
- `12 pounds 8 ounces`
- `12 lbs` (ounces default to 0)
- `8 oz` (pounds default to 0)

### Styling
Edit `styles.css` to change colors, fonts, and layout. The design uses CSS custom properties and is easy to modify.

---

## Project Structure

```
catfish-tournament-leaderboard/
├── index.html          # Main page — layout, meta tags
├── styles.css          # All styles — responsive, mobile-first
├── script.js           # All logic — fetch, parse, sort, render
├── README.md           # This file — setup instructions
├── images/             # Tournament images
│   ├── tournament-banner.jpg
│   └── sponsors/       # Sponsor logos
│       ├── sponsor1.png
│       └── sponsor2.png
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
- Make sure there are no extra spaces or special characters

### Changes not showing on the leaderboard?
- Google Sheets publish-to-web can have a delay of 1-5 minutes
- The leaderboard polls every 2 minutes by default
- Try a hard refresh in your browser: `Ctrl + Shift + R`

### Facebook not showing the preview image?
- The `og:image` URL must be an absolute URL (starting with `https://`)
- Use the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to test your URL
- Images should be at least 1200x630 pixels for best results

---

## License

This project is free to use for personal and non-commercial tournament purposes.
