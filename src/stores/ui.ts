import { create } from 'zustand'

interface UiState {
  /** Keyword id currently shown in the bottom-sheet popup, if any. */
  keywordId: string | null
  openKeyword: (id: string) => void
  closeKeyword: () => void
}

export const useUiStore = create<UiState>((set) => ({
  keywordId: null,
  openKeyword: (id) => set({ keywordId: id }),
  closeKeyword: () => set({ keywordId: null }),
}))
