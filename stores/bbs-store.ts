import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BBSResult } from '@/types/bbs'
import { interpretBBSScore } from '@/types/bbs'

interface BBSState {
  // 현재 평가 상태
  currentScores: Record<number, number>

  // 저장된 기록
  history: BBSResult[]

  // Actions
  setScore: (itemId: number, score: number) => void
  resetCurrentSession: () => void
  saveResult: () => BBSResult | null
  deleteResult: (id: string) => void
  clearHistory: () => void
}

export const useBBSStore = create<BBSState>()(
  persist(
    (set, get) => ({
      // 현재 평가 상태
      currentScores: {},

      // 저장된 기록
      history: [],

      // Actions
      setScore: (itemId, score) => {
        set((state) => ({
          currentScores: { ...state.currentScores, [itemId]: score },
        }))
      },

      resetCurrentSession: () => {
        set({ currentScores: {} })
      },

      saveResult: () => {
        const { currentScores, history } = get()

        // 14개 항목이 모두 완료되었는지 확인
        if (Object.keys(currentScores).length < 14) {
          return null
        }

        const totalScore = Object.values(currentScores).reduce((sum, score) => sum + score, 0)
        const interpretation = interpretBBSScore(totalScore)

        const result: BBSResult = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          scores: { ...currentScores },
          totalScore,
          riskLevel: interpretation.riskLevel,
        }

        set({
          history: [result, ...history].slice(0, 50), // 최대 50개 저장
          currentScores: {}, // 저장 후 초기화
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
      name: 'posture-ai-bbs',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
)
