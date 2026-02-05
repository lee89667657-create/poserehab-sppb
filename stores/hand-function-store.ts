import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HandFunctionResult, HandFunctionScore } from '@/types/assessments'
import { HAND_FUNCTION_ITEMS } from '@/types/assessments'

interface HandFunctionState {
  currentScores: Record<string, HandFunctionScore>
  history: HandFunctionResult[]
  notes: string
  setScore: (itemId: string, side: 'left' | 'right', value: number | null) => void
  setNotes: (notes: string) => void
  getLeftTotalScore: () => number
  getRightTotalScore: () => number
  saveResult: () => HandFunctionResult | null
  deleteResult: (id: string) => void
  clearHistory: () => void
  reset: () => void
}

export const useHandFunctionStore = create<HandFunctionState>()(
  persist(
    (set, get) => ({
      currentScores: {},
      history: [],
      notes: '',

      setScore: (itemId, side, value) => {
        set((state) => ({
          currentScores: {
            ...state.currentScores,
            [itemId]: {
              ...state.currentScores[itemId],
              left: side === 'left' ? value : (state.currentScores[itemId]?.left ?? null),
              right: side === 'right' ? value : (state.currentScores[itemId]?.right ?? null),
            },
          },
        }))
      },

      setNotes: (notes) => set({ notes }),

      getLeftTotalScore: () => {
        const { currentScores } = get()
        // Only count select type items for scoring
        return HAND_FUNCTION_ITEMS
          .filter(item => item.type === 'select')
          .reduce((sum, item) => {
            const score = currentScores[item.id]?.left
            return sum + (score || 0)
          }, 0)
      },

      getRightTotalScore: () => {
        const { currentScores } = get()
        // Only count select type items for scoring
        return HAND_FUNCTION_ITEMS
          .filter(item => item.type === 'select')
          .reduce((sum, item) => {
            const score = currentScores[item.id]?.right
            return sum + (score || 0)
          }, 0)
      },

      saveResult: () => {
        const { currentScores, notes, getLeftTotalScore, getRightTotalScore } = get()

        // Check if at least one item has a score
        const hasAnyScore = Object.values(currentScores).some(
          score => score.left !== null || score.right !== null
        )
        if (!hasAnyScore) return null

        const result: HandFunctionResult = {
          id: `hft-${Date.now()}`,
          timestamp: Date.now(),
          scores: { ...currentScores },
          leftTotalScore: getLeftTotalScore(),
          rightTotalScore: getRightTotalScore(),
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
      name: 'posture-ai-hand-function',
      partialize: (state) => ({ history: state.history }),
    }
  )
)
