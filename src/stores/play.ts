import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, PartyEntry, UnitState } from '../lib/types'
import { buildSide, createGame, nextRound, adjustUnit, MAX_ENERGY } from '../lib/play'
import { monsterById } from '../data'

export type Side = 'mine' | 'theirs'

interface PlayState {
  game: GameState | null
  startGame: (
    mine: { name: string; entries: PartyEntry[] },
    theirs: { name: string; entries: PartyEntry[] },
    scenarioId: string | null,
  ) => void
  endGame: () => void
  advanceRound: () => void
  setEnergy: (side: Side, value: number) => void
  adjustHp: (side: Side, uid: string, delta: number) => void
  adjustAct: (side: Side, uid: string, delta: number) => void
  toggleCondition: (side: Side, uid: string, conditionId: string) => void
  toggleDead: (side: Side, uid: string) => void
}

function patchUnit(
  game: GameState,
  side: Side,
  uid: string,
  patch: (u: UnitState) => UnitState,
): GameState {
  return { ...game, [side]: adjustUnit(game[side], uid, patch) }
}

export const usePlayStore = create<PlayState>()(
  persist(
    (set) => ({
      game: null,

      startGame: (mine, theirs, scenarioId) =>
        set({
          game: createGame(
            buildSide(mine.name, mine.entries, monsterById),
            buildSide(theirs.name, theirs.entries, monsterById),
            scenarioId,
            Date.now(),
          ),
        }),

      endGame: () => set({ game: null }),

      advanceRound: () =>
        set((s) => (s.game ? { game: nextRound(s.game, monsterById) } : s)),

      setEnergy: (side, value) =>
        set((s) =>
          s.game
            ? { game: { ...s.game, [side]: { ...s.game[side], energy: Math.max(0, Math.min(MAX_ENERGY, value)) } } }
            : s,
        ),

      adjustHp: (side, uid, delta) =>
        set((s) => {
          if (!s.game) return s
          return {
            game: patchUnit(s.game, side, uid, (u) => {
              // no max clamp: some abilities (e.g. Mimic's Insatiable Horror)
              // explicitly allow exceeding maximum HP
              const hp = Math.max(0, u.hp + delta)
              // 0 HP = removed from play (rules p.14); healing above 0 revives
              return { ...u, hp, dead: hp === 0 }
            }),
          }
        }),

      adjustAct: (side, uid, delta) =>
        set((s) => {
          if (!s.game) return s
          return {
            game: patchUnit(s.game, side, uid, (u) => ({ ...u, act: Math.max(0, u.act + delta) })),
          }
        }),

      toggleCondition: (side, uid, conditionId) =>
        set((s) => {
          if (!s.game) return s
          return {
            game: patchUnit(s.game, side, uid, (u) => ({
              ...u,
              conditions: u.conditions.includes(conditionId)
                ? u.conditions.filter((c) => c !== conditionId)
                : [...u.conditions, conditionId],
            })),
          }
        }),

      toggleDead: (side, uid) =>
        set((s) => {
          if (!s.game) return s
          return {
            // keep hp on manual KO so a mis-tap is undoable; revive floors at 1
            game: patchUnit(s.game, side, uid, (u) =>
              u.dead ? { ...u, dead: false, hp: Math.max(1, u.hp) } : { ...u, dead: true },
            ),
          }
        }),
    }),
    { name: 'mf-play', version: 1 },
  ),
)
