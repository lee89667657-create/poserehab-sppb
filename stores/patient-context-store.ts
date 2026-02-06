import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface PatientContextState {
  selectedPatientId: string | null
  selectedPatientName: string | null
  setSelectedPatient: (id: string, name: string) => void
  clearSelectedPatient: () => void
}

export const usePatientContextStore = create<PatientContextState>()(
  persist(
    (set) => ({
      selectedPatientId: null,
      selectedPatientName: null,
      setSelectedPatient: (id, name) => set({ selectedPatientId: id, selectedPatientName: name }),
      clearSelectedPatient: () => set({ selectedPatientId: null, selectedPatientName: null }),
    }),
    {
      name: 'patient-context',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
