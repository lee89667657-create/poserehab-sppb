// SPPB (Short Physical Performance Battery) Types

export type BalanceStance = 'side-by-side' | 'semi-tandem' | 'tandem'

export interface BalanceTest {
  stance: BalanceStance
  duration: number // 유지 시간 (초)
  completed: boolean
  maxDuration: 10 // 최대 10초
}

export interface BalanceResult {
  sideBySide: BalanceTest
  semiTandem: BalanceTest
  tandem: BalanceTest
  score: number // 0-4점
}

export interface GaitSpeedResult {
  time: number | null // 4m 걷는 시간 (초)
  completed: boolean
  score: number // 0-4점
}

export interface ChairStandResult {
  time: number | null // 5회 반복 시간 (초)
  completed: boolean
  score: number // 0-4점
}

export interface SPPBResult {
  id: string
  timestamp: number
  balance: BalanceResult
  gaitSpeed: GaitSpeedResult
  chairStand: ChairStandResult
  totalScore: number // 0-12점
}

export interface SPPBState {
  // 현재 검사 상태
  currentTest: 'balance' | 'gait' | 'chair' | null
  isTestRunning: boolean

  // 각 검사 결과
  balanceResult: BalanceResult | null
  gaitSpeedResult: GaitSpeedResult | null
  chairStandResult: ChairStandResult | null

  // 저장된 기록
  history: SPPBResult[]

  // Actions
  startTest: (test: 'balance' | 'gait' | 'chair') => void
  stopTest: () => void

  updateBalanceResult: (result: BalanceResult) => void
  updateGaitSpeedResult: (result: GaitSpeedResult) => void
  updateChairStandResult: (result: ChairStandResult) => void

  saveResult: () => void
  deleteResult: (id: string) => void
  clearHistory: () => void
  resetCurrentSession: () => void
}

// SPPB 점수 계산 함수들
export const calculateBalanceScore = (balance: BalanceResult): number => {
  let score = 0

  // Side-by-Side: 10초 유지 = 1점
  if (balance.sideBySide.duration >= 10) {
    score += 1

    // Semi-Tandem: 10초 유지 = 1점 (Side-by-Side 완료 시에만)
    if (balance.semiTandem.duration >= 10) {
      score += 1

      // Tandem: 10초 유지 = 2점, 3-9.99초 = 1점
      if (balance.tandem.duration >= 10) {
        score += 2
      } else if (balance.tandem.duration >= 3) {
        score += 1
      }
    }
  }

  return Math.min(score, 4)
}

export const calculateGaitSpeedScore = (time: number | null): number => {
  if (time === null || time <= 0) return 0
  if (time <= 4.82) return 4
  if (time <= 6.20) return 3
  if (time <= 8.70) return 2
  return 1
}

export const calculateChairStandScore = (time: number | null): number => {
  if (time === null || time <= 0 || time >= 60) return 0
  if (time <= 11.19) return 4
  if (time <= 13.69) return 3
  if (time <= 16.69) return 2
  return 1
}
