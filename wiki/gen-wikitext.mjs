/**
 * Generates portable MediaWiki wikitext for the Monster Friends wiki:
 *   - one .wiki file per page (for copy-paste / reference / version control)
 *   - a single MediaWiki XML import dump (Special:Import — the one-shot upload)
 *   - an image-upload guide
 *
 * Infoboxes are inlined as wikitables (no template/extension dependencies), so
 * the pages work on any vanilla MediaWiki install.
 */
import { writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderWiki } from './lib/markup.mjs'
import {
  data, keywordById, ruleById, keywordTitleById, ruleTitleById,
  SIZE_LABELS, BASE_SIZES, bonus, emiText, moveText, defenseText, abilityCostText, tagLabel,
  monsterImage,
} from './lib/data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, 'upload')
const PAGES_DIR = join(OUT, 'pages')
const TIMESTAMP = '2026-06-13T00:00:00Z'
const GAME = 'Monster Friends: Battle for New Florida'

// explicit cross-reference links -> wikitext
const links = {
  kw(id, label) {
    const t = keywordTitleById(id)
    const l = label || t
    return l === t ? `[[${t}]]` : `[[${t}|${l}]]`
  },
  rule(id, label) {
    const t = ruleTitleById(id)
    const l = label || t
    return l === t ? `[[${t}]]` : `[[${t}|${l}]]`
  },
}
const rt = (text) => renderWiki(text, links)

const pages = [] // { title, ns, text }
const add = (title, text, ns = 0) => pages.push({ title, ns, text: text.trim() + '\n' })

// =============================================================== MONSTER PAGES
function monsterInfobox(m) {
  const img = monsterImage(m.id)
  const imageRow = img?.uploadFile
    ? `|-\n| colspan="2" style="text-align:center; padding:8px;" | [[File:${img.uploadFile}|frameless|center|260px|${m.name}]]`
    : `|-\n| colspan="2" style="text-align:center; padding:8px; color:#888; font-style:italic;" | 📷 Photo coming soon`
  const kw = m.keywords.length ? m.keywords.map((id) => links.kw(id)).join(', ') : '—'
  const rows = [
    ['Size', `${SIZE_LABELS[m.size]} (${BASE_SIZES[m.size]} base)`],
    ['Party Points', `${m.partyPoints}`],
    ['Action Tokens', `${m.act}`],
    ['Movement', moveText(m.movement)],
    ['Emotional Instability', emiText(m.emi)],
    ['Health Points', `${m.hp}`],
    ['Defense', defenseText(m.defense)],
    ['Keywords', kw],
  ]
  return [
    `{| class="infobox" style="float:right; clear:right; width:24em; margin:0 0 1em 1.5em; border:1px solid #a2a9b1; background:#f8f9fa; font-size:90%; line-height:1.5;"`,
    `|-`,
    `! colspan="2" style="background:#3a2b4a; color:#fff; font-size:1.25em; text-align:center; padding:6px;" | ${m.name}`,
    imageRow,
    ...rows.map(([k, v]) => `|-\n! style="text-align:left; background:#eee; width:45%; padding:4px 8px;" | ${k}\n| style="padding:4px 8px;" | ${v}`),
    `|}`,
  ].join('\n')
}

function attacksSection(m) {
  if (!m.attacks.length) return `== Basic Attacks ==\n''No basic attacks in the current card draft.''`
  const header = `! Attack !! Type !! Range !! Dice !! Swings !! Bonus !! Crit Bonus !! Keywords`
  const rows = m.attacks.map((a) => {
    const range = a.type === 'ranged' ? `${a.range ?? '?'}"` : '—'
    const tags = a.tags?.length ? a.tags.map((t) => links.kw(t.tag, tagLabel(t))).join(', ') : ''
    return `|-\n| '''${a.name}''' || ${a.type === 'ranged' ? 'Ranged' : 'Melee'} || ${range} || ${a.die} || ${a.swings} || ${bonus(a.bonus)} || ${bonus(a.critBonus)} || ${tags}`
  })
  const notes = m.attacks
    .filter((a) => a.notes)
    .map((a) => `* '''${a.name}:''' ${rt(a.notes)}`)
  let out = `== Basic Attacks ==\n{| class="wikitable"\n${header}\n${rows.join('\n')}\n|}`
  if (notes.length) out += `\n\n${notes.join('\n')}`
  return out
}

function abilitiesSection(m) {
  if (!m.abilities.length) return ''
  const parts = m.abilities.map((ab) => {
    const reaction = ab.reaction ? ` ''(reaction — usable outside this monster's own activation)''` : ''
    return `=== ${ab.name} ===\n'''Cost:''' ${abilityCostText(ab.cost)}${reaction}\n\n${rt(ab.text)}`
  })
  return `== Special Abilities ==\n${parts.join('\n\n')}`
}

function monsterPage(m) {
  const ov = data.overviews[m.id]
  const profile =
    `'''Profile:''' ${SIZE_LABELS[m.size]} · ${m.partyPoints} Party Points · ${m.act} Action Tokens · ` +
    `Move ${moveText(m.movement)} · EmI ${emiText(m.emi)} · HP ${m.hp} · Defense ${defenseText(m.defense)}`
  const lead = `'''${m.name}''' is a ${SIZE_LABELS[m.size]} monster in the miniatures game ''${GAME}''.`
  const out = [monsterInfobox(m), lead]
  if (ov?.overview) out.push(rt(ov.overview))
  out.push(profile)
  if (ov?.role) out.push(`== Playstyle ==\n${rt(ov.role)}`)
  out.push(attacksSection(m))
  const ab = abilitiesSection(m)
  if (ab) out.push(ab)
  if (m.keywords.length) {
    const items = m.keywords.map((id) => {
      const k = keywordById.get(id)
      return `* ${links.kw(id)}${k ? ` — ${rt(k.short)}` : ''}`
    })
    out.push(`== Keywords ==\n${items.join('\n')}`)
  }
  if (m.flavor) out.push(`== Flavor ==\n<blockquote>${rt(m.flavor)}</blockquote>`)
  if (m.unverified?.length) {
    out.push(
      `== Notes ==\n''Profile from card data v${data.meta.dataVersion}. Some details are still being finalized:''\n` +
        m.unverified.map((u) => `* ${u}`).join('\n'),
    )
  }
  const cats = [`[[Category:Monsters]]`, `[[Category:${SIZE_LABELS[m.size]} monsters]]`]
  out.push(cats.join('\n'))
  return out.join('\n\n')
}

for (const m of data.monsters) add(m.name, monsterPage(m))

// ================================================================= RULE PAGES
for (const r of data.rules) {
  // generic-abilities is published as the dedicated "Generic Abilities" page below
  if (r.id === 'generic-abilities') continue
  const body = renderWiki(r.body, links)
  add(r.title, `${body}\n\n[[Category:Rules]]`)
}

// ============================================================== KEYWORD PAGES
for (const k of data.keywords) {
  const catLabel = k.category === 'keyword' ? 'Ability keyword' : 'Game term'
  const see = k.ruleRef && ruleById.get(k.ruleRef) ? `\n\n''See also:'' [[${ruleTitleById(k.ruleRef)}]]` : ''
  const cat = k.category === 'keyword' ? '[[Category:Keywords]]' : '[[Category:Glossary]]'
  add(
    k.name,
    `'''${k.name}''' (${catLabel})\n\n${rt(k.short)}${see}\n\n${cat}`,
  )
}

// ============================================================== SCENARIO PAGES
for (const s of data.scenarios) {
  const out = [`'''${s.name}''' is a scenario for ''${GAME}''.`, `== Summary ==\n${rt(s.summary)}`]
  if (s.setup) out.push(`== Setup ==\n${rt(s.setup)}`)
  out.push(`== How to win ==\n${rt(s.winCondition)}`)
  if (s.specialRules?.length) out.push(`== Special rules ==\n${s.specialRules.map((x) => `* ${rt(x)}`).join('\n')}`)
  if (s.recommendedPoints) out.push(`'''Recommended Party Points:''' ${s.recommendedPoints}`)
  out.push(`[[Category:Scenarios]]`)
  add(s.name, out.join('\n\n'))
}

// =========================================================== GENERIC ABILITIES
{
  const intro = `These '''generic abilities''' can be used by '''any monster''' in ''${GAME}'' (core rules, [[${ruleTitleById('generic-abilities')}]]).`
  const body = data.genericAbilities
    .map((ab) => {
      const reaction = ab.reaction ? ` ''(reaction)''` : ''
      return `== ${ab.name} ==\n'''Cost:''' ${abilityCostText(ab.cost)}${reaction}\n\n${rt(ab.text)}`
    })
    .join('\n\n')
  add('Generic Abilities', `${intro}\n\n${body}\n\n[[Category:Rules]]`)
}

// =========================================================== TOKENS/CONDITIONS
{
  const body = data.conditions.map((c) => `== ${c.name} ==\n${rt(c.short)}`).join('\n\n')
  add('Tokens and Conditions', `Common tokens and temporary conditions used in ''${GAME}''.\n\n${body}\n\n[[Category:Rules]]`)
}

// ============================================================ MONSTERS LISTING
{
  const header = `! Monster !! Size !! PP !! AcT !! Move !! EmI !! HP !! Defense !! Keywords`
  const rows = data.monsters.map((m) => {
    const kw = m.keywords.map((id) => links.kw(id)).join(', ')
    return `|-\n| [[${m.name}]] || ${SIZE_LABELS[m.size]} || ${m.partyPoints} || ${m.act} || ${moveText(m.movement)} || ${emiText(m.emi)} || ${m.hp} || ${m.defense.die} ${bonus(m.defense.bonus)}/${bonus(m.defense.critBonus)} || ${kw}`
  })
  add(
    'Monsters',
    `All ${data.monsters.length} monsters in ''${GAME}'' (card data v${data.meta.dataVersion}). Click a column header to sort.\n\n` +
      `{| class="wikitable sortable"\n${header}\n${rows.join('\n')}\n|}\n\n[[Category:Monsters]]`,
  )
}

// ================================================================ RULES INDEX
{
  const toc = data.rules.map((r, i) => `# [[${r.title}]]`).join('\n')
  const extra = `\n\nReference:\n* [[Generic Abilities]]\n* [[Tokens and Conditions]]\n* [[Glossary]]`
  add('Rules', `The complete core rules of ''${GAME}'' (rulebook v${data.meta.rulesVersion}).\n\n${toc}${extra}\n\n[[Category:Rules]]`)
}

// ===================================================================== GLOSSARY
{
  const group = (cat) =>
    data.keywords
      .filter((k) => k.category === cat)
      .map((k) => `; [[${k.name}]]\n: ${rt(k.short)}`)
      .join('\n')
  add(
    'Glossary',
    `Keywords and game terms used throughout ''${GAME}''.\n\n` +
      `== Ability keywords ==\n${group('keyword')}\n\n== Game terms ==\n${group('term')}\n\n[[Category:Glossary]]`,
  )
}

// ==================================================================== MAIN PAGE
{
  const groupImg = data.images.site['starter-group']?.uploadFile
  const hero = groupImg ? `[[File:${groupImg}|thumb|right|400px|The Monster Friends starter lineup]]\n\n` : ''
  const grid = data.monsters
    .map((m) => `* [[${m.name}]] (${SIZE_LABELS[m.size]}, ${m.partyPoints} PP)`)
    .join('\n')
  add(
    'Main Page',
    `${hero}Welcome to the '''${GAME}''' wiki — a fan reference for the indie miniatures skirmish game where every monster is meant to feel ''broken, flavorful, and fun''.\n\n` +
      `${rt(ruleById.get('what-is-this-game').body.split('\n\n')[0])}\n\n` +
      `== Get started ==\n* [[What is this game?]] — the premise\n* [[What do I need to play?]] — gear\n* [[Choosing your Friends]] — party building\n* [[Setting Up for Battle]] — deployment\n* [[Fighting is Fun!]] — the starter scenario\n\n` +
      `== Browse ==\n* '''[[Rules]]''' — the full core rulebook\n* '''[[Monsters]]''' — every monster, sortable\n* '''[[Glossary]]''' — keywords & terms\n* '''[[Generic Abilities]]''' — abilities any monster can use\n* '''[[Tokens and Conditions]]'''\n\n` +
      `== Monsters ==\n${grid}\n\n` +
      `----\n''Fan-made reference. ${GAME} is designed by its respective creator. Card data v${data.meta.dataVersion}, rules v${data.meta.rulesVersion}.''`,
  )
}

// ============================================================== CATEGORY PAGES
const catDescs = {
  Monsters: 'All playable monsters in the game.',
  Rules: 'Core rulebook sections and reference pages.',
  Keywords: 'Printed ability keywords that appear on monster cards.',
  Glossary: 'General game terms and definitions.',
  Scenarios: 'Ways to play — missions and win conditions.',
  'Small monsters': 'Monsters on a 28mm base.',
  'Medium monsters': 'Monsters on a 40mm base.',
  'Large monsters': 'Monsters on a 60mm base.',
}
for (const [name, desc] of Object.entries(catDescs)) {
  add(`Category:${name}`, desc, 14)
}

// ===================================================================== WRITE
rmSync(PAGES_DIR, { recursive: true, force: true })
for (const f of existsSync(OUT) ? readdirSync(OUT) : []) {
  if (f.endsWith('.xml') || f === 'IMAGE_UPLOAD_GUIDE.md' || f === 'PAGES.tsv') rmSync(join(OUT, f), { force: true })
}
mkdirSync(PAGES_DIR, { recursive: true })

const safeFile = (title) =>
  title.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').replace(/^Category:/, 'Category_') + '.wiki'

const tsv = ['file\tpage_title\tnamespace']
for (const p of pages) {
  const file = safeFile(p.title)
  writeFileSync(join(PAGES_DIR, file), `<!-- Page title: ${p.title} -->\n${p.text}`)
  tsv.push(`pages/${file}\t${p.title}\t${p.ns}`)
}
writeFileSync(join(OUT, 'PAGES.tsv'), tsv.join('\n') + '\n')

// MediaWiki XML import dump (Special:Import)
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const xml = [
  `<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.11/" version="0.11" xml:lang="en">`,
  `  <siteinfo>`,
  `    <sitename>Monster Friends Wiki</sitename>`,
  `    <namespaces>`,
  `      <namespace key="0" case="first-letter" />`,
  `      <namespace key="14" case="first-letter">Category</namespace>`,
  `    </namespaces>`,
  `  </siteinfo>`,
]
for (const p of pages) {
  xml.push(
    `  <page>`,
    `    <title>${xmlEsc(p.title)}</title>`,
    `    <ns>${p.ns}</ns>`,
    `    <revision>`,
    `      <timestamp>${TIMESTAMP}</timestamp>`,
    `      <contributor><username>MonsterFriendsImport</username></contributor>`,
    `      <comment>Generated from Monster Friends game data v${data.meta.dataVersion}</comment>`,
    `      <model>wikitext</model>`,
    `      <format>text/x-wiki</format>`,
    `      <text xml:space="preserve">${xmlEsc(p.text)}</text>`,
    `    </revision>`,
    `  </page>`,
  )
}
xml.push(`</mediawiki>`)
writeFileSync(join(OUT, 'MonsterFriendsWiki.xml'), xml.join('\n') + '\n')

// Image-upload guide
const imgRows = data.monsters
  .map((m) => {
    const img = monsterImage(m.id)
    return `| ${m.name} | ${img?.uploadFile ? `\`${img.uploadFile}\`` : '— (placeholder)'} | ${img?.aliasOf ? `reuses ${img.aliasOf}` : img?.primaryKind || 'no photo'} |`
  })
  .join('\n')
const guide = `# Image upload guide — Monster Friends Wiki

The wikitext references images by file name. Upload the JPGs in \`upload/images/\` to your
wiki (Special:Upload, or Special:UploadWizard on Fandom) **keeping the exact file names**, then
the infoboxes will show them automatically.

Only monsters that have product photography get an image; the rest show a "Photo coming soon"
placeholder until art exists. This follows the hero > front > placeholder rule.

## Files to upload (from \`upload/images/\`)

| Monster / page | Upload as | Source photo |
|---|---|---|
${imgRows}
| Main Page | \`Monster Friends group.jpg\` | Two-player starter group shot |

## How to publish the whole wiki at once

**Option A — XML import (fastest, generic MediaWiki / Miraheze):**
1. Upload the images above (Special:Upload).
2. Go to \`Special:Import\` and import \`MonsterFriendsWiki.xml\`.
   (Requires import rights; on a self-hosted wiki run \`php maintenance/importDump.php\`.)

**Option B — copy/paste:** create each page from \`upload/pages/\`. \`PAGES.tsv\` maps every
file to its exact page title. The first line of each file is an HTML comment with the title.

> Fandom note: Fandom restricts Special:Import; there, upload images and paste pages from
> \`upload/pages/\`, or ask Fandom staff to run the import.
`
writeFileSync(join(OUT, 'IMAGE_UPLOAD_GUIDE.md'), guide)

console.log(`wikitext: ${pages.length} pages → upload/pages/*.wiki + MonsterFriendsWiki.xml`)
export { pages }
