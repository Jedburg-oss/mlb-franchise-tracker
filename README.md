# Franchise Tracker — MLB The Show

A personal franchise mode tracker for MLB The Show. The canonical season data lives in `public/franchise-data.csv` and is bundled with the site, so anyone who visits the URL automatically sees your full franchise history — no upload needed on their end.

100% client-side. No database, no backend, no auth. Free to host on GitHub Pages.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Vite%20%2B%20TS-ff2d2d) ![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages-black)

## How it works

- The CSV at `public/franchise-data.csv` is the **canonical** data — what visitors see.
- When the site loads, it auto-fetches that CSV and populates the app.
- You can still upload new CSVs in the browser to preview locally before publishing.
- Once you're happy with the preview, export it as `franchise-data.csv`, replace the file in `public/`, commit, and `npm run deploy`. Your friends now see the update.

## Features

- **Dashboard** — top OVR list, trending players, MVP/Cy Young races, league leaders at a glance.
- **Players** — searchable, filterable, sortable grid of everyone in the franchise.
- **Player profile** — career totals, season-by-season tables, interactive ratings charts, attribute radar, season notes, MLB records broken, awards timeline.
- **Compare** — pick up to 4 players, overlay ratings and stats over time, current attribute radar.
- **Teams** — current rosters with W-L records, historical rosters by season with team narrative per year.
- **Leaders** — sortable league leaders for HR, AVG, OPS, ERA, K, etc., filterable by season.
- **Trade/edit** — change a player's team mid-career or delete players. Career history preserved.
- **Export** — dump everything back to CSV for committing to the repo.

## Quick Start (local development)

```bash
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173/mlb-franchise-tracker/`. The franchise data loads automatically.

## Update the live site with a new season

After finishing a season in MLB The Show:

1. Fill in your new season rows in `public/franchise-data.csv` (or upload a season CSV via the live site, then click **Export franchise-data.csv** on the Upload page and replace the file in `public/`).
2. Commit and push:

   ```bash
   git add public/franchise-data.csv
   git commit -m "season 19 data"
   git push
   npm run deploy
   ```

3. Done. Your friends see the new season in ~30 seconds.

## Deploy fresh

If you're starting from scratch on a new repo:

1. Create a new GitHub repo.
2. In `vite.config.ts`, change `base: '/mlb-franchise-tracker/'` to `'/your-repo-name/'`.
3. Push:

   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   npm run deploy
   ```

4. GitHub repo → Settings → Pages → Source: `gh-pages` branch → Save.

Site lives at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

## CSV Format

The canonical CSV has **one row per player per season**.

**Required columns:** `PlayerID`, `Name`, `Season`, `Team`, `PrimaryPosition`, `OVR`

**Narrative columns** (these display in the UI but are optional):
- `SeasonNote` — short sentence describing the player's season (e.g. "Won Batting Title, .352 average")
- `MLBRecord` — any MLB record set/tied that season
- `TeamWL` — team's win-loss record that year (e.g. "108-54")
- `TeamRecord` — team narrative for that season (e.g. "AL East Title; lost in ALCS")
- `Awards` — semicolon-separated (e.g. "MVP;Gold Glove;All-Star")
- `Quirks` — comma-separated (e.g. "Bomber,Hot Head,Clutch Hitter")

**Stat columns** (all optional): every MLB The Show attribute, every hitting/pitching/fielding stat. See `public/franchise-data.csv` for the full template.

### Key behaviors

- **PlayerID** is the stable identifier across seasons. Use the same ID every season for the same player.
- **Team** can change between seasons — the app preserves the full team history.
- **Position** can change too.
- **Quirks** comma-separated; **Awards** semicolon-separated (because award names sometimes contain commas).

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (custom theme — charcoal background, electric red accent, condensed display typography)
- Recharts for all charts
- PapaParse for CSV parsing
- Zustand with localStorage middleware for state persistence
- React Router (HashRouter, for GitHub Pages compatibility)
- Lucide for icons

## Project Structure

```
src/
├── components/      # Layout, Navbar, StatCard, SectionHeader
├── pages/           # Dashboard, Players, PlayerProfile, Compare, Teams, TeamProfile, Leaders, Upload
├── hooks/           # useCanonicalLoader (auto-fetches public/franchise-data.csv)
├── lib/
│   ├── types.ts     # Type definitions
│   ├── csv.ts       # CSV parser
│   ├── stats.ts     # Career aggregation, formatting helpers
│   └── store.ts     # Zustand store + localStorage persistence
├── App.tsx          # Router
├── main.tsx         # Entry
└── index.css        # Tailwind + custom styles

public/
└── franchise-data.csv  # Canonical data (what visitors see)
```

## License

Personal use. Built specifically for MLB The Show franchise mode tracking.
