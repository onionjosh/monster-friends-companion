import { describe, expect, it } from 'vitest'
import { GameDataSchema } from '../src/lib/schemas'
import raw from '../src/data/generated/gamedata.json'

describe('generated game data', () => {
  const data = GameDataSchema.parse(raw)

  it('contains the full v1.4 roster', () => {
    expect(data.monsters.length).toBeGreaterThanOrEqual(19)
    const names = data.monsters.map((m) => m.name)
    expect(names).toContain('Bucket Troll')
    expect(names).toContain('Gnorc Pillager')
    expect(names).toContain('Schnoz')
    expect(names).toContain('Mimic')
    expect(names).toContain('Walrus Champion')
    expect(names).toContain('Doctor Speeding Ticket')
  })

  it('allows immobile monsters (Mimic) but every monster still has positive HP', () => {
    const mimic = data.monsters.find((m) => m.name === 'Mimic')
    expect(mimic?.movement).toBe(0)
    for (const m of data.monsters) expect(m.hp, m.name).toBeGreaterThan(0)
  })

  it('every monster keyword resolves', () => {
    const kw = new Set(data.keywords.map((k) => k.id))
    for (const m of data.monsters) {
      for (const k of m.keywords) expect(kw, `${m.id} keyword ${k}`).toContain(k)
      for (const a of m.attacks) for (const t of a.tags) expect(kw, `${m.id} tag ${t.tag}`).toContain(t.tag)
    }
  })

  it('every keyword ruleRef resolves to a rules section', () => {
    const sections = new Set(data.rules.map((r) => r.id))
    for (const k of data.keywords) {
      if (k.ruleRef) expect(sections, `keyword ${k.id} -> ${k.ruleRef}`).toContain(k.ruleRef)
    }
  })

  it('rules sections are ordered and non-empty', () => {
    const orders = data.rules.map((r) => r.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    for (const r of data.rules) expect(r.body.length).toBeGreaterThan(50)
  })
})
