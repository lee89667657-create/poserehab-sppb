import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Patient, PatientInsert, PatientStatus } from '@/types/database'

interface PatientWithLastAssessment extends Patient {
  last_assessed_at?: string | null
}

interface PatientsStore {
  patients: PatientWithLastAssessment[]
  isLoading: boolean
  _therapistId: string | null
  _fetchedAt: number

  fetchPatients: (therapistId: string) => Promise<void>
  addPatient: (therapistId: string, patient: Omit<PatientInsert, 'therapist_id'>) => Promise<Patient | null>
  deletePatient: (patientId: string) => Promise<void>
  updatePatient: (patientId: string, updates: { status?: PatientStatus; history?: string; onset_date?: string | null }) => Promise<void>
}

const CACHE_TTL = 60_000 // 1분

export const usePatientsStore = create<PatientsStore>((set, get) => ({
  patients: [],
  isLoading: true,
  _therapistId: null,
  _fetchedAt: 0,

  fetchPatients: async (therapistId: string) => {
    const state = get()
    // 같은 치료사 + TTL 내면 캐시 사용
    if (
      state._therapistId === therapistId &&
      state.patients.length > 0 &&
      Date.now() - state._fetchedAt < CACHE_TTL
    ) {
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })

    const { data: rawData } = await supabase
      .from('patients')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false })

    const patientsData = (rawData || []) as Patient[]
    if (patientsData.length === 0) {
      set({ patients: [], isLoading: false, _therapistId: therapistId, _fetchedAt: Date.now() })
      return
    }

    const patientIds = patientsData.map((p) => p.id)
    const { data: rawAssessments } = await supabase
      .from('assessments')
      .select('patient_id, assessed_at')
      .in('patient_id', patientIds)
      .order('assessed_at', { ascending: false })

    const assessmentsData = (rawAssessments || []) as { patient_id: string; assessed_at: string }[]
    const lastAssessmentMap = new Map<string, string>()
    assessmentsData.forEach((a) => {
      if (!lastAssessmentMap.has(a.patient_id)) {
        lastAssessmentMap.set(a.patient_id, a.assessed_at)
      }
    })

    const enriched: PatientWithLastAssessment[] = patientsData.map((p) => ({
      ...p,
      last_assessed_at: lastAssessmentMap.get(p.id) || null,
    }))

    set({ patients: enriched, isLoading: false, _therapistId: therapistId, _fetchedAt: Date.now() })
  },

  addPatient: async (therapistId: string, patient: Omit<PatientInsert, 'therapist_id'>) => {
    const { data, error } = await supabase
      .from('patients')
      .insert({ ...patient, therapist_id: therapistId })
      .select()
      .single()
    if (error) throw error
    // 캐시 무효화 후 refetch
    set({ _fetchedAt: 0 })
    await get().fetchPatients(therapistId)
    return data as Patient
  },

  deletePatient: async (patientId: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', patientId)
    if (error) throw error
    // 로컬 상태에서 즉시 제거 (optimistic)
    set((s) => ({ patients: s.patients.filter((p) => p.id !== patientId) }))
  },

  updatePatient: async (patientId: string, updates) => {
    const { error } = await supabase.from('patients').update(updates).eq('id', patientId)
    if (error) throw error
    // 로컬 상태 즉시 반영 (optimistic)
    set((s) => ({
      patients: s.patients.map((p) => (p.id === patientId ? { ...p, ...updates } : p)),
    }))
  },
}))
