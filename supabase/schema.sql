-- ============================================================
-- PoseRehab SPPB - Supabase Schema
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1) therapists: 치료사 프로필 (auth.users와 1:1)
CREATE TABLE IF NOT EXISTS therapists (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  department text NOT NULL DEFAULT '재활의학과',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) patients: 환자
CREATE TABLE IF NOT EXISTS patients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id   uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  name           text NOT NULL,
  age            int  NOT NULL,
  gender         text NOT NULL CHECK (gender IN ('남','여')),
  diagnosis      text NOT NULL,
  onset_date     date,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','discharged','outpatient')),
  history        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3) assessments: 평가 기록
CREATE TABLE IF NOT EXISTS assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id    uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  score           numeric,
  details         jsonb,
  assessed_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 인덱스 ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_therapist   ON patients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient   ON assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_therapist ON assessments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type_date ON assessments(assessment_type, assessed_at DESC);

-- ─── RLS (Row Level Security) ──────────────────────────────
ALTER TABLE therapists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- therapists: 자기 자신만 읽기/수정
CREATE POLICY "therapists_select_own" ON therapists
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "therapists_insert_own" ON therapists
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "therapists_update_own" ON therapists
  FOR UPDATE USING (id = auth.uid());

-- patients: 자기 환자만 CRUD
CREATE POLICY "patients_select_own" ON patients
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "patients_insert_own" ON patients
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "patients_update_own" ON patients
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY "patients_delete_own" ON patients
  FOR DELETE USING (therapist_id = auth.uid());

-- assessments: 자기 환자 평가만 CRUD
CREATE POLICY "assessments_select_own" ON assessments
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "assessments_insert_own" ON assessments
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "assessments_update_own" ON assessments
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY "assessments_delete_own" ON assessments
  FOR DELETE USING (therapist_id = auth.uid());
