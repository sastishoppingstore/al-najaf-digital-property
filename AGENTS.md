# Project Notes — Al Najaf Digital Property

## Live Site & Deploy
- Live: https://www.alnajafdigitalproperty.com/
- Admin login: info@alnajafdigitalproperty.com / Wafa@1122
- FTP: server `ftp.mzbloodbridge.pk`, user `ftp@alnajafdigitalproperty.com`, pass `Wafa@1122` (use lftp with `set ssl:verify-certificate no`)
- Build: `./node_modules/.bin/vite build` (outputs to `dist/`). Deploy `index.html`, `assets/*`, `api/*`, `seed-properties.json`.
- GitHub repo: `al-najaf-digital-property` (branch main). Old `al-najaf-digital-estate` repo was deleted.
- `.gitignore` ignores `node_modules`, `dist-ssr`, `*.zip`. `dist/` (live build) and `public/` are tracked.

## Known Root Causes & How to Fix (VERY IMPORTANT — apply these first when properties/sections don't load)

### 1. API URL resolution on nested routes
The API base must always resolve to the site root, NOT the current route.
- WRONG: `new URL('api/index.php', window.location.origin + window.location.pathname...)` — on `/property/z1` this hits `/property/api/index.php` (404), which sets `db_mode:0` and empty cache.
- CORRECT: `new URL('api/index.php', window.location.origin + '/')`.
- Files using this: `src/lib/dataService.ts`, `dbSync.ts`, `contentManager.ts`, `registryRates.ts`, `emailApi.ts`.
- Symptom: admin sections empty, `db_mode:0` in API responses.

### 2. Stuck hidden sections (Reveal / opacity:0)
`.reveal` CSS (src/index.css) starts with `opacity:0`; if the IntersectionObserver never fires, content stays invisible even though it renders.
- Symptom: admin Property Ads / Status sections appear blank but DOM has data, 0 console errors.
- Fix: remove `<Reveal>` wrappers (replace with plain `<div>`) or ensure observer fires. All were removed from `AdminPage.tsx`.
- Verify live: bundle JS should contain no `.reveal` references (count = 0).

### 3. "Broken" images false positives
The server returns HTTP 200 + `text/html` (SPA fallback via .htaccess) even for MISSING image files. Status-code-only checks are useless here.
- Fix: use `imageIsLoadable()` in `public/api/index.php` (local = `is_file` + `getimagesize`; remote = HEAD content-type probe).
- `get-properties` drops rows whose main image fails this check. Hidden properties until a working image exists is EXPECTED behavior.
- Symptom: curl says 200 for images but browser shows broken image.

## Workflow Tips
- `npm run typecheck` via npm wrapper can hang; use `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json` (fast, exit 0).
- Zameen.com scraping: URL format `https://www.zameen.com/Homes/Lahore-1-1.html`. Anti-bot blocks headless extraction (detached frames, WS timeout). Old `Homes_Lahore-3-1.html` patterns return "Not found".
- After any src change: typecheck → build → deploy dist + api via lftp → verify live bundle hash matches `dist/assets/index-*.js`.
- Current live bundle: `index-C-c2XM1w.js`. Verify API `get-properties` returns 81 props (65 z* + 16 DB), 0 broken main images.
