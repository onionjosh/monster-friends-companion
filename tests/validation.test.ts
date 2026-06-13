import { describe, expect, it } from 'vitest'
import { checkParty } from '../src/lib/validation'
import type { Monster } from '../src/lib/schemas'

function fakeMonster(id: string, pp: number): Monster {
  return {
    id,
    name: id,
    size: 'S',
    partyPoints: pp,
    act: 3,
    movement: 6,
    emi: 7,
    hp: 10,
    defense: { die: 'd6', bonus: 0, critBonus: 2 },
    attacks: [{ name: 'Bonk', type: 'melee', die: 'd6', swings: 1, bonus: 0, critBonus: 2, tags: [] }],
    keywords: [],
    bondedWith: null,
    abilities: [],
    unverified: [],
  }
}

const byId = new Map([
  ['a', fakeMonster('a', 10)],
  ['b', fakeMonster('b', 18)],
])

describe('checkParty', () => {
  it('totals points and counts models', () => {
    const res = checkParty(
      [
        { monsterId: 'a', count: 3 },
        { monsterId: 'b', count: 1 },
      ],
      50,
      byId,
    )
    expect(res.totalPoints).toBe(48)
    expect(res.modelCount).toBe(4)
    expect(res.flags).toHaveLength(0)
  })

  it('flags over-budget with the exact overage, but never blocks', () => {
    const res = checkParty([{ monsterId: 'b', count: 3 }], 50, byId)
    expect(res.totalPoints).toBe(54)
    expect(res.flags.some((f) => f.level === 'warn' && f.message.includes('4 Party Points over'))).toBe(true)
  })

  it('flags unknown monsters gracefully', () => {
    const res = checkParty([{ monsterId: 'ghost', count: 1 }], 50, byId)
    expect(res.totalPoints).toBe(0)
    expect(res.flags.some((f) => f.message.includes('ghost'))).toBe(true)
  })

  it('flags empty parties as info', () => {
    const res = checkParty([], 50, byId)
    expect(res.flags.some((f) => f.level === 'info')).toBe(true)
  })

  it('flags stale data versions', () => {
    const res = checkParty([{ monsterId: 'a', count: 1 }], 50, byId, '1.0', '1.1')
    expect(res.flags.some((f) => f.message.includes('v1.0'))).toBe(true)
  })
})
