import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Party, PartyEntry } from '../lib/types'
import { gameData } from '../data'

function newId(): string {
  return crypto.randomUUID()
}

interface PartiesState {
  parties: Record<string, Party>
  createParty: (init?: Partial<Pick<Party, 'name' | 'budget' | 'entries' | 'notes' | 'dataVersion'>>) => Party
  updateParty: (id: string, patch: Partial<Omit<Party, 'id' | 'createdAt'>>) => void
  setEntryCount: (id: string, monsterId: string, count: number) => void
  duplicateParty: (id: string) => Party | null
  deleteParty: (id: string) => void
}

export const usePartiesStore = create<PartiesState>()(
  persist(
    (set, get) => ({
      parties: {},

      createParty: (init) => {
        const now = Date.now()
        const party: Party = {
          id: newId(),
          name: init?.name ?? '',
          budget: init?.budget ?? 50,
          dataVersion: init?.dataVersion ?? gameData.dataVersion,
          entries: init?.entries ?? [],
          notes: init?.notes,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ parties: { ...s.parties, [party.id]: party } }))
        return party
      },

      updateParty: (id, patch) =>
        set((s) => {
          const cur = s.parties[id]
          if (!cur) return s
          return { parties: { ...s.parties, [id]: { ...cur, ...patch, updatedAt: Date.now() } } }
        }),

      setEntryCount: (id, monsterId, count) =>
        set((s) => {
          const cur = s.parties[id]
          if (!cur) return s
          let entries: PartyEntry[]
          if (count <= 0) {
            entries = cur.entries.filter((e) => e.monsterId !== monsterId)
          } else if (cur.entries.some((e) => e.monsterId === monsterId)) {
            entries = cur.entries.map((e) => (e.monsterId === monsterId ? { ...e, count } : e))
          } else {
            entries = [...cur.entries, { monsterId, count }]
          }
          return { parties: { ...s.parties, [id]: { ...cur, entries, updatedAt: Date.now() } } }
        }),

      duplicateParty: (id) => {
        const cur = get().parties[id]
        if (!cur) return null
        const now = Date.now()
        const copy: Party = { ...cur, id: newId(), name: `${cur.name} (copy)`, createdAt: now, updatedAt: now }
        set((s) => ({ parties: { ...s.parties, [copy.id]: copy } }))
        return copy
      },

      deleteParty: (id) =>
        set((s) => {
          const next = { ...s.parties }
          delete next[id]
          return { parties: next }
        }),
    }),
    { name: 'mf-parties', version: 1 },
  ),
)
