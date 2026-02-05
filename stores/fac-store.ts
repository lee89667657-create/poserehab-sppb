import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FACResult } from '@/types/assessments'

interface FACState {
  currentLevel: number | null
  currentNotes: string
  history: FACResult[]

  setLevel: (level: number) => void
  setNotes: (notes: string) => void
  resetCurrentSession: () => void
  saveResult: () => FACResult | null
  deleteResult: (id: string) => void
  clearHistory: () => void
}

export const useFACStore = create<FACState>()(
  persist(
    (set, get) => ({
      currentLevel: null,
      currentNotes: '',
      history: [],

      setLevel: (level) => {
        set({ currentLevel: level })
      },

      setNotes: (notes) => {
        set({ currentNotes: notes })
      },

      resetCurrentSession: () => {
        set({ currentLevel: null, currentNotes: '' })
      },

      saveResult: () => {
        const { currentLevel, currentNotes, history } = get()

        if (currentLevel === null) return null

        const result: FACResult = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          level: currentLevel,
          notes: currentNotes || undefined,
        }

        set({
          history: [result, ...history].slice(0, 50),
          currentLevel: null,
          currentNotes: '',
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
      name: 'posture-ai-fac',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
)
