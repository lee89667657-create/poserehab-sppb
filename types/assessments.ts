// MMT (Manual Muscle Testing) Types
export interface MMTItem {
  id: string
  name: string // 영문 의학용어 (Primary)
  nameKo: string // 한글 (참고용)
}

export const MMT_ITEMS: MMTItem[] = [
  { id: 'shoulder_flexor', name: 'Shoulder Flexors', nameKo: 'Shoulder Flexors' },
  { id: 'elbow_flexor_extensor', name: 'Elbow Flexors/Extensors', nameKo: 'Elbow Flexors/Extensors' },
  { id: 'finger_flexor_extensor', name: 'Finger Flexors/Extensors', nameKo: 'Finger Flexors/Extensors' },
  { id: 'hip_flexor', name: 'Hip Flexors', nameKo: 'Hip Flexors' },
  { id: 'knee_extensor', name: 'Knee Extensors', nameKo: 'Knee Extensors' },
  { id: 'ankle_dorsiflexor', name: 'Ankle Dorsiflexors', nameKo: 'Ankle Dorsiflexors' },
]

export const MMT_GRADES = [
  { value: 0, label: '0', grade: 'Zero', description: 'No contraction' },
  { value: 1, label: '1', grade: 'Trace', description: 'Palpable contraction, no movement' },
  { value: 2, label: '2', grade: 'Poor', description: 'Full ROM with gravity eliminated' },
  { value: 3, label: '3', grade: 'Fair', description: 'Full ROM against gravity' },
  { value: 4, label: '4', grade: 'Good', description: 'Full ROM against moderate resistance' },
  { value: 5, label: '5', grade: 'Normal', description: 'Full ROM against maximum resistance' },
]

export interface MMTScore {
  lt: number | null  // Lt. (Left)
  rt: number | null  // Rt. (Right)
}

export interface MMTResult {
  id: string
  timestamp: number
  scores: Record<string, MMTScore> // itemId -> { lt, rt }
}

// ROM (Range of Motion) Types
export interface ROMItem {
  id: string
  name: string // 영문 의학용어 (Primary)
  nameKo: string // 한글 (참고용)
  normalRange: string // 정상 범위 표시
  unit: string
  placeholder: string // 입력 placeholder (예: "180/60")
  valueKeys: string[] // 저장 시 사용할 키 (예: ['flexion', 'extension'])
}

export const ROM_ITEMS: ROMItem[] = [
  { id: 'shoulder_flex_ext', name: 'Shoulder Flexion/Extension', nameKo: 'Shoulder Flexion/Extension', normalRange: '0-180 / 0-60', unit: '°', placeholder: '180/60', valueKeys: ['flexion', 'extension'] },
  { id: 'elbow_flexion', name: 'Elbow Flexion', nameKo: 'Elbow Flexion', normalRange: '0-150', unit: '°', placeholder: '150', valueKeys: ['flexion'] },
  { id: 'wrist_flex_ext', name: 'Wrist Flexion/Extension', nameKo: 'Wrist Flexion/Extension', normalRange: '0-80 / 0-70', unit: '°', placeholder: '80/70', valueKeys: ['flexion', 'extension'] },
  { id: 'finger_mcp_pip', name: 'Finger MCP/PIP Flexion', nameKo: 'Finger MCP/PIP Flexion', normalRange: '0-90 / 0-100', unit: '°', placeholder: '90/100', valueKeys: ['flexion', 'extension'] },
  { id: 'hip_flex_abd', name: 'Hip Flexion/Abduction', nameKo: 'Hip Flexion/Abduction', normalRange: '0-120 / 0-45', unit: '°', placeholder: '120/45', valueKeys: ['flexion', 'abduction'] },
  { id: 'knee_flexion', name: 'Knee Flexion', nameKo: 'Knee Flexion', normalRange: '0-135', unit: '°', placeholder: '135', valueKeys: ['flexion'] },
  { id: 'ankle_df_pf', name: 'Ankle Dorsiflexion/Plantarflexion', nameKo: 'Ankle Dorsiflexion/Plantarflexion', normalRange: '0-20 / 0-50', unit: '°', placeholder: '20/50', valueKeys: ['dorsiflexion', 'plantarflexion'] },
]

// 각 측(Lt/Rt)의 구조화된 값
export type ROMSideScore = Record<string, number | null>

export interface ROMScore {
  lt: ROMSideScore
  rt: ROMSideScore
}

export interface ROMResult {
  id: string
  timestamp: number
  scores: Record<string, ROMScore>
}

// FAC (Functional Ambulation Classification) Types
export const FAC_LEVELS = [
  {
    value: 0,
    label: '0',
    description: 'Non-functional ambulator or requires help from 2+ persons',
    descriptionEn: 'Non-functional ambulator or requires help from 2+ persons'
  },
  {
    value: 1,
    label: '1',
    description: 'Requires continuous support from 1 person (weight bearing)',
    descriptionEn: 'Requires continuous support from 1 person (weight bearing)'
  },
  {
    value: 2,
    label: '2',
    description: 'Requires intermittent support from 1 person (balance/coordination)',
    descriptionEn: 'Requires intermittent support from 1 person (balance/coordination)'
  },
  {
    value: 3,
    label: '3',
    description: 'Requires verbal supervision or standby help',
    descriptionEn: 'Requires verbal supervision or standby help'
  },
  {
    value: 4,
    label: '4',
    description: 'Independent on level surfaces only',
    descriptionEn: 'Independent on level surfaces only'
  },
  {
    value: 5,
    label: '5',
    description: 'Independent ambulator (all surfaces)',
    descriptionEn: 'Independent ambulator (all surfaces)'
  },
]

export interface FACResult {
  id: string
  timestamp: number
  level: number
  notes?: string
}

// Assessment Type Union
export type AssessmentType = 'mmt' | 'rom' | 'bbs' | 'fac' | 'sppb' | 'mbi' | 'handFunction'
export type TherapyCategory = 'physical' | 'occupational'

// MBI (Modified Barthel Index) - 총 100점
export interface MBIItem {
  id: string
  name: string
  nameEn: string
  options: number[]
  maxScore: number
}

export const MBI_ITEMS: MBIItem[] = [
  { id: 'grooming', name: '몸치장하기', nameEn: 'Grooming', options: [0, 1, 3, 4, 5], maxScore: 5 },
  { id: 'bathing', name: '목욕하기', nameEn: 'Bathing', options: [0, 1, 3, 4, 5], maxScore: 5 },
  { id: 'eating', name: '식사하기', nameEn: 'Eating', options: [0, 2, 5, 8, 10], maxScore: 10 },
  { id: 'toilet', name: '화장실 이용', nameEn: 'Toilet Use', options: [0, 2, 5, 8, 10], maxScore: 10 },
  { id: 'stairs', name: '계단 이용', nameEn: 'Stairs', options: [0, 2, 5, 8, 10], maxScore: 10 },
  { id: 'dressing', name: '옷 입기', nameEn: 'Dressing', options: [0, 2, 5, 8, 10], maxScore: 10 },
  { id: 'bowel', name: '대변조절', nameEn: 'Bowel Control', options: [0, 2, 5, 8, 10], maxScore: 10 },
  { id: 'bladder', name: '소변조절', nameEn: 'Bladder Control', options: [0, 2, 5, 8, 10], maxScore: 10 },
  { id: 'walking', name: '걷기', nameEn: 'Walking', options: [0, 3, 8, 12, 15], maxScore: 15 },
  { id: 'wheelchair', name: '휠체어', nameEn: 'Wheelchair', options: [0, 1, 3, 4, 5], maxScore: 5 },
  { id: 'transfer', name: '의자/침대이동', nameEn: 'Chair/Bed Transfer', options: [0, 3, 8, 12, 15], maxScore: 15 },
]

export interface MBIResult {
  id: string
  timestamp: number
  scores: Record<string, number>
  totalScore: number
  notes?: string
}

// Hand Function Test - 총 32점 (좌/우 구분)
export interface HandFunctionItem {
  id: string
  name: string
  nameEn: string
  type: 'input' | 'select'
  category: 'strength' | 'motor' | 'grasp' | 'dexterity'
  unit?: string
  options?: number[]
  maxScore?: number
}

export const HAND_FUNCTION_ITEMS: HandFunctionItem[] = [
  // Strength - input fields (측정값 기록용, 점수 계산 안 함)
  { id: 'grip_strength', name: 'Grip Strength', nameEn: 'Grip Strength', type: 'input', category: 'strength', unit: 'kg' },
  { id: 'pinch_lateral', name: 'Lateral Pinch', nameEn: 'Lateral Pinch', type: 'input', category: 'strength', unit: 'P' },
  { id: 'pinch_threejaw', name: 'Three-jaw Chuck', nameEn: 'Three-jaw Chuck', type: 'input', category: 'strength', unit: 'P' },
  { id: 'pinch_tip', name: 'Tip Pinch', nameEn: 'Tip Pinch', type: 'input', category: 'strength', unit: 'P' },
  // Motor function - select 1-4 (총 16점)
  { id: 'arm_forward', name: '상지 앞으로 올리기', nameEn: 'Arm Forward Elevation', type: 'select', category: 'motor', options: [1, 2, 3, 4], maxScore: 4 },
  { id: 'arm_lateral', name: '상지 옆으로 올리기', nameEn: 'Arm Lateral Elevation', type: 'select', category: 'motor', options: [1, 2, 3, 4], maxScore: 4 },
  { id: 'hand_to_head', name: '손바닥 뒷머리로 가져가기', nameEn: 'Hand to Back of Head', type: 'select', category: 'motor', options: [1, 2, 3, 4], maxScore: 4 },
  { id: 'hand_to_back', name: '손바닥 등으로 가져가기', nameEn: 'Hand to Back', type: 'select', category: 'motor', options: [1, 2, 3, 4], maxScore: 4 },
  // Grasp - select 1-3 (총 6점)
  { id: 'grasp', name: '쥐기', nameEn: 'Grasp', type: 'select', category: 'grasp', options: [1, 2, 3], maxScore: 3 },
  { id: 'pinch', name: '집기', nameEn: 'Pinch', type: 'select', category: 'grasp', options: [1, 2, 3], maxScore: 3 },
  // Dexterity (총 10점)
  { id: 'cube_transfer', name: '입방체 옮기기', nameEn: 'Cube Transfer', type: 'select', category: 'dexterity', options: [1, 2, 3, 4], maxScore: 4 },
  { id: 'pegboard', name: '페그보드', nameEn: 'Pegboard', type: 'select', category: 'dexterity', options: [1, 2, 3, 4, 5, 6], maxScore: 6 },
]

export interface HandFunctionScore {
  left: number | null
  right: number | null
}

export interface HandFunctionResult {
  id: string
  timestamp: number
  scores: Record<string, HandFunctionScore>
  leftTotalScore: number
  rightTotalScore: number
  notes?: string
}
