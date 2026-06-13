/**
 * Monster Friends wiki — image processor.
 *
 * Reads the product photos, applies the image-precedence rule the project
 * owner asked for (HERO first, then FRONT, otherwise a placeholder), downsizes
 * every usable photo to web-sized .webp with ffmpeg, and writes a manifest that
 * the page generator (generate.mjs) consumes.
 *
 * It never guesses a monster<->folder link: only the explicit MONSTER_FOLDERS
 * map below is trusted. Monsters with no entry get a placeholder, and that fact
 * is recorded in the manifest so it is auditable.
 *
 *   node wiki/process-images.mjs
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const PHOTO_ROOT = 'C:/Users/josh/Pictures/orc the brand/monster friends/Product Photos'
const OUT = join(here, 'assets', 'images')
const UPLOAD = join(here, 'upload', 'images') // JPGs to upload to a MediaWiki wiki
const MAX_W = 760
const QUALITY = 80

function convertJpg(srcAbs, destAbs) {
  mkdirSync(dirname(destAbs), { recursive: true })
  execFileSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-y', '-i', srcAbs,
     '-vf', `scale='min(${MAX_W},iw)':-2`, '-q:v', '3', '-frames:v', '1', destAbs],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
}

// --- explicit, audited monster -> product-photo folder map -------------------
// Only these monsters have photography. Everything else is a placeholder.
const MONSTER_FOLDERS = {
  'bucket-troll': 'Bucket Troll',
  'gnorc-pillager': 'Gnorc Pillager',
  'mr-devil': 'Mr Devil',
  'penguin-rogue': 'Penguin Rogue',
  schnoz: 'Schnoz',
  'snapping-turtle-knight': 'Snapping Turtle Knight',
  'tumble-stone': 'Tumblestone (Smiling)',
  'wimpy-guard': 'Wimpy Guard',
}
// Monsters that reuse another monster's primary photo (same sculpt family).
const IMAGE_ALIASES = { 'small-tumble-stone': 'tumble-stone' }

// Display names -> used to name the JPG that gets uploaded to a MediaWiki wiki
// (the wikitext references [[File:<name>.jpg]], so the filename must match).
const MONSTER_NAMES = {
  'bucket-troll': 'Bucket Troll',
  'gnorc-pillager': 'Gnorc Pillager',
  'mr-devil': 'Mr. Devil',
  'penguin-rogue': 'Penguin Rogue',
  schnoz: 'Schnoz',
  'snapping-turtle-knight': 'Snapping Turtle Knight',
  'tumble-stone': 'Tumble Stone',
  'wimpy-guard': 'Wimpy Guard',
}

// Extra "sculpt variant" front shots to show as a gallery on the Tumble Stone page.
const VARIANTS = {
  'tumble-stone': [
    { label: 'Smiling', folder: 'Tumblestone (Smiling)', file: 'tumblestone smiling (front).jpg' },
    { label: 'Screaming', folder: 'Tumblestone (Screaming)', file: 'tumblestone screaming front.jpg' },
    { label: 'Spiky', folder: 'Tumblestone (Spiky)', file: 'front.jpg' },
    { label: 'Swirly Eyes', folder: 'Tumblestone (Swirly Eyes)', file: 'swirly eyes front.jpg' },
  ],
}

// Product/box + merch photos used on non-monster pages.
const SITE_IMAGES = [
  { id: 'starter-group', folder: 'Two Player Starter Kit', file: 'group shot (hero).png' },
]
const STARTER_GALLERY_FOLDER = 'Two Player Starter Kit'
const MERCH_FOLDER = 'T-Shirts'

// --- helpers -----------------------------------------------------------------
const IMG_RE = /\.(png|jpe?g|webp)$/i
const slug = (s) =>
  s
    .replace(IMG_RE, '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

function classify(file) {
  const f = file.toLowerCase()
  if (f.includes('hero')) return 'hero'
  if (f.includes('back')) return 'back'
  if (f.includes('3_4') || f.includes('3-4')) return 'three-quarter'
  if (f.includes('side')) return 'side'
  if (f.includes('front')) return 'front'
  return 'other'
}
const ANGLE_RANK = { hero: 0, front: 1, 'three-quarter': 2, side: 3, back: 4, other: 5 }

function convert(srcAbs, destAbs) {
  mkdirSync(dirname(destAbs), { recursive: true })
  execFileSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-y', '-i', srcAbs,
     '-vf', `scale='min(${MAX_W},iw)':-2`, '-quality', String(QUALITY), '-frames:v', '1', destAbs],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
  return destAbs
}

function listPhotos(folder) {
  const dir = join(PHOTO_ROOT, folder)
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => IMG_RE.test(f))
}

// --- main --------------------------------------------------------------------
// clean previous run so stale files never linger in the manifest
for (const sub of ['monsters', 'gallery', 'site', 'variants']) {
  rmSync(join(OUT, sub), { recursive: true, force: true })
}
rmSync(join(OUT, '_test.webp'), { force: true })
rmSync(UPLOAD, { recursive: true, force: true })

const manifest = { monsters: {}, variants: {}, site: {}, starterGallery: [], merch: [], generatedFrom: PHOTO_ROOT }

for (const [id, folder] of Object.entries(MONSTER_FOLDERS)) {
  const files = listPhotos(folder)
  if (!files.length) {
    console.warn(`! no photos found for ${id} in "${folder}"`)
    continue
  }
  const sorted = [...files].sort((a, b) => ANGLE_RANK[classify(a)] - ANGLE_RANK[classify(b)])
  const gallery = []
  let primaryFile = null
  for (const file of sorted) {
    const angle = classify(file)
    const out = join(OUT, 'gallery', id, `${slug(file)}.webp`)
    convert(join(PHOTO_ROOT, folder, file), out)
    gallery.push({ src: `images/gallery/${id}/${slug(file)}.webp`, angle, label: angle })
  }
  // primary = hero, else front (per the precedence rule), else first available
  const heroFile = sorted.find((f) => classify(f) === 'hero')
  const frontFile = sorted.find((f) => classify(f) === 'front')
  primaryFile = heroFile || frontFile || sorted[0]
  const primary = gallery.find((g) => g.src.endsWith(`${slug(primaryFile)}.webp`))
  // upload-ready JPG named for the wiki (e.g. "Bucket Troll.jpg")
  let uploadFile = null
  if (MONSTER_NAMES[id]) {
    uploadFile = `${MONSTER_NAMES[id]}.jpg`
    convertJpg(join(PHOTO_ROOT, folder, primaryFile), join(UPLOAD, uploadFile))
  }
  manifest.monsters[id] = { primary: primary.src, primaryKind: primary.angle, gallery, source: folder, uploadFile }
  console.log(`✓ ${id}: ${gallery.length} photos, primary=${primary.angle}${uploadFile ? `, upload="${uploadFile}"` : ''}`)
}

for (const [id, target] of Object.entries(IMAGE_ALIASES)) {
  if (manifest.monsters[target]) {
    manifest.monsters[id] = { ...manifest.monsters[target], aliasOf: target }
    console.log(`✓ ${id}: reuses ${target}'s photo`)
  }
}

for (const [id, variants] of Object.entries(VARIANTS)) {
  manifest.variants[id] = []
  for (const v of variants) {
    const out = join(OUT, 'variants', id, `${slug(v.label)}.webp`)
    convert(join(PHOTO_ROOT, v.folder, v.file), out)
    manifest.variants[id].push({ src: `images/variants/${id}/${slug(v.label)}.webp`, label: v.label })
  }
  console.log(`✓ variants for ${id}: ${variants.length}`)
}

const SITE_UPLOAD_NAMES = { 'starter-group': 'Monster Friends group.jpg' }
for (const s of SITE_IMAGES) {
  const out = join(OUT, 'site', `${s.id}.webp`)
  convert(join(PHOTO_ROOT, s.folder, s.file), out)
  let uploadFile = null
  if (SITE_UPLOAD_NAMES[s.id]) {
    uploadFile = SITE_UPLOAD_NAMES[s.id]
    convertJpg(join(PHOTO_ROOT, s.folder, s.file), join(UPLOAD, uploadFile))
  }
  manifest.site[s.id] = { src: `images/site/${s.id}.webp`, uploadFile }
  console.log(`✓ site image ${s.id}`)
}

for (const file of listPhotos(STARTER_GALLERY_FOLDER)) {
  const out = join(OUT, 'gallery', 'starter-set', `${slug(file)}.webp`)
  convert(join(PHOTO_ROOT, STARTER_GALLERY_FOLDER, file), out)
  manifest.starterGallery.push({ src: `images/gallery/starter-set/${slug(file)}.webp`, label: slug(file) })
}
console.log(`✓ starter-set gallery: ${manifest.starterGallery.length}`)

for (const file of listPhotos(MERCH_FOLDER).filter((f) => /front/i.test(f) || /\.webp$/i.test(f))) {
  const out = join(OUT, 'gallery', 'merch', `${slug(file)}.webp`)
  convert(join(PHOTO_ROOT, MERCH_FOLDER, file), out)
  manifest.merch.push({ src: `images/gallery/merch/${slug(file)}.webp`, label: slug(file) })
}
console.log(`✓ merch gallery: ${manifest.merch.length}`)

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nWrote ${join(OUT, 'manifest.json')}`)
