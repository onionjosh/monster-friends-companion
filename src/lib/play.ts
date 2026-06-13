import type { Monster } from './schemas'
import type { GameState, PartyEntry, SideState, UnitState } from './types'

export const MAX_ENERGY = 10

/** Hard cap on models per side so corrupt input can't freeze the tracker. */
export const MAX_UNITS_PER_SIDE = 500

/** Expand party entries into per-model unit states ("Gnorc Pillager #2"). */
export function buildSide(
  name: string,
  entries: PartyEntry[],
  monsterById: Map<string, Monster>,
): SideState {
  const units: UnitState[] = []
  // totals across ALL entries (duplicate entries for one monster must still
  // produce unique uids and continuous numbering)
  const totals = new Map<string, number>()
  for (const e of entries) {
    if (monsterById.has(e.monsterId)) {
      totals.set(e.monsterId, (totals.get(e.monsterId) ?? 0) + e.count)
    }
  }
  const counters = new Map<string, number>()
  for (const e of entries) {
    const m = monsterById.get(e.monsterId)
    if (!m) continue
    for (let i = 0; i < e.count && units.length < MAX_UNITS_PER_SIDE; i++) {
      const n = (counters.get(e.monsterId) ?? 0) + 1
      counters.set(e.monsterId, n)
      units.push({
        uid: `${e.monsterId}-${n}`,
        monsterId: e.monsterId,
        label: (totals.get(e.monsterId) ?? 1) > 1 ? `${m.name} #${n}` : m.name,
        hp: m.hp,
        act: m.act,
        conditions: [],
        dead: false,
      })
    }
  }
  return { name, energy: MAX_ENERGY, units }
}

export function createGame(
  mine: SideState,
  theirs: SideState,
  scenarioId: string | null,
  startedAt: number,
): GameState {
  return { startedAt, round: 1, scenarioId, mine, theirs }
}

/** Conditions that expire when a new Round begins. */
const ROUND_SCOPED_CONDITIONS = new Set(['guarding', 'rested'])

function refreshSide(side: SideState, monsterById: Map<string, Monster>): SideState {
  return {
    ...side,
    energy: MAX_ENERGY,
    units: side.units.map((u) => {
      if (u.dead) return u
      const m = monsterById.get(u.monsterId)
      return {
        ...u,
        act: m?.act ?? u.act,
        conditions: u.conditions.filter((c) => !ROUND_SCOPED_CONDITIONS.has(c)),
      }
    }),
  }
}

/**
 * Start the next Round: every living monster refills to its AcT stat,
 * both players refill to 10 Energy, and round-scoped conditions clear.
 */
export function nextRound(game: GameState, monsterById: Map<string, Monster>): GameState {
  return {
    ...game,
    round: game.round + 1,
    mine: refreshSide(game.mine, monsterById),
    theirs: refreshSide(game.theirs, monsterById),
  }
}

export function adjustUnit(
  side: SideState,
  uid: string,
  patch: (u: UnitState) => UnitState,
): SideState {
  return { ...side, units: side.units.map((u) => (u.uid === uid ? patch(u) : u)) }
}

export function clampHp(hp: number, max: number): number {
  return Math.max(0, Math.min(max, hp))
}

/** "Fighting is Fun" win check: a side with no living monsters loses. */
export function sideDefeated(side: SideState): boolean {
  return side.units.length > 0 && side.units.every((u) => u.dead)
}
