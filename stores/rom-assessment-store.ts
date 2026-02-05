import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ROMResult, ROMScore, ROMSideScore } from '@/types/assessments'

type ROMField = 'lt' | 'rt'

const hasSideValues = (side: ROMSideScore): boolean =>
  Object.values(side).some((v) => v !== null)

interface ROMAssessmentState {
  currentScores: Record<string, ROMScore>
  history: ROMResult[]

  setScore: (itemId: string, field: ROMField, values: ROMSideScore) => void
  resetCurrentSession: () => void
  saveResult: () => ROMResult | null
  deleteResult: (id: string) => void
  clearHistory: () => void
}

export const useROMAssessmentStore = create<ROMAssessmentState>()(
  persist(
    (set, get) => ({
      currentScores: {},
      history: [],

      setScore: (itemId, field, values) => {
        set((state) => {
          const current = state.currentScores[itemId] || { lt: {}, rt: {} }
          return {
            currentScores: {
              ...state.currentScores,
              [itemId]: { ...current, [field]: values },
            },
          }
        })
      },

      resetCurrentSession: () => {
        set({ currentScores: {} })
      },

      saveResult: () => {
        const { currentScores, history } = get()

        const hasScores = Object.values(currentScores).some(
          (score) => hasSideValues(score.lt) || hasSideValues(score.rt)
        )
        if (!hasScores) return null

        const result: ROMResult = {
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
      name: 'posture-ai-rom-assessment',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
)
