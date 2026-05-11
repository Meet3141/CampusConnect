This folder centralises UI theming and category metadata for the client.

What to change for a new colour scheme

1) Global tokens (CSS variables)
   - Edit `src/styles/tokens.css` to change global colours used across the app.
   - Variables you can change: `--cc-bg`, `--cc-surface`, `--cc-text`, `--cc-muted`, `--cc-border-soft`, `--cc-brand`, `--cc-brand-hover`.
   - These affect base background, surfaces, text and border accents.

2) Club categories
   - Edit `src/theme/clubs.js` to modify emoji, badge classes, gradients or hero backgrounds per category.
   - Each category contains `emoji`, `desc`, `gradient`, `color`, `badge`, `accent`, `heroBg`, `ring`, `tabActive`.
   - Updating the `badge` and `gradient` strings changes how category badges and headers render across all pages.

3) Events and statuses
   - Edit `src/theme/events.js` for event categories and `EVENT_STATUS_CLASS` for status badges.

4) Using the theme in components
   - Prefer the helpers in `src/theme/themeUtils.js`:
     - `getClubMeta(category)` → returns the full meta object
     - `clubBadgeClass(category)` → returns badge class for category
     - `clubEmoji(category)` → returns emoji
     - `getEventMeta(category)` and `eventStatusClass(status)` for events
   - Many pages already import shared constants from `src/theme/index.js` — update usage there for consistency.

5) Tailwind integration notes
   - Because many styles are Tailwind utility classes, changing CSS variables alone may not affect everything.
   - To support deeper theme switching, consider exposing CSS variables into Tailwind via `tailwind.config.js` (theme.extend.colors) or using class-based theming with a top-level `data-theme` attribute.

6) Quick workflow to test a colour tweak
   - Edit `src/styles/tokens.css` or `src/theme/clubs.js`.
   - Run local build:

```powershell
cd client
npm run dev
# or for production build
npm run build
```

If you want, I can:
- Convert more hard-coded Tailwind color classes into CSS variables so a single tokens change updates them all.
- Implement a class-based theme switcher (light/dark or brand variants) and wire a small UI control to toggle it.

*** End README
