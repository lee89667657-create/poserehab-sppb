import { supabase } from '@/lib/supabase'
import { useAssessmentsStore } from '@/stores/assessments-store'
import type { AssessmentInsert } from '@/types/database'

interface SaveAssessmentParams {
  patientId: string
  therapistId: string
  assessmentType: string
  score?: number | null
  details?: Record<string, unknown> | null
}

export async function saveAssessmentToSupabase({
  patientId,
  therapistId,
  assessmentType,
  score = null,
  details = null,
}: SaveAssessmentParams) {
  const record: AssessmentInsert = {
    patient_id: patientId,
    therapist_id: therapistId,
    assessment_type: assessmentType,
    score,
    details,
    assessed_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('assessments')
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error(`[Supabase] Failed to save ${assessmentType}:`, error)
    return null
  }

  // 대시보드 캐시 무효화 → 다음 조회 시 최신 데이터 fetch
  useAssessmentsStore.getState().invalidate()

  return data
}
