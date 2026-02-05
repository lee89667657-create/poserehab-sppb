import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MBIResult } from '@/types/assessments'
import { MBI_ITEMS } from '@/types/assessments'

interface MBIState {
  currentScores: Record<string, number>
  history: MBIResult[]
  notes: string
  setScore: (itemId: string, score: number) => void
  setNotes: (notes: string) => void
  getTotalScore: () => number
  saveResult: () => MBIResult | null
  deleteResult: (id: string) => void
  clearHistory: () => void
  reset: () => void
}

export const useMBIStore = create<MBIState>()(
  persist(
    (set, get) => ({
      currentScores: {},
      history: [],
      notes: '',

      setScore: (itemId, score) => {
        set((state) => ({
          currentScores: {
            ...state.currentScores,
            [itemId]: score,
          },
        }))
      },

      setNotes: (notes) => set({ notes }),

      getTotalScore: () => {
        const { currentScores } = get()
        return Object.values(currentScores).reduce((sum, score) => sum + (score || 0), 0)
      },

      saveResult: () => {
        const { currentScores, notes, getTotalScore } = get()

        // Check if at least one item has a score
        const hasAnyScore = Object.keys(currentScores).length > 0
        if (!hasAnyScore) return null

        const result: MBIResult = {
          id: `mbi-${Date.now()}`,
          timestamp: Date.now(),
          scores: { ...currentScores },
          totalScore: getTotalScore(),
          notes: notes || undefined,
        }

        set((state) => ({
          history: [result, ...state.history],
          currentScores: {},
          notes: '',
        }))

        return result
      },

      deleteResult: (id) => {
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
        }))
      },

      clearHistory: () => set({ history: [] }),

      reset: () => set({ currentScores: {}, notes: '' }),
    }),
    {
      name: 'posture-ai-mbi',
      partialize: (state) => ({ history: state.history }),
    }
  )
)
