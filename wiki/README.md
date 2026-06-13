# Monster Friends Wiki

A fan wiki for **Monster Friends: Battle for New Florida**, produced in two forms from the
game's own structured data (`../data/`):

1. **`upload/`** — portable **MediaWiki wikitext**, ready to publish to any MediaWiki-based
   wiki (self-hosted, Miraheze, Fandom, wiki.gg…). Includes a one-shot **XML import dump**.
2. **`site/`** — a self-contained **static wiki website**. Just open `site/index.html` in a
   browser. No server, no build, works offline.

Both are generated from the same source, so the numbers always match the cards.

---

## Build it

```bash
node wiki/process-images.mjs   # resize product photos -> webp + upload JPGs (run when photos change)
node wiki/generate.mjs         # build upload/ (MediaWiki) and site/ (static site)
```

- `process-images.mjs` uses **ffmpeg** (no ImageMagick needed) to downsize the photos in
  `…/Pictures/orc the brand/monster friends/Product Photos`. It writes
  `assets/images/manifest.json`, which the generator reads.
- `generate.mjs` reads `../data/` directly (monsters, rules, keywords, scenarios, conditions,
  generic abilities) plus the image manifest and the optional `content/overviews.json`.

### Source layout

| File | Purpose |
|---|---|
| `process-images.mjs` | photo pipeline + precedence rule (hero → front → placeholder) |
| `generate.mjs` | entry point — runs both generators |
| `gen-wikitext.mjs` | builds `.wiki` pages + the XML import dump + image guide |
| `gen-site.mjs` | builds the static HTML site |
| `lib/data.mjs` | loads game data, formatting helpers, title/URL resolvers |
| `lib/markup.mjs` | the shared rich-text engine (→ wikitext and → HTML) |
| `content/overviews.json` | grounded per-monster prose woven into pages (optional) |

---

## Publish the MediaWiki version (`upload/`)

**Option A — one-shot XML import** (generic MediaWiki / Miraheze; needs import rights):
1. Upload the JPGs in `upload/images/` via `Special:Upload`, keeping the exact filenames.
2. `Special:Import` → import `upload/MonsterFriendsWiki.xml`.
   (Self-hosted: `php maintenance/importDump.php MonsterFriendsWiki.xml`.)

**Option B — copy/paste:** every page is also in `upload/pages/*.wiki`. `upload/PAGES.tsv`
maps each file to its exact page title; the first line of each file repeats the title.

See `upload/IMAGE_UPLOAD_GUIDE.md` for the full image list and Fandom notes.

The wikitext uses only core MediaWiki (inline wikitable infoboxes, `[[links]]`, categories) —
no templates or extensions required.

---

## Host the static site (`site/`)

Open `site/index.html`, or drop the `site/` folder on any static host (GitHub Pages, Netlify,
an S3 bucket, a USB stick). It has client-side search, monster infoboxes, photo galleries, and
a mobile nav.

---

## Images

Product photos follow the rule: **hero shot if one exists, otherwise the front shot, otherwise
a placeholder.** Eight monsters have photography; the rest show a "Photo coming soon"
placeholder until art exists. The monster → photo mapping is explicit and auditable in
`process-images.mjs` and `assets/images/manifest.json` — it is never guessed.
