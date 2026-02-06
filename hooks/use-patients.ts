'use client'

import { useEffect, useCallback } from 'react'
import { usePatientsStore } from '@/stores/patients-store'
import type { PatientInsert } from '@/types/database'

export function usePatients(therapistId: string | undefined) {
  const store = usePatientsStore()

  useEffect(() => {
    if (therapistId) {
      store.fetchPatients(therapistId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId])

  const addPatient = useCallback(
    async (patient: Omit<PatientInsert, 'therapist_id'>) => {
      if (!therapistId) return null
      return store.addPatient(therapistId, patient)
    },
    [therapistId, store]
  )

  const refetch = useCallback(() => {
    if (!therapistId) return
    // TTL 무효화 후 refetch
    usePatientsStore.setState({ _fetchedAt: 0 })
    store.fetchPatients(therapistId)
  }, [therapistId, store])

  return {
    patients: store.patients,
    isLoading: store.isLoading,
    addPatient,
    deletePatient: store.deletePatient,
    updatePatient: store.updatePatient,
    refetch,
  }
}
