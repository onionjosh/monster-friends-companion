import type { GameData, Monster, Keyword, Condition, Scenario, RuleSection, Ability } from '../lib/schemas'
import raw from './generated/gamedata.json'

export const gameData = raw as GameData

export const monsters: Monster[] = gameData.monsters
export const keywords: Keyword[] = gameData.keywords
export const conditions: Condition[] = gameData.conditions
export const scenarios: Scenario[] = gameData.scenarios
export const ruleSections: RuleSection[] = gameData.rules
export const genericAbilities: Ability[] = gameData.genericAbilities

export const monsterById = new Map(monsters.map((m) => [m.id, m]))
export const keywordById = new Map(keywords.map((k) => [k.id, k]))
export const conditionById = new Map(conditions.map((c) => [c.id, c]))
export const scenarioById = new Map(scenarios.map((s) => [s.id, s]))
export const ruleSectionById = new Map(ruleSections.map((r) => [r.id, r]))

export const SIZE_LABELS: Record<Monster['size'], string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
}

export const BASE_SIZES: Record<Monster['size'], string> = {
  S: '28mm',
  M: '40mm',
  L: '60mm',
}

/** Case-insensitive search across names, attack names, ability names/text, and keywords. */
export function searchMonsters(query: string): Monster[] {
  const q = query.trim().toLowerCase()
  if (!q) return monsters
  return monsters.filter((m) => {
    if (m.name.toLowerCase().includes(q)) return true
    if (m.attacks.some((a) => a.name.toLowerCase().includes(q))) return true
    if (m.abilities.some((a) => a.name.toLowerCase().includes(q) || a.text.toLowerCase().includes(q))) return true
    if (m.keywords.some((k) => keywordById.get(k)?.name.toLowerCase().includes(q))) return true
    return false
  })
}
