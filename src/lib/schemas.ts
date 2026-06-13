import { z } from 'zod'

/** Dice used by attacks/defense in Monster Friends. */
export const DieSchema = z.enum(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'])
export type Die = z.infer<typeof DieSchema>

/** Structured attack tag, e.g. { tag: "reposition", value: 3 } -> Reposition (3"). */
export const AttackTagSchema = z.object({
  tag: z.string().regex(/^[a-z0-9-]+$/),
  value: z.number().optional(),
})
export type AttackTag = z.infer<typeof AttackTagSchema>

export const AttackSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['melee', 'ranged']),
  /** Range in inches; ranged attacks only. */
  range: z.number().positive().optional(),
  die: DieSchema,
  swings: z.number().int().positive(),
  bonus: z.number().int(),
  critBonus: z.number().int(),
  tags: z.array(AttackTagSchema).default([]),
  notes: z.string().optional(),
})
export type Attack = z.infer<typeof AttackSchema>

/** Ability cost: Energy (shared team pool) and/or action tokens. */
export const AbilityCostSchema = z.object({
  energy: z.number().int().min(0).default(0),
  act: z.number().int().min(0).default(0),
  /** Free-text override for unusual costs. */
  text: z.string().optional(),
})
export type AbilityCost = z.infer<typeof AbilityCostSchema>

export const AbilitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  cost: AbilityCostSchema,
  /** Reactions can be used outside the monster's own activation. */
  reaction: z.boolean().default(false),
  /** Rich text; may contain [[kw:id]] / [[rule:id|label]] links. */
  text: z.string().min(1),
})
export type Ability = z.infer<typeof AbilitySchema>

export const SizeSchema = z.enum(['S', 'M', 'L'])
export type Size = z.infer<typeof SizeSchema>

export const MonsterSchema = z.object({
  /** Permanent slug; never reused even if the monster is removed. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  size: SizeSchema,
  partyPoints: z.number().int().positive(),
  /** Action tokens. */
  act: z.number().int().positive(),
  /** Movement in inches; 0 = cannot move (e.g. Mimic). */
  movement: z.number().min(0),
  /** Emotional Instability target; rendered "7+" (2d6 test). */
  emi: z.number().int(),
  hp: z.number().int().positive(),
  defense: z.object({
    die: DieSchema,
    bonus: z.number().int(),
    critBonus: z.number().int(),
  }),
  /** May be empty for not-yet-finished monsters in the source sheet. */
  attacks: z.array(AttackSchema),
  /** Keyword ids; must exist in keywords.json. */
  keywords: z.array(z.string()).default([]),
  /** Monster id this one is Bonded with, if any. */
  bondedWith: z.string().nullable().default(null),
  abilities: z.array(AbilitySchema).default([]),
  flavor: z.string().optional(),
  /** Filename under public/monsters/, if present. */
  image: z.string().optional(),
  /** Field names whose values still need confirmation against source data. */
  unverified: z.array(z.string()).default([]),
})
export type Monster = z.infer<typeof MonsterSchema>

export const KeywordSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** Short popup definition. */
  short: z.string().min(1),
  /** Optional rulebook deep-link: a rules section id. */
  ruleRef: z.string().optional(),
  /** "keyword" = printed ability keyword; "term" = general glossary term. */
  category: z.enum(['keyword', 'term']).default('keyword'),
})
export type Keyword = z.infer<typeof KeywordSchema>

export const ConditionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  short: z.string().min(1),
})
export type Condition = z.infer<typeof ConditionSchema>

export const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  setup: z.string().optional(),
  winCondition: z.string().min(1),
  specialRules: z.array(z.string()).default([]),
  recommendedPoints: z.number().int().positive().optional(),
})
export type Scenario = z.infer<typeof ScenarioSchema>

export const RuleSectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  order: z.number(),
  /** Markdown-ish body with [[kw:]] / [[rule:]] links. */
  body: z.string().min(1),
})
export type RuleSection = z.infer<typeof RuleSectionSchema>

export const GameDataSchema = z.object({
  schemaVersion: z.literal(1),
  /** Matches the printed card pack version. */
  dataVersion: z.string(),
  /** Matches the printed rulebook version. */
  rulesVersion: z.string(),
  monsters: z.array(MonsterSchema),
  keywords: z.array(KeywordSchema),
  conditions: z.array(ConditionSchema),
  scenarios: z.array(ScenarioSchema),
  rules: z.array(RuleSectionSchema),
  /** Abilities usable by any monster (rules p.15). */
  genericAbilities: z.array(AbilitySchema),
})
export type GameData = z.infer<typeof GameDataSchema>
