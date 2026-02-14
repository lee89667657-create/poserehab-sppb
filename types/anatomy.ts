// Anatomy types for 3D viewer, SOAP, reports

export type Severity = 'normal' | 'mild' | 'moderate' | 'severe'
export type RenderMode = 'muscle' | 'skeleton' | 'xray'
export type TissueGroup = 'Muscle' | 'Bone'
export type CameraPresetPosition = 'front' | 'back' | 'left' | 'right' | 'top' | 'reset'

export interface CameraPreset {
  position: CameraPresetPosition
  yOffset?: number
}

export interface ExerciseInfo {
  name: string
  difficulty: '쉬움' | '보통' | '어려움'
  videoId: string
}

export interface AnatomyInfo {
  name: string
  description: string
  keyMuscles: string[]
  keyStructures: string[]
  commonPathologies: string[]
  exercises: ExerciseInfo[]
  cameraPreset: CameraPreset
}

export interface AnatomyRegion {
  id: string
  name: string
  side: 'l' | 'r'
}

export interface RegionGroup {
  name: string
  ids: string[]
}

export interface SearchResult {
  regionKey: string
  name: string
  matchField: string
}

export interface RegionDef {
  id: string
  label: string
  yMin: number
  yMax: number
}

// SOAP Notes
export interface SoapSubjective {
  chiefComplaint: string
  painScale: number
  symptomDescription: string
  painLocation: string
  onset: string
  aggravating: string
  relieving: string
  voiceTags?: Record<string, string[]> | null
}

export interface SoapObjective {
  autoFindings: string
  rom: string
  mmt: string
  specialTests: string
  palpation: string
  gait: string
  additionalFindings: string
}

export interface SoapAssessment {
  clinicalImpression: string
  progressLevel: string
  functionalLevel: string
  goals: string
}

export interface SoapPlan {
  treatment: string
  hep: string
  frequency: string
  duration: string
  nextVisit: string
  precautions: string
  referral: string
}

export interface SoapNotes {
  subjective: SoapSubjective
  objective: SoapObjective
  assessment: SoapAssessment
  plan: SoapPlan
}

// Mapping
export interface MappingRegionData {
  meshes: string[]
  state: string
  xMin: number | null
  xMax: number | null
  yMin: number | null
  yMax: number | null
}

export interface MappingJson {
  version: number
  timestamp: string
  regions: Record<string, MappingRegionData>
}

export interface RegionKeyWithLabel {
  key: string
  label: string
  side: string
  meshCount: number
}

// Severity helpers
export const SEV_LABELS: Record<Severity, string> = {
  normal: '정상',
  mild: '경도',
  moderate: '중등도',
  severe: '중증',
}

export const SEV_COLORS: Record<Severity, string> = {
  normal: '#4a4e58',
  mild: '#29B6F6',
  moderate: '#FFA726',
  severe: '#FF1744',
}

export function severityRank(sev: string): number {
  const ranks: Record<string, number> = { normal: 0, mild: 1, moderate: 2, severe: 3 }
  return ranks[sev] ?? 0
}

export const DIFFICULTY_CLASS: Record<string, string> = {
  '쉬움': 'easy',
  '보통': 'medium',
  '어려움': 'hard',
}
