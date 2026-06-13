# Monster Friends Companion

The companion app for **Monster Friends: Battle for New Florida** — card database, party (list) builder, full rulebook, scenarios, and an at-the-table game tracker. Built as an offline-first PWA: open it once, add it to your home screen, and it works without internet at game night.

## Features

- **Monster cards** — every monster, searchable across names, attacks, ability text and keywords; size/type/favorite filters; tappable keyword popups everywhere.
- **Party builder** — pick a Party Point budget (50 / 75 / 100 / custom), add monsters, see the live total. Validation flags problems in plain language but never blocks saving.
- **Sharing** — every party exports as plain text, a share link, and a QR code. No accounts, no server: the whole list is encoded in the link (`#/import/MF1.…`).
- **Game night tracker** — per-monster HP / Action Tokens / conditions, per-player Energy, round advance (auto-refills AcT + Energy), KO tracking with win detection, opponent list import, and a one-screen "Party rules" view of everything your party can do.
- **Rulebook** — the full core rules as structured, hyperlinked sections with a glossary and global search (rules + keywords + every ability in the game).
- **Print** — a print-friendly roster with full profiles and a scan-to-import QR code.

## Development

```bash
npm install
npm run dev      # validates game data, then starts Vite
npm test         # data validation + unit tests (codec, validation, play logic)
npm run build    # full typecheck + production build to dist/
```

## Editing game data

All game content lives in [data/](data/) — the app never hardcodes a monster:

- `data/monsters/*.json` — one file per monster (file name must match its `id`)
- `data/keywords.json` — keyword + glossary popups
- `data/scenarios.json`, `data/conditions.json`, `data/generic-abilities.json`
- `data/rules/*.md` — rulebook sections (frontmatter `id`/`title`/`order`; `[[kw:bonded]]` links keywords, `[[rule:falling|see Falling]]` links sections)
- `data/meta.json` — `dataVersion` (cards) and `rulesVersion` (rulebook)

`npm run build:data` validates everything (schemas, unique ids, every cross-reference) and fails with plain-language errors — a typo can't reach the app as a blank screen. Bump `dataVersion` when card stats change; saved/shared parties carry the version and the app flags stale lists.

Monster fields still needing confirmation against the design source files are tracked in each monster's `unverified` array and listed in the app under **About → Data needing verification**.

## Deploying

Pushing to `main` runs tests, builds, and deploys to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (enable Pages → "GitHub Actions" in the repo settings). The app uses hash routing and relative paths, so it also works from any static host or subfolder — and inside a Capacitor wrapper later.
