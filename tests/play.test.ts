import { describe, expect, it } from 'vitest'
import { buildSide, createGame, nextRound, restartGame, clampHp, sideDefeated, MAX_ENERGY } from '../src/lib/play'
import type { Monster } from '../src/lib/schemas'

function fakeMonster(id: string, overrides: Partial<Monster> = {}): Monster {
  return {
    id,
    name: id,
    size: 'S',
    partyPoints: 10,
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
    ...overrides,
  }
}

const byId = new Map([
  ['gnorc', fakeMonster('gnorc', { act: 2, hp: 6 })],
  ['troll', fakeMonster('troll', { act: 3, hp: 18 })],
])

describe('buildSide', () => {
  it('expands counts into numbered units at full HP/AcT', () => {
    const side = buildSide('Me', [{ monsterId: 'gnorc', count: 3 }, { monsterId: 'troll', count: 1 }], byId)
    expect(side.units).toHaveLength(4)
    expect(side.units[0].label).toBe('gnorc #1')
    expect(side.units[2].label).toBe('gnorc #3')
    expect(side.units[3].label).toBe('troll')
    expect(side.units[0].hp).toBe(6)
    expect(side.units[0].act).toBe(2)
    expect(side.energy).toBe(MAX_ENERGY)
  })

  it('skips unknown monsters rather than crashing', () => {
    const side = buildSide('Me', [{ monsterId: 'ghost', count: 2 }], byId)
    expect(side.units).toHaveLength(0)
  })

  it('keeps uids unique even when one monster appears in multiple entries', () => {
    const side = buildSide(
      'Me',
      [
        { monsterId: 'gnorc', count: 1 },
        { monsterId: 'gnorc', count: 1 },
      ],
      byId,
    )
    expect(side.units.map((u) => u.uid)).toEqual(['gnorc-1', 'gnorc-2'])
    expect(side.units.map((u) => u.label)).toEqual(['gnorc #1', 'gnorc #2'])
  })

  it('caps units so corrupt input cannot freeze the tracker', () => {
    const side = buildSide('Me', [{ monsterId: 'gnorc', count: 100000 }], byId)
    expect(side.units.length).toBeLessThanOrEqual(500)
  })
})

describe('nextRound', () => {
  it('refills AcT to stat, energy to 10, clears round-scoped conditions, keeps the dead dead', () => {
    const mine = buildSide('Me', [{ monsterId: 'gnorc', count: 2 }], byId)
    const theirs = buildSide('Them', [{ monsterId: 'troll', count: 1 }], byId)
    let game = createGame(mine, theirs, 'fighting-is-fun', 0)

    game = {
      ...game,
      mine: {
        ...game.mine,
        energy: 2,
        units: [
          { ...game.mine.units[0], act: 0, conditions: ['guarding', 'last-life'], hp: 3 },
          { ...game.mine.units[1], dead: true, hp: 0, act: 0 },
        ],
      },
    }

    const next = nextRound(game, byId)
    expect(next.round).toBe(2)
    expect(next.mine.energy).toBe(10)
    expect(next.theirs.energy).toBe(10)
    expect(next.mine.units[0].act).toBe(2)
    expect(next.mine.units[0].conditions).toEqual(['last-life'])
    expect(next.mine.units[0].hp).toBe(3)
    expect(next.mine.units[1].dead).toBe(true)
    expect(next.mine.units[1].act).toBe(0)
  })
})

describe('restartGame (New Game)', () => {
  it('resets HP & AcT to max, revives the dead, clears all conditions and refills energy', () => {
    const mine = buildSide('Me', [{ monsterId: 'gnorc', count: 2 }], byId)
    const theirs = buildSide('Them', [{ monsterId: 'troll', count: 1 }], byId)
    let game = createGame(mine, theirs, 'fighting-is-fun', 0)
    game = nextRound(game, byId) // round 2

    game = {
      ...game,
      mine: {
        ...game.mine,
        energy: 1,
        units: [
          { ...game.mine.units[0], act: 0, hp: 1, conditions: ['guarding', 'last-life'] },
          { ...game.mine.units[1], dead: true, hp: 0, act: 0 },
        ],
      },
    }

    const fresh = restartGame(game, byId)
    expect(fresh.round).toBe(1)
    expect(fresh.mine.energy).toBe(10)
    expect(fresh.theirs.energy).toBe(10)
    // gnorc max hp 6 / act 2 (from byId)
    expect(fresh.mine.units[0].hp).toBe(6)
    expect(fresh.mine.units[0].act).toBe(2)
    expect(fresh.mine.units[0].conditions).toEqual([])
    expect(fresh.mine.units[0].dead).toBe(false)
    // the KO'd unit comes back alive at full HP
    expect(fresh.mine.units[1].dead).toBe(false)
    expect(fresh.mine.units[1].hp).toBe(6)
    expect(fresh.mine.units[1].act).toBe(2)
  })
})

describe('clampHp', () => {
  it('clamps to [0, max]', () => {
    expect(clampHp(-3, 10)).toBe(0)
    expect(clampHp(12, 10)).toBe(10)
    expect(clampHp(5, 10)).toBe(5)
  })
})

describe('sideDefeated', () => {
  it('is true only when every unit is dead', () => {
    const side = buildSide('Me', [{ monsterId: 'gnorc', count: 2 }], byId)
    expect(sideDefeated(side)).toBe(false)
    expect(sideDefeated({ ...side, units: side.units.map((u) => ({ ...u, dead: true })) })).toBe(true)
  })

  it('is false for an empty side (no auto-loss before deployment)', () => {
    expect(sideDefeated({ name: 'x', energy: 10, units: [] })).toBe(false)
  })
})
