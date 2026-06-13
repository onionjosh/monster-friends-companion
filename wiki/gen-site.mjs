/**
 * Generates the standalone static wiki site (wiki/site/). Self-contained:
 * open site/index.html in any browser — no server, no build step.
 */
import { writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderHtml, escapeHtml } from './lib/markup.mjs'
import {
  data, keywordById, ruleById, keywordTitleById, ruleTitleById,
  SIZE_LABELS, BASE_SIZES, bonus, emiText, moveText, defenseText, abilityCostText, tagLabel, attackSummary,
  monsterImage, monsterUrl, ruleUrl, keywordUrl,
} from './lib/data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SITE = join(here, 'site')
const GAME = 'Monster Friends: Battle for New Florida'

// cross-reference links -> HTML (base-aware)
const linksHtml = (base) => ({
  kw: (id, label) => `<a class="kw" href="${keywordUrl(id, base)}">${escapeHtml(label || keywordTitleById(id))}</a>`,
  rule: (id, label) => `<a class="rule" href="${ruleUrl(id, base)}">${escapeHtml(label || ruleTitleById(id))}</a>`,
})
const rh = (text, base, hLevel = 3) => renderHtml(text, { hLevel, links: linksHtml(base) })

const ANGLE_LABELS = { hero: 'Hero', front: 'Front', 'three-quarter': '¾ view', side: 'Side', back: 'Back', other: '' }

// ------------------------------------------------------------------- layout
function nav(base, active) {
  const item = (href, label, key) =>
    `<a href="${base}${href}"${key === active ? ' class="active"' : ''}>${label}</a>`
  const monsterLinks = data.monsters.map((m) => `<a href="${monsterUrl(m.id, base)}">${escapeHtml(m.name)}</a>`).join('')
  const ruleLinks = data.rules.map((r) => `<a href="${ruleUrl(r.id, base)}">${escapeHtml(r.title)}</a>`).join('')
  return `<nav class="sidebar" id="sidebar">
  <div class="nav-group">${item('index.html', '🏠 Home', 'home')}</div>
  <div class="nav-group"><div class="nav-head">${item('monsters/index.html', '👹 Monsters', 'monsters')}</div><div class="nav-sub">${monsterLinks}</div></div>
  <div class="nav-group"><div class="nav-head">${item('rules/index.html', '📖 Rules', 'rules')}</div><div class="nav-sub">${ruleLinks}</div></div>
  <div class="nav-group">${item('glossary.html', '📑 Glossary', 'glossary')}</div>
  <div class="nav-group">${item('generic-abilities.html', '✨ Generic Abilities', 'generic')}</div>
  <div class="nav-group">${item('scenarios.html', '🎯 Scenarios', 'scenarios')}</div>
  <div class="nav-group">${item('conditions.html', '🔖 Tokens &amp; Conditions', 'conditions')}</div>
  <div class="nav-group">${item('about.html', 'ℹ️ About', 'about')}</div>
</nav>`
}

function layout({ title, base, active, content, heroCrumb = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Monster Friends Wiki</title>
<link rel="stylesheet" href="${base}assets/style.css">
<script>window.WIKI_BASE=${JSON.stringify(base)};</script>
</head>
<body>
<header class="topbar">
  <button class="menu-btn" id="menuBtn" aria-label="Menu">☰</button>
  <a class="brand" href="${base}index.html">Monster Friends <span>Wiki</span></a>
  <div class="search"><input id="searchInput" type="search" placeholder="Search monsters, rules, keywords…" autocomplete="off"><div id="searchResults" class="search-results"></div></div>
</header>
<div class="layout">
${nav(base, active)}
<main class="content">${heroCrumb}${content}</main>
</div>
<div class="lightbox" id="lightbox"><img id="lightboxImg" alt=""></div>
<script src="${base}assets/search-index.js"></script>
<script src="${base}assets/app.js"></script>
</body>
</html>`
}

function write(relPath, html) {
  const full = join(SITE, relPath)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, html)
}

// ---------------------------------------------------------------- monster page
function monsterInfobox(m, base) {
  const img = monsterImage(m.id)
  const imageHtml = img
    ? `<a class="zoom" href="${base}${img.primary}"><img src="${base}${img.primary}" alt="${escapeHtml(m.name)}"></a>`
    : `<div class="noimg">📷<br>Photo coming soon</div>`
  const kw = m.keywords.length ? m.keywords.map((id) => linksHtml(base).kw(id)).join(', ') : '—'
  const row = (k, v) => `<tr><th>${k}</th><td>${v}</td></tr>`
  return `<aside class="infobox">
  <div class="ib-title">${escapeHtml(m.name)}</div>
  <div class="ib-img">${imageHtml}</div>
  <table>
    ${row('Size', `${SIZE_LABELS[m.size]} <span class="muted">(${BASE_SIZES[m.size]})</span>`)}
    ${row('Party Points', m.partyPoints)}
    ${row('Action Tokens', m.act)}
    ${row('Movement', moveText(m.movement))}
    ${row('Emot. Instability', emiText(m.emi))}
    ${row('Health', m.hp)}
    ${row('Defense', escapeHtml(defenseText(m.defense)))}
    ${row('Keywords', kw)}
  </table>
</aside>`
}

function monsterAttacks(m, base) {
  if (!m.attacks.length) return `<h2>Basic Attacks</h2><p class="muted"><em>No basic attacks in the current card draft.</em></p>`
  const rows = m.attacks
    .map((a) => {
      const range = a.type === 'ranged' ? `${a.range ?? '?'}"` : '—'
      const tags = a.tags?.length ? a.tags.map((t) => linksHtml(base).kw(t.tag, tagLabel(t))).join(', ') : ''
      return `<tr><td><strong>${escapeHtml(a.name)}</strong></td><td>${a.type === 'ranged' ? 'Ranged' : 'Melee'}</td><td>${range}</td><td>${a.die}</td><td>${a.swings}</td><td>${bonus(a.bonus)}</td><td>${bonus(a.critBonus)}</td><td>${tags}</td></tr>`
    })
    .join('')
  const notes = m.attacks.filter((a) => a.notes).map((a) => `<li><strong>${escapeHtml(a.name)}:</strong> ${rh(a.notes, base, 4)}</li>`)
  return `<h2>Basic Attacks</h2>
<table class="statgrid"><thead><tr><th>Attack</th><th>Type</th><th>Range</th><th>Dice</th><th>Swings</th><th>Bonus</th><th>Crit</th><th>Keywords</th></tr></thead><tbody>${rows}</tbody></table>${notes.length ? `<ul class="notes">${notes.join('')}</ul>` : ''}`
}

function monsterAbilities(m, base) {
  if (!m.abilities.length) return ''
  const parts = m.abilities
    .map((ab) => {
      const reaction = ab.reaction ? ` <span class="badge reaction">reaction</span>` : ''
      return `<div class="ability"><h3>${escapeHtml(ab.name)}${reaction}</h3><div class="cost"><strong>Cost:</strong> ${escapeHtml(abilityCostText(ab.cost))}</div>${rh(ab.text, base, 4)}</div>`
    })
    .join('')
  return `<h2>Special Abilities</h2>${parts}`
}

function monsterGallery(m, base) {
  const img = monsterImage(m.id)
  if (!img?.gallery?.length || img.gallery.length < 2) return ''
  const items = img.gallery
    .map((g) => `<figure><a class="zoom" href="${base}${g.src}"><img loading="lazy" src="${base}${g.src}" alt="${escapeHtml(m.name)} ${g.angle}"></a><figcaption>${ANGLE_LABELS[g.angle] || ''}</figcaption></figure>`)
    .join('')
  return `<h2>Gallery</h2><div class="gallery">${items}</div>`
}

function monsterPage(m) {
  const base = '../'
  const ov = data.overviews[m.id]
  const lead = `<p class="lead"><strong>${escapeHtml(m.name)}</strong> is a ${SIZE_LABELS[m.size]} monster in the miniatures game <em>${GAME}</em>.</p>`
  const overview = ov?.overview ? rh(ov.overview, base, 3) : ''
  const role = ov?.role ? `<h2>Playstyle</h2>${rh(ov.role, base, 3)}` : ''
  let variants = ''
  if (data.images.variants[m.id]?.length) {
    const vs = data.images.variants[m.id]
      .map((v) => `<figure><a class="zoom" href="${base}${v.src}"><img loading="lazy" src="${base}${v.src}" alt="${escapeHtml(v.label)}"></a><figcaption>${escapeHtml(v.label)}</figcaption></figure>`)
      .join('')
    variants = `<h2>Sculpt variants</h2><p class="muted">Alternate sculpts of this monster.</p><div class="gallery">${vs}</div>`
  }
  const keywords = m.keywords.length
    ? `<h2>Keywords</h2><ul>${m.keywords.map((id) => { const k = keywordById.get(id); return `<li>${linksHtml(base).kw(id)}${k ? ` — ${rh(k.short, base, 4)}` : ''}</li>` }).join('')}</ul>`
    : ''
  const flavor = m.flavor ? `<blockquote class="flavor">${rh(m.flavor, base, 4)}</blockquote>` : ''
  const notes = m.unverified?.length
    ? `<div class="notice"><strong>Work in progress.</strong> Profile from card data v${data.meta.dataVersion}. Still being finalized:<ul>${m.unverified.map((u) => `<li>${escapeHtml(u)}</li>`).join('')}</ul></div>`
    : ''
  const cats = `<div class="cats">Categories: <span>Monsters</span> <span>${SIZE_LABELS[m.size]} monsters</span></div>`
  const content = `${monsterInfobox(m, base)}<h1>${escapeHtml(m.name)}</h1>${lead}${overview}${flavor}${role}${monsterAttacks(m, base)}${monsterAbilities(m, base)}${variants}${keywords}${monsterGallery(m, base)}${notes}${cats}`
  const crumb = `<div class="crumb"><a href="${base}index.html">Home</a> › <a href="${base}monsters/index.html">Monsters</a> › ${escapeHtml(m.name)}</div>`
  write(`monsters/${m.id}.html`, layout({ title: m.name, base, active: 'monsters', content, heroCrumb: crumb }))
}

// ------------------------------------------------------------ monsters index
function monstersIndex() {
  const base = '../'
  const cards = data.monsters
    .map((m) => {
      const img = monsterImage(m.id)
      const thumb = img ? `<img loading="lazy" src="${base}${img.primary}" alt="${escapeHtml(m.name)}">` : `<div class="noimg sm">📷</div>`
      return `<a class="mcard" href="${monsterUrl(m.id, base)}"><div class="mcard-img">${thumb}</div><div class="mcard-body"><div class="mcard-name">${escapeHtml(m.name)}</div><div class="mcard-meta">${SIZE_LABELS[m.size]} · ${m.partyPoints} PP · HP ${m.hp}</div></div></a>`
    })
    .join('')
  const content = `<h1>Monsters</h1><p class="lead">All ${data.monsters.length} monsters in <em>${GAME}</em> (card data v${data.meta.dataVersion}).</p><div class="mgrid">${cards}</div>`
  write('monsters/index.html', layout({ title: 'Monsters', base, active: 'monsters', content }))
}

// ----------------------------------------------------------------- rule pages
function rulePages() {
  const base = '../'
  for (const r of data.rules) {
    if (r.id === 'generic-abilities') continue // published as the dedicated generic-abilities.html
    const body = rh(r.body, base, 2)
    const idx = data.rules.findIndex((x) => x.id === r.id)
    const prev = data.rules[idx - 1]
    const next = data.rules[idx + 1]
    const pager = `<div class="pager">${prev ? `<a href="${ruleUrl(prev.id, base)}">← ${escapeHtml(prev.title)}</a>` : '<span></span>'}${next ? `<a href="${ruleUrl(next.id, base)}">${escapeHtml(next.title)} →</a>` : '<span></span>'}</div>`
    const crumb = `<div class="crumb"><a href="${base}index.html">Home</a> › <a href="${base}rules/index.html">Rules</a> › ${escapeHtml(r.title)}</div>`
    const content = `<h1>${escapeHtml(r.title)}</h1>${body}${pager}`
    write(`rules/${r.id}.html`, layout({ title: r.title, base, active: 'rules', content, heroCrumb: crumb }))
  }
  // index
  const toc = data.rules.map((r, i) => `<li><a href="${ruleUrl(r.id, base)}">${escapeHtml(r.title)}</a></li>`).join('')
  const content = `<h1>Core Rules</h1><p class="lead">The complete core rulebook of <em>${GAME}</em> (rules v${data.meta.rulesVersion}).</p><ol class="toc">${toc}</ol><p>See also: <a href="${base}generic-abilities.html">Generic Abilities</a>, <a href="${base}conditions.html">Tokens &amp; Conditions</a>, <a href="${base}glossary.html">Glossary</a>.</p>`
  write('rules/index.html', layout({ title: 'Rules', base, active: 'rules', content }))
}

// ------------------------------------------------------------------- glossary
function glossaryPage() {
  const base = ''
  const group = (cat, heading) => {
    const items = data.keywords
      .filter((k) => k.category === cat)
      .map((k) => {
        const see = k.ruleRef && ruleById.get(k.ruleRef) ? ` <span class="muted">(see ${linksHtml(base).rule(k.ruleRef)})</span>` : ''
        return `<div class="term" id="${k.id}"><dt>${escapeHtml(k.name)}${see}</dt><dd>${rh(k.short, base, 4)}</dd></div>`
      })
      .join('')
    return `<h2>${heading}</h2><dl>${items}</dl>`
  }
  const content = `<h1>Glossary</h1><p class="lead">Keywords and game terms used throughout <em>${GAME}</em>.</p>${group('keyword', 'Ability keywords')}${group('term', 'Game terms')}`
  write('glossary.html', layout({ title: 'Glossary', base, active: 'glossary', content }))
}

// ----------------------------------------------------------- generic abilities
function genericAbilitiesPage() {
  const base = ''
  const body = data.genericAbilities
    .map((ab) => `<div class="ability"><h2>${escapeHtml(ab.name)}${ab.reaction ? ' <span class="badge reaction">reaction</span>' : ''}</h2><div class="cost"><strong>Cost:</strong> ${escapeHtml(abilityCostText(ab.cost))}</div>${rh(ab.text, base, 3)}</div>`)
    .join('')
  const content = `<h1>Generic Abilities</h1><p class="lead">Abilities <strong>any monster</strong> can use (core rules: ${linksHtml(base).rule('generic-abilities')}).</p>${body}`
  write('generic-abilities.html', layout({ title: 'Generic Abilities', base, active: 'generic', content }))
}

// --------------------------------------------------------------- scenarios
function scenariosPage() {
  const base = ''
  const body = data.scenarios
    .map((s) => {
      const parts = [`<h2 id="${s.id}">${escapeHtml(s.name)}${s.recommendedPoints ? ` <span class="muted">(${s.recommendedPoints} PP)</span>` : ''}</h2>`, rh(s.summary, base, 3)]
      if (s.setup) parts.push(`<h3>Setup</h3>${rh(s.setup, base, 4)}`)
      parts.push(`<h3>How to win</h3>${rh(s.winCondition, base, 4)}`)
      if (s.specialRules?.length) parts.push(`<h3>Special rules</h3><ul>${s.specialRules.map((x) => `<li>${rh(x, base, 5)}</li>`).join('')}</ul>`)
      return `<div class="scenario">${parts.join('')}</div>`
    })
    .join('')
  const content = `<h1>Scenarios</h1><p class="lead">Ways to play <em>${GAME}</em>.</p>${body}`
  write('scenarios.html', layout({ title: 'Scenarios', base, active: 'scenarios', content }))
}

// ------------------------------------------------------------ conditions page
function conditionsPage() {
  const base = ''
  const body = data.conditions.map((c) => `<div class="ability"><h2>${escapeHtml(c.name)}</h2>${rh(c.short, base, 3)}</div>`).join('')
  const content = `<h1>Tokens &amp; Conditions</h1><p class="lead">Common tokens and temporary conditions.</p>${body}`
  write('conditions.html', layout({ title: 'Tokens & Conditions', base, active: 'conditions', content }))
}

// -------------------------------------------------------------------- about
function aboutPage() {
  const base = ''
  const content = `<h1>About this wiki</h1>
<p class="lead">A fan reference for <em>${GAME}</em> — an indie miniatures skirmish game.</p>
<p>This wiki is generated directly from the game's structured data (card data v${data.meta.dataVersion}, rules v${data.meta.rulesVersion}). Every monster, rule, and keyword page is built from the same source, so the numbers here match the cards.</p>
<h2>Photos</h2><p>Product photography follows a hero &gt; front &gt; placeholder rule. Monsters without photography yet show a "Photo coming soon" placeholder.</p>
<h2>Also available</h2><p>This same content is also exported as portable MediaWiki wikitext (with a one-click XML import dump) for uploading to a MediaWiki / Miraheze / Fandom wiki.</p>
<p class="muted">Fan-made and unofficial. ${GAME} is the work of its respective creator.</p>`
  write('about.html', layout({ title: 'About', base, active: 'about', content }))
}

// --------------------------------------------------------------- home page
function homePage() {
  const base = ''
  const hero = data.images.site['starter-group']
    ? `<img class="hero-img" src="${base}${data.images.site['starter-group'].src}" alt="Monster Friends lineup">`
    : ''
  const featured = data.monsters
    .filter((m) => monsterImage(m.id))
    .slice(0, 8)
    .map((m) => `<a class="fcard" href="${monsterUrl(m.id, base)}"><img loading="lazy" src="${base}${monsterImage(m.id).primary}" alt="${escapeHtml(m.name)}"><span>${escapeHtml(m.name)}</span></a>`)
    .join('')
  const intro = rh(ruleById.get('what-is-this-game').body.split('\n\n')[0], base, 3)
  const content = `<div class="home-hero">${hero}<div class="home-hero-text"><h1>Monster Friends Wiki</h1><p class="lead">The fan reference for <em>${GAME}</em> — the skirmish game where every monster is meant to feel broken, flavorful, and fun.</p></div></div>
${intro}
<div class="quicklinks">
  <a href="${base}monsters/index.html" class="ql"><span class="ql-ico">👹</span><span class="ql-t">Monsters</span><span class="ql-d">All ${data.monsters.length}, sortable</span></a>
  <a href="${base}rules/index.html" class="ql"><span class="ql-ico">📖</span><span class="ql-t">Rules</span><span class="ql-d">Full core rulebook</span></a>
  <a href="${base}glossary.html" class="ql"><span class="ql-ico">📑</span><span class="ql-t">Glossary</span><span class="ql-d">Keywords &amp; terms</span></a>
  <a href="${base}scenarios.html" class="ql"><span class="ql-ico">🎯</span><span class="ql-t">Scenarios</span><span class="ql-d">How to play</span></a>
</div>
<h2>Featured monsters</h2><div class="fgrid">${featured}</div>
<h2>New here?</h2><ol class="toc"><li><a href="${base}rules/what-is-this-game.html">What is this game?</a></li><li><a href="${base}rules/choosing-your-friends.html">Choosing your Friends</a></li><li><a href="${base}rules/setting-up-for-battle.html">Setting Up for Battle</a></li><li><a href="${base}scenarios.html">Fighting is Fun! (starter scenario)</a></li></ol>`
  write('index.html', layout({ title: 'Home', base, active: 'home', content }))
}

// ------------------------------------------------------------- search index
function searchIndex() {
  const idx = []
  for (const m of data.monsters)
    idx.push({ t: m.name, u: monsterUrl(m.id), k: 'Monster', s: `${SIZE_LABELS[m.size]} · ${attackSummary(m.attacks[0] || { type: 'melee', swings: 0, die: '', bonus: 0, critBonus: 0 })}` })
  for (const r of data.rules) {
    if (r.id === 'generic-abilities') continue // indexed via the Generic Abilities page below
    idx.push({ t: r.title, u: ruleUrl(r.id), k: 'Rule', s: r.body.replace(/[#*>\n]/g, ' ').slice(0, 90) })
  }
  for (const k of data.keywords) idx.push({ t: k.name, u: `glossary.html#${k.id}`, k: k.category === 'keyword' ? 'Keyword' : 'Term', s: k.short.slice(0, 90) })
  for (const s of data.scenarios) idx.push({ t: s.name, u: `scenarios.html#${s.id}`, k: 'Scenario', s: s.summary.slice(0, 90) })
  for (const a of data.genericAbilities) idx.push({ t: a.name, u: `generic-abilities.html`, k: 'Generic ability', s: a.text.slice(0, 90) })
  // Inlined as a JS global (not fetched) so search works from file:// — i.e. when
  // the site is shared as a folder/zip and opened directly, not just when hosted.
  writeFileSync(join(SITE, 'assets', 'search-index.js'), `window.SEARCH_INDEX=${JSON.stringify(idx)};`)
}

// --------------------------------------------------------------------- assets
const CSS = `:root{--purple:#3a2b4a;--purple2:#4a3a5e;--amber:#d98a1f;--amber-d:#b06f12;--bg:#faf7f2;--card:#fff;--ink:#23202a;--muted:#7a7480;--line:#e2dccf}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6}
a{color:var(--amber-d);text-decoration:none}a:hover{text-decoration:underline}
.topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:14px;background:var(--purple);color:#fff;padding:10px 16px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.brand{color:#fff;font-weight:800;font-size:1.2rem;letter-spacing:.3px}.brand span{color:var(--amber);font-weight:700}
.menu-btn{display:none;background:none;border:0;color:#fff;font-size:1.4rem;cursor:pointer}
.search{position:relative;margin-left:auto;width:min(360px,42vw)}
.search input{width:100%;padding:7px 12px;border-radius:20px;border:0;font-size:.95rem}
.search-results{position:absolute;top:42px;right:0;left:0;background:#fff;color:var(--ink);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);overflow:hidden;display:none;max-height:70vh;overflow-y:auto}
.search-results.open{display:block}
.search-results a{display:block;padding:8px 12px;border-bottom:1px solid var(--line);color:var(--ink)}
.search-results a:hover{background:#f3eee4;text-decoration:none}
.search-results .sr-k{font-size:.72rem;text-transform:uppercase;color:var(--amber-d);font-weight:700}
.search-results .sr-s{font-size:.82rem;color:var(--muted)}
.layout{display:flex;align-items:flex-start;max-width:1280px;margin:0 auto}
.sidebar{position:sticky;top:54px;flex:0 0 250px;height:calc(100vh - 54px);overflow-y:auto;padding:16px 8px;background:#fff;border-right:1px solid var(--line)}
.sidebar a{display:block;color:var(--ink);padding:5px 12px;border-radius:6px;font-size:.92rem}
.sidebar a:hover{background:#f3eee4;text-decoration:none}
.sidebar a.active{background:var(--purple);color:#fff;font-weight:600}
.nav-group{margin-bottom:6px}.nav-head a{font-weight:700}
.nav-sub{margin:2px 0 8px 8px;border-left:2px solid var(--line);padding-left:4px}
.nav-sub a{font-size:.84rem;color:var(--muted);padding:3px 10px}
.content{flex:1 1 auto;min-width:0;padding:24px 32px 80px;max-width:860px}
.content h1{font-size:2rem;margin:.2em 0 .5em;border-bottom:3px solid var(--amber);padding-bottom:.2em;color:var(--purple)}
.content h2{font-size:1.4rem;margin:1.4em 0 .4em;border-bottom:1px solid var(--line);padding-bottom:.15em;color:var(--purple2)}
.content h3{font-size:1.15rem;margin:1.1em 0 .3em}
.lead{font-size:1.08rem;color:#444}
.crumb{font-size:.85rem;color:var(--muted);margin-bottom:8px}
.muted{color:var(--muted)}
blockquote{margin:1em 0;padding:.6em 1em;border-left:4px solid var(--amber);background:#fbf3e3;border-radius:0 8px 8px 0}
blockquote.flavor{font-style:italic}
.infobox{float:right;width:300px;margin:0 0 18px 24px;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.ib-title{background:var(--purple);color:#fff;font-weight:700;font-size:1.2rem;text-align:center;padding:8px}
.ib-img{text-align:center;background:#f0ebe1}.ib-img img{max-width:100%;display:block;cursor:zoom-in}
.noimg{padding:48px 8px;text-align:center;color:var(--muted);font-size:1.5rem}.noimg.sm{padding:28px 8px;font-size:1.5rem}
.infobox table{width:100%;border-collapse:collapse;font-size:.9rem}
.infobox th{text-align:left;background:#f3eee4;padding:5px 10px;width:46%;vertical-align:top}
.infobox td{padding:5px 10px;border-top:1px solid var(--line)}
table.statgrid{border-collapse:collapse;width:100%;margin:.5em 0;font-size:.92rem}
table.statgrid th,table.statgrid td{border:1px solid var(--line);padding:6px 9px;text-align:left}
table.statgrid thead th{background:var(--purple);color:#fff}
table.statgrid tbody tr:nth-child(even){background:#f7f2e9}
.notes{font-size:.9rem;color:#555}
.ability{background:#fff;border:1px solid var(--line);border-left:4px solid var(--amber);border-radius:0 8px 8px 0;padding:10px 16px;margin:14px 0}
.ability h2,.ability h3{margin-top:.2em;border:0}
.cost{font-size:.9rem;color:#555;margin-bottom:6px}
.badge{font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;padding:2px 7px;border-radius:10px;vertical-align:middle}
.badge.reaction{background:#5a3a7a;color:#fff}
.kw{border-bottom:1px dotted var(--amber-d)}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin:.6em 0}
.gallery figure{margin:0;text-align:center}
.gallery img{width:100%;height:130px;object-fit:cover;border-radius:8px;border:1px solid var(--line);cursor:zoom-in;background:#f0ebe1}
.gallery figcaption{font-size:.78rem;color:var(--muted)}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-top:1em}
.mcard{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden;color:var(--ink);transition:transform .1s,box-shadow .1s}
.mcard:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,0,0,.12);text-decoration:none}
.mcard-img{height:170px;background:#f0ebe1;display:flex;align-items:center;justify-content:center}
.mcard-img img{width:100%;height:100%;object-fit:cover}
.mcard-body{padding:8px 12px}.mcard-name{font-weight:700;color:var(--purple)}.mcard-meta{font-size:.82rem;color:var(--muted)}
.home-hero{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:1em}
.hero-img{width:min(420px,100%);border-radius:12px}
.home-hero-text{flex:1 1 280px}.home-hero-text h1{border:0}
.quicklinks{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:1.2em 0}
.ql{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px;color:var(--ink)}
.ql:hover{text-decoration:none;border-color:var(--amber)}
.ql-ico{font-size:1.6rem}.ql-t{font-weight:700;color:var(--purple)}.ql-d{font-size:.82rem;color:var(--muted)}
.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
.fcard{position:relative;border-radius:10px;overflow:hidden;color:#fff}
.fcard img{width:100%;height:140px;object-fit:cover;display:block}
.fcard span{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.8));padding:18px 8px 6px;font-weight:600;font-size:.86rem}
.toc{line-height:1.9}.toc.toc li{margin:2px 0}
.notice{background:#fff7e6;border:1px solid var(--amber);border-radius:8px;padding:10px 14px;margin:1.2em 0;font-size:.92rem}
.cats{margin-top:2em;padding-top:.6em;border-top:1px solid var(--line);font-size:.85rem;color:var(--muted)}
.cats span{background:#efe8da;border-radius:10px;padding:2px 9px;margin:0 3px}
.pager{display:flex;justify-content:space-between;margin-top:2.4em;padding-top:1em;border-top:1px solid var(--line)}
dl{margin:0}.term{padding:8px 0;border-bottom:1px solid var(--line);scroll-margin-top:64px}
dt{font-weight:700;color:var(--purple2)}dd{margin:.2em 0 0}
.scenario{border:1px solid var(--line);border-radius:10px;padding:4px 18px 14px;margin:1em 0;background:#fff}
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;z-index:60;cursor:zoom-out;padding:20px}
.lightbox.open{display:flex}.lightbox img{max-width:96vw;max-height:94vh;border-radius:6px}
@media(max-width:860px){
  .menu-btn{display:block}
  .sidebar{position:fixed;left:0;top:54px;bottom:0;z-index:25;transform:translateX(-100%);transition:transform .2s;box-shadow:4px 0 20px rgba(0,0,0,.2)}
  .sidebar.open{transform:none}
  .content{padding:18px 16px 60px}
  .infobox{float:none;width:100%;margin:0 0 18px}
}`

const JS = `(function(){
var B=window.WIKI_BASE||'';
// mobile nav
var mb=document.getElementById('menuBtn'),sb=document.getElementById('sidebar');
if(mb)mb.addEventListener('click',function(){sb.classList.toggle('open')});
// lightbox
var lb=document.getElementById('lightbox'),li=document.getElementById('lightboxImg');
document.addEventListener('click',function(e){
  var a=e.target.closest('a.zoom');
  if(a){e.preventDefault();li.src=a.getAttribute('href');lb.classList.add('open');}
  else if(e.target===lb||e.target===li){lb.classList.remove('open');}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.classList.remove('open');});
// search (index is inlined via search-index.js, so this works from file:// too)
var inp=document.getElementById('searchInput'),res=document.getElementById('searchResults'),IDX=window.SEARCH_INDEX||[];
function esc(s){return s.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function run(){
  var q=inp.value.trim().toLowerCase();
  if(!q){res.classList.remove('open');res.innerHTML='';return}
  var hits=IDX.filter(function(e){return e.t.toLowerCase().indexOf(q)>=0||(e.s&&e.s.toLowerCase().indexOf(q)>=0)}).slice(0,12);
  res.innerHTML=hits.length?hits.map(function(e){return '<a href="'+B+e.u+'"><span class="sr-k">'+esc(e.k)+'</span><div>'+esc(e.t)+'</div><div class="sr-s">'+esc(e.s||'')+'</div></a>'}).join(''):'<a><div class="sr-s">No matches</div></a>';
  res.classList.add('open');
}
if(inp){inp.addEventListener('input',run);inp.addEventListener('focus',run);
  document.addEventListener('click',function(e){if(!e.target.closest('.search'))res.classList.remove('open')});}
})();`

// --------------------------------------------------------------------- run
export function generateSite() {
  rmSync(SITE, { recursive: true, force: true })
  mkdirSync(SITE, { recursive: true })
  // copy processed images
  const imgSrc = join(here, 'assets', 'images')
  if (existsSync(imgSrc)) cpSync(imgSrc, join(SITE, 'images'), { recursive: true })
  mkdirSync(join(SITE, 'assets'), { recursive: true })
  writeFileSync(join(SITE, 'assets', 'style.css'), CSS)
  writeFileSync(join(SITE, 'assets', 'app.js'), JS)

  homePage()
  monstersIndex()
  for (const m of data.monsters) monsterPage(m)
  rulePages()
  glossaryPage()
  genericAbilitiesPage()
  scenariosPage()
  conditionsPage()
  aboutPage()
  searchIndex()
  console.log(`site: ${data.monsters.length} monster pages + ${data.rules.length} rule pages → site/`)
}
