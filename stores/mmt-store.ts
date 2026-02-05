import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MMTResult, MMTScore } from '@/types/assessments'

interface MMTState {
  currentScores: Record<string, MMTScore>
  history: MMTResult[]

  setScore: (itemId: string, side: 'lt' | 'rt', value: number | null) => void
  resetCurrentSession: () => void
  saveResult: () => MMTResult | null
  deleteResult: (id: string) => void
  clearHistory: () => void
}

export const useMMTStore = create<MMTState>()(
  persist(
    (set, get) => ({
      currentScores: {},
      history: [],

      setScore: (itemId, side, value) => {
        set((state) => {
          const current = state.currentScores[itemId] || { lt: null, rt: null }
          return {
            currentScores: {
              ...state.currentScores,
              [itemId]: { ...current, [side]: value },
            },
          }
        })
      },

      resetCurrentSession: () => {
        set({ currentScores: {} })
      },

      saveResult: () => {
        const { currentScores, history } = get()

        // 최소 하나의 점수가 있어야 저장
        const hasScores = Object.values(currentScores).some(
          (score) => score.lt !== null || score.rt !== null
        )
        if (!hasScores) return null

        const result: MMTResult = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          scores: { ...currentScores },
        }

        set({
          history: [result, ...history].slice(0, 50),
          currentScores: {},
        })

        return result
      },

      deleteResult: (id) => {
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
        }))
      },

      clearHistory: () => {
        set({ history: [] })
      },
    }),
    {
      name: 'posture-ai-mmt',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
)
