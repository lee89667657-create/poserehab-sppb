import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface PatientContextState {
  selectedPatientId: string | null
  selectedPatientName: string | null
  selectedPatientAge: number | null
  selectedPatientGender: string | null
  selectedPatientDiagnosis: string | null
  setSelectedPatient: (id: string, name: string, extra?: { age?: number; gender?: string; diagnosis?: string }) => void
  clearSelectedPatient: () => void
}

export const usePatientContextStore = create<PatientContextState>()(
  persist(
    (set) => ({
      selectedPatientId: null,
      selectedPatientName: null,
      selectedPatientAge: null,
      selectedPatientGender: null,
      selectedPatientDiagnosis: null,
      setSelectedPatient: (id, name, extra) => set({
        selectedPatientId: id,
        selectedPatientName: name,
        selectedPatientAge: extra?.age ?? null,
        selectedPatientGender: extra?.gender ?? null,
        selectedPatientDiagnosis: extra?.diagnosis ?? null,
      }),
      clearSelectedPatient: () => set({
        selectedPatientId: null,
        selectedPatientName: null,
        selectedPatientAge: null,
        selectedPatientGender: null,
        selectedPatientDiagnosis: null,
      }),
    }),
    {
      name: 'patient-context',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
