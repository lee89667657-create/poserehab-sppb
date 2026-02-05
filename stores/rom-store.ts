import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  JointCategory,
  MovementType,
  JointSide,
  CalibrationData,
  MeasurementRecord,
  RomMeasurementSession,
} from '@/types/rom'

interface RomState {
  // 현재 측정 상태
  isActive: boolean
  selectedCategory: JointCategory
  selectedMovement: MovementType | null
  selectedSide: JointSide
  currentAngle: number
  measurementMode: 'single' | 'compare'
  voiceEnabled: boolean

  // 캘리브레이션 데이터
  calibrations: CalibrationData[]

  // 현재 세션 측정값들
  currentMeasurements: MeasurementRecord[]

  // 저장된 세션 기록
  sessions: RomMeasurementSession[]

  // Actions
  setIsActive: (isActive: boolean) => void
  setSelectedCategory: (category: JointCategory) => void
  setSelectedMovement: (movement: MovementType | null) => void
  setSelectedSide: (side: JointSide) => void
  setCurrentAngle: (angle: number) => void
  setMeasurementMode: (mode: 'single' | 'compare') => void
  setVoiceEnabled: (enabled: boolean) => void

  // 캘리브레이션
  saveCalibration: (calibration: CalibrationData) => void
  getCalibration: (movementId: MovementType, side: JointSide) => CalibrationData | null

  // 측정 기록
  addMeasurement: (measurement: MeasurementRecord) => void
  clearCurrentMeasurements: () => void

  // 세션 저장
  saveSession: () => RomMeasurementSession | null
  deleteSession: (id: string) => void
  clearSessions: () => void
}

export const useRomStore = create<RomState>()(
  persist(
    (set, get) => ({
      // 초기값
      isActive: false,
      selectedCategory: 'shoulder',
      selectedMovement: null,
      selectedSide: 'left',
      currentAngle: 0,
      measurementMode: 'single',
      voiceEnabled: true,
      calibrations: [],
      currentMeasurements: [],
      sessions: [],

      // Setters
      setIsActive: (isActive) => set({ isActive }),
      setSelectedCategory: (category) =>
        set({ selectedCategory: category, selectedMovement: null }),
      setSelectedMovement: (movement) => set({ selectedMovement: movement }),
      setSelectedSide: (side) => set({ selectedSide: side }),
      setCurrentAngle: (angle) => set({ currentAngle: angle }),
      setMeasurementMode: (mode) => set({ measurementMode: mode }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

      // 캘리브레이션
      saveCalibration: (calibration) => {
        set((state) => {
          const existing = state.calibrations.findIndex(
            (c) =>
              c.movementId === calibration.movementId && c.side === calibration.side
          )
          if (existing >= 0) {
            const newCalibrations = [...state.calibrations]
            newCalibrations[existing] = calibration
            return { calibrations: newCalibrations }
          }
          return { calibrations: [...state.calibrations, calibration] }
        })
      },

      getCalibration: (movementId, side) => {
        const { calibrations } = get()
        return (
          calibrations.find(
            (c) => c.movementId === movementId && c.side === side
          ) || null
        )
      },

      // 측정 기록
      addMeasurement: (measurement) => {
        set((state) => ({
          currentMeasurements: [...state.currentMeasurements, measurement],
        }))
      },

      clearCurrentMeasurements: () => {
        set({ currentMeasurements: [] })
      },

      // 세션 저장
      saveSession: () => {
        const { currentMeasurements, sessions } = get()
        if (currentMeasurements.length === 0) return null

        const session: RomMeasurementSession = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          measurements: [...currentMeasurements],
        }

        set({
          sessions: [session, ...sessions].slice(0, 50),
          currentMeasurements: [],
        })

        return session
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }))
      },

      clearSessions: () => {
        set({ sessions: [] })
      },
    }),
    {
      name: 'posture-ai-rom-measurement',
      partialize: (state) => ({
        calibrations: state.calibrations,
        sessions: state.sessions,
        voiceEnabled: state.voiceEnabled,
        measurementMode: state.measurementMode,
      }),
    }
  )
)
