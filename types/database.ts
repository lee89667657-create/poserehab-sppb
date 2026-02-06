export type PatientStatus = 'active' | 'discharged' | 'outpatient'

export interface Database {
  public: {
    Tables: {
      therapists: {
        Row: {
          id: string
          name: string
          email: string
          department: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          department?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          department?: string
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          therapist_id: string
          name: string
          age: number
          gender: string
          diagnosis: string
          onset_date: string | null
          admission_date: string
          status: PatientStatus
          history: string | null
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          name: string
          age: number
          gender: string
          diagnosis: string
          onset_date?: string | null
          admission_date: string
          status?: PatientStatus
          history?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          name?: string
          age?: number
          gender?: string
          diagnosis?: string
          onset_date?: string | null
          admission_date?: string
          status?: PatientStatus
          history?: string | null
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          patient_id: string
          therapist_id: string
          assessment_type: string
          score: number | null
          details: Record<string, unknown> | null
          assessed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          therapist_id: string
          assessment_type: string
          score?: number | null
          details?: Record<string, unknown> | null
          assessed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          therapist_id?: string
          assessment_type?: string
          score?: number | null
          details?: Record<string, unknown> | null
          assessed_at?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Therapist = Database['public']['Tables']['therapists']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type Assessment = Database['public']['Tables']['assessments']['Row']
export type PatientInsert = Database['public']['Tables']['patients']['Insert']
export type AssessmentInsert = Database['public']['Tables']['assessments']['Insert']
