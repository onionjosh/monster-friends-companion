/**
 * Build pipeline: validates everything under data/ and emits
 * src/data/generated/gamedata.json for the app to import.
 *
 * Fails loudly with plain-language errors so a typo in hand-edited
 * data never reaches the app as a blank screen.
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  MonsterSchema,
  KeywordSchema,
  ConditionSchema,
  ScenarioSchema,
  AbilitySchema,
  GameDataSchema,
  type GameData,
  type RuleSection,
} from '../src/lib/schemas'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'data')
const outDir = join(root, 'src', 'data', 'generated')

const errors: string[] = []

function fail(msg: string) {
  errors.push(msg)
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch (e) {
    fail(`${path}: not valid JSON — ${(e as Error).message}`)
    return null
  }
}

function parseArray<T>(
  path: string,
  raw: unknown,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { path: PropertyKey[]; message: string }[] } } },
): T[] {
  if (raw === null) return []
  if (!Array.isArray(raw)) {
    fail(`${path}: expected a JSON array`)
    return []
  }
  const out: T[] = []
  raw.forEach((item, i) => {
    const res = schema.safeParse(item)
    if (res.success) {
      out.push(res.data as T)
    } else {
      for (const issue of res.error!.issues) {
        fail(`${path} [item ${i}] ${issue.path.join('.')}: ${issue.message}`)
      }
    }
  })
  return out
}

// ---- monsters/ ----
const monsterDir = join(dataDir, 'monsters')
const monsters = readdirSync(monsterDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .flatMap((f) => {
    const path = join(monsterDir, f)
    const raw = readJson(path)
    if (raw === null) return []
    const res = MonsterSchema.safeParse(raw)
    if (!res.success) {
      for (const issue of res.error.issues) {
        fail(`${path} ${issue.path.join('.')}: ${issue.message}`)
      }
      return []
    }
    if (`${res.data.id}.json` !== f) {
      fail(`${path}: file name must match the monster id ("${res.data.id}.json")`)
    }
    return [res.data]
  })

// ---- flat files ----
const keywords = parseArray(join(dataDir, 'keywords.json'), readJson(join(dataDir, 'keywords.json')), KeywordSchema)
const conditions = parseArray(join(dataDir, 'conditions.json'), readJson(join(dataDir, 'conditions.json')), ConditionSchema)
const scenarios = parseArray(join(dataDir, 'scenarios.json'), readJson(join(dataDir, 'scenarios.json')), ScenarioSchema)
const genericAbilities = parseArray(
  join(dataDir, 'generic-abilities.json'),
  readJson(join(dataDir, 'generic-abilities.json')),
  AbilitySchema,
)

// ---- rules/*.md (frontmatter: id, title, order) ----
const rulesDir = join(dataDir, 'rules')
const rules: RuleSection[] = readdirSync(rulesDir)
  .filter((f) => f.endsWith('.md'))
  .sort()
  .flatMap((f) => {
    const path = join(rulesDir, f)
    const text = readFileSync(path, 'utf-8').replace(/\r\n/g, '\n')
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!m) {
      fail(`${path}: missing frontmatter block (--- id/title/order ---)`)
      return []
    }
    const fm: Record<string, string> = {}
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) fm[kv[1]] = kv[2].trim()
    }
    if (!fm.id || !fm.title || !fm.order) {
      fail(`${path}: frontmatter needs id, title and order`)
      return []
    }
    const order = Number(fm.order)
    if (!Number.isFinite(order)) {
      fail(`${path}: frontmatter order must be a number (got "${fm.order}")`)
      return []
    }
    return [{ id: fm.id, title: fm.title, order, body: m[2].trim() }]
  })

// ---- versions (accept "1.1" or 1.1 — authors shouldn't have to care) ----
const MetaSchema = z.object({
  dataVersion: z.union([z.string(), z.number()]).transform(String),
  rulesVersion: z.union([z.string(), z.number()]).transform(String),
})
const metaRaw = readJson(join(dataDir, 'meta.json'))
const metaParsed = MetaSchema.safeParse(metaRaw)
const meta = metaParsed.success ? metaParsed.data : null
if (!metaParsed.success) {
  fail(`${join(dataDir, 'meta.json')}: must define dataVersion and rulesVersion (string or number)`)
}

// ---- cross-reference checks ----
function checkUnique(kind: string, ids: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) fail(`duplicate ${kind} id "${id}"`)
    seen.add(id)
  }
}
checkUnique('monster', monsters.map((m) => m.id))
checkUnique('keyword', keywords.map((k) => k.id))
checkUnique('condition', conditions.map((c) => c.id))
checkUnique('scenario', scenarios.map((s) => s.id))
checkUnique('rule section', rules.map((r) => r.id))
checkUnique('generic ability', genericAbilities.map((a) => a.id))

const keywordIds = new Set(keywords.map((k) => k.id))
const ruleIds = new Set(rules.map((r) => r.id))
const monsterIds = new Set(monsters.map((m) => m.id))

for (const m of monsters) {
  for (const kw of m.keywords) {
    if (!keywordIds.has(kw)) fail(`monster "${m.id}": unknown keyword "${kw}" (add it to data/keywords.json)`)
  }
  for (const a of m.attacks) {
    for (const t of a.tags) {
      if (!keywordIds.has(t.tag)) {
        fail(`monster "${m.id}" attack "${a.name}": unknown tag "${t.tag}" (tags must be keyword ids)`)
      }
    }
  }
  if (m.bondedWith && !monsterIds.has(m.bondedWith)) {
    fail(`monster "${m.id}": bondedWith points to unknown monster "${m.bondedWith}"`)
  }
}
for (const k of keywords) {
  if (k.ruleRef && !ruleIds.has(k.ruleRef)) {
    fail(`keyword "${k.id}": ruleRef points to unknown rules section "${k.ruleRef}"`)
  }
}

// [[kw:id]] and [[rule:id|label]] link integrity in all rich text
const linkRe = /\[\[(kw|rule):([a-z0-9-]+)(?:\|[^\]]*)?\]\]/g
function checkLinks(owner: string, text: string) {
  for (const match of text.matchAll(linkRe)) {
    const [, type, id] = match
    if (type === 'kw' && !keywordIds.has(id)) fail(`${owner}: link to unknown keyword "${id}"`)
    if (type === 'rule' && !ruleIds.has(id)) fail(`${owner}: link to unknown rules section "${id}"`)
  }
}
for (const r of rules) checkLinks(`rules section "${r.id}"`, r.body)
for (const m of monsters) {
  for (const a of m.abilities) {
    checkLinks(`monster "${m.id}" ability "${a.id}"`, a.text)
    if (a.cost.text) checkLinks(`monster "${m.id}" ability "${a.id}" cost`, a.cost.text)
  }
  for (const a of m.attacks) if (a.notes) checkLinks(`monster "${m.id}" attack "${a.name}" notes`, a.notes)
  if (m.flavor) checkLinks(`monster "${m.id}" flavor`, m.flavor)
}
for (const a of genericAbilities) {
  checkLinks(`generic ability "${a.id}"`, a.text)
  if (a.cost.text) checkLinks(`generic ability "${a.id}" cost`, a.cost.text)
}
for (const s of scenarios) checkLinks(`scenario "${s.id}"`, [s.summary, s.setup ?? '', s.winCondition, ...s.specialRules].join('\n'))
for (const k of keywords) checkLinks(`keyword "${k.id}"`, k.short)
for (const c of conditions) checkLinks(`condition "${c.id}"`, c.short)

const assembled = GameDataSchema.safeParse({
  schemaVersion: 1,
  dataVersion: meta?.dataVersion ?? '0',
  rulesVersion: meta?.rulesVersion ?? '0',
  monsters: monsters.sort((a, b) => a.name.localeCompare(b.name)),
  keywords: keywords.sort((a, b) => a.name.localeCompare(b.name)),
  conditions,
  scenarios,
  rules: rules.sort((a, b) => a.order - b.order),
  genericAbilities,
})
if (!assembled.success) {
  for (const issue of assembled.error.issues) {
    fail(`assembled game data ${issue.path.join('.')}: ${issue.message}`)
  }
}

if (errors.length > 0) {
  console.error(`\nGame data has ${errors.length} problem(s):\n`)
  for (const e of errors) console.error(`  • ${e}`)
  console.error()
  process.exit(1)
}

const gameData: GameData = assembled.data!

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'gamedata.json'), JSON.stringify(gameData, null, 1))
console.log(
  `OK: ${gameData.monsters.length} monsters, ${gameData.keywords.length} keywords, ` +
    `${gameData.scenarios.length} scenarios, ${gameData.rules.length} rules sections, ` +
    `${gameData.genericAbilities.length} generic abilities → src/data/generated/gamedata.json`,
)
