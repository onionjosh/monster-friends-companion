/**
 * Loads all Monster Friends game data straight from data/ (the same source of
 * truth the companion app builds from) and exposes lookup maps, formatting
 * helpers, and page-title / URL resolvers used by both generators.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(here, '..', '..')
const dataDir = join(ROOT, 'data')

const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'))

// monsters/*.json
const monsters = readdirSync(join(dataDir, 'monsters'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => readJson(join(dataDir, 'monsters', f)))
  .sort((a, b) => a.name.localeCompare(b.name))

const keywords = readJson(join(dataDir, 'keywords.json'))
const conditions = readJson(join(dataDir, 'conditions.json'))
const scenarios = readJson(join(dataDir, 'scenarios.json'))
const genericAbilities = readJson(join(dataDir, 'generic-abilities.json'))
const meta = readJson(join(dataDir, 'meta.json'))

// rules/*.md with --- id/title/order --- frontmatter
const rules = readdirSync(join(dataDir, 'rules'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const text = readFileSync(join(dataDir, 'rules', f), 'utf-8').replace(/\r\n/g, '\n')
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    const fm = {}
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) fm[kv[1]] = kv[2].trim()
    }
    return { id: fm.id, title: fm.title, order: Number(fm.order), body: m[2].trim() }
  })
  .sort((a, b) => a.order - b.order)

// optional grounded prose (authored separately), keyed by monster id
let overviews = {}
const ovPath = join(here, '..', 'content', 'overviews.json')
if (existsSync(ovPath)) {
  try {
    overviews = readJson(ovPath)
  } catch {
    overviews = {}
  }
}

// image manifest (from process-images.mjs)
let images = { monsters: {}, variants: {}, site: {}, starterGallery: [], merch: [] }
const imgPath = join(here, '..', 'assets', 'images', 'manifest.json')
if (existsSync(imgPath)) images = readJson(imgPath)

export const data = { monsters, keywords, conditions, scenarios, genericAbilities, rules, meta, overviews, images }

// --- lookup maps -------------------------------------------------------------
export const monsterById = new Map(monsters.map((m) => [m.id, m]))
export const keywordById = new Map(keywords.map((k) => [k.id, k]))
export const ruleById = new Map(rules.map((r) => [r.id, r]))
export const conditionById = new Map(conditions.map((c) => [c.id, c]))

// --- formatting helpers ------------------------------------------------------
export const SIZE_LABELS = { S: 'Small', M: 'Medium', L: 'Large' }
export const BASE_SIZES = { S: '28mm', M: '40mm', L: '60mm' }

export const bonus = (n) => (n >= 0 ? `+${n}` : `${n}`)
export const emiText = (n) => `${n}+`
export const moveText = (m) => (m > 0 ? `${m}"` : '—')

export function defenseText(d) {
  return `${d.die}, Bonus ${bonus(d.bonus)}, Crit ${bonus(d.critBonus)}`
}

export function abilityCostText(cost) {
  if (cost.text) return cost.text
  const parts = []
  if (cost.energy > 0) parts.push(`${cost.energy} Energy`)
  if (cost.act > 0) parts.push(`${cost.act} Action Token${cost.act === 1 ? '' : 's'}`)
  return parts.length ? parts.join(' + ') : 'Free'
}

/** Human label for an attack tag, e.g. {tag:'reposition',value:3} -> "Reposition (3\")". */
export function tagLabel(t) {
  const kw = keywordById.get(t.tag)
  const name = kw ? kw.name : t.tag
  return t.value !== undefined ? `${name} (${t.value}")` : name
}

export function attackSummary(a) {
  const bits = [
    a.type === 'ranged' ? `Ranged ${a.range ?? '?'}"` : 'Melee',
    `${a.swings} swing${a.swings === 1 ? '' : 's'}`,
    a.die,
    `Bonus ${bonus(a.bonus)}`,
    `Crit ${bonus(a.critBonus)}`,
  ]
  return bits.join(' · ')
}

// --- page titles (MediaWiki) -------------------------------------------------
export const monsterTitle = (m) => m.name
export const keywordTitle = (k) => k.name
export const ruleTitle = (r) => r.title
export const scenarioTitle = (s) => s.name

export const keywordTitleById = (id) => {
  const k = keywordById.get(id)
  return k ? k.name : id
}
export const ruleTitleById = (id) => {
  const r = ruleById.get(id)
  return r ? r.title : id
}

// --- static-site URLs (relative; `base` is "" at root, "../" one level deep) -
export const monsterUrl = (id, base = '') => `${base}monsters/${id}.html`
// The generic-abilities rule section is published as the richer data-driven
// "Generic Abilities" page, not a plain rule page — keep links pointing there.
export const ruleUrl = (id, base = '') =>
  id === 'generic-abilities' ? `${base}generic-abilities.html` : `${base}rules/${id}.html`
export const keywordUrl = (id, base = '') => `${base}glossary.html#${id}`
export const scenarioUrl = (id, base = '') => `${base}scenarios.html#${id}`

/** Resolve a monster's primary image + gallery from the manifest (or null). */
export function monsterImage(id) {
  return data.images.monsters[id] || null
}
