// Download the Google Fonts latin subsets and inline them as base64 data URIs into
// src/styles/fonts.css, so the offline PWA ships its brand fonts (no CDN at runtime).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const families = [
  'Baloo+2:wght@600;700;800',
  'Hanken+Grotesk:wght@400;500;600;700;800',
  'Patrick+Hand',
]
const url = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text()

// css2 emits, per face: a `/* subset */` comment then an @font-face block.
const blocks = css.split('/*').slice(1)
let out = `/* Brand fonts — latin subsets, self-hosted (base64) for offline PWA.\n   Baloo 2 = display, Hanken Grotesk = body, Patrick Hand = marker. */\n\n`
let kept = 0
for (const b of blocks) {
  const subset = b.slice(0, b.indexOf('*/')).trim()
  if (subset !== 'latin') continue
  const face = b.slice(b.indexOf('@font-face'))
  const m = face.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)
  if (!m) continue
  const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer())
  const dataUri = `data:font/woff2;base64,${buf.toString('base64')}`
  const rewritten = face.slice(0, face.indexOf('}') + 1).replace(m[1], dataUri)
  out += rewritten.trim() + '\n\n'
  kept++
}
mkdirSync(join(root, 'src', 'styles'), { recursive: true })
writeFileSync(join(root, 'src', 'styles', 'fonts.css'), out)
console.log(`wrote src/styles/fonts.css with ${kept} latin faces (${Math.round(out.length / 1024)} KB)`)
