import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Assessment } from '@/types/database'

interface AssessmentsStore {
  assessments: Assessment[]
  isLoading: boolean
  _patientId: string | null
  _fetchedAt: number

  fetchAssessments: (patientId: string) => Promise<void>
  invalidate: () => void
}

const CACHE_TTL = 60_000 // 1분

export const useAssessmentsStore = create<AssessmentsStore>((set, get) => ({
  assessments: [],
  isLoading: true,
  _patientId: null,
  _fetchedAt: 0,

  fetchAssessments: async (patientId: string) => {
    const state = get()
    // 같은 환자 + TTL 내면 캐시 사용
    if (
      state._patientId === patientId &&
      state.assessments.length > 0 &&
      Date.now() - state._fetchedAt < CACHE_TTL
    ) {
      set({ isLoading: false })
      return
    }

    // 다른 환자면 즉시 초기화 (이전 데이터 보이지 않게)
    if (state._patientId !== patientId) {
      set({ assessments: [], isLoading: true })
    } else {
      set({ isLoading: true })
    }

    const { data } = await supabase
      .from('assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessed_at', { ascending: false })

    set({
      assessments: (data || []) as Assessment[],
      isLoading: false,
      _patientId: patientId,
      _fetchedAt: Date.now(),
    })
  },

  invalidate: () => set({ _fetchedAt: 0 }),
}))
