import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  SPPBState,
  SPPBResult,
  BalanceResult,
  GaitSpeedResult,
  ChairStandResult,
} from '@/types/sppb'
import {
  calculateBalanceScore,
  calculateGaitSpeedScore,
  calculateChairStandScore,
} from '@/types/sppb'

const initialBalanceResult: BalanceResult = {
  sideBySide: { stance: 'side-by-side', duration: 0, completed: false, maxDuration: 10 },
  semiTandem: { stance: 'semi-tandem', duration: 0, completed: false, maxDuration: 10 },
  tandem: { stance: 'tandem', duration: 0, completed: false, maxDuration: 10 },
  score: 0,
}

const initialGaitSpeedResult: GaitSpeedResult = {
  time: null,
  completed: false,
  score: 0,
}

const initialChairStandResult: ChairStandResult = {
  time: null,
  completed: false,
  score: 0,
}

export const useSPPBStore = create<SPPBState>()(
  persist(
    (set, get) => ({
      // 현재 검사 상태
      currentTest: null,
      isTestRunning: false,

      // 각 검사 결과
      balanceResult: null,
      gaitSpeedResult: null,
      chairStandResult: null,

      // 저장된 기록
      history: [],

      // Actions
      startTest: (test) => {
        set({
          currentTest: test,
          isTestRunning: true,
        })
      },

      stopTest: () => {
        set({
          isTestRunning: false,
        })
      },

      updateBalanceResult: (result) => {
        const score = calculateBalanceScore(result)
        set({
          balanceResult: { ...result, score },
        })
      },

      updateGaitSpeedResult: (result) => {
        const score = calculateGaitSpeedScore(result.time)
        set({
          gaitSpeedResult: { ...result, score },
        })
      },

      updateChairStandResult: (result) => {
        const score = calculateChairStandScore(result.time)
        set({
          chairStandResult: { ...result, score },
        })
      },

      saveResult: () => {
        const { balanceResult, gaitSpeedResult, chairStandResult, history } = get()

        const balance = balanceResult || { ...initialBalanceResult }
        const gait = gaitSpeedResult || { ...initialGaitSpeedResult }
        const chair = chairStandResult || { ...initialChairStandResult }

        const totalScore = balance.score + gait.score + chair.score

        const result: SPPBResult = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          balance,
          gaitSpeed: gait,
          chairStand: chair,
          totalScore,
        }

        set({
          history: [result, ...history].slice(0, 50), // 최대 50개 저장
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

      resetCurrentSession: () => {
        set({
          currentTest: null,
          isTestRunning: false,
          balanceResult: null,
          gaitSpeedResult: null,
          chairStandResult: null,
        })
      },
    }),
    {
      name: 'posture-ai-sppb',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
)
