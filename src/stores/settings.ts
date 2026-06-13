import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  lastBudget: number
  setLastBudget: (n: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      lastBudget: 50,
      setLastBudget: (n) => set({ lastBudget: n }),
    }),
    { name: 'mf-settings', version: 1 },
  ),
)
