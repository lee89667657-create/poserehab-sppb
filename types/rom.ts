// ROM (Range of Motion) 측정 관련 타입 정의

export type JointCategory =
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'finger'
  | 'hip'
  | 'knee'
  | 'ankle'

export type ExtremityGroup = 'upper' | 'lower'

export type JointSide = 'left' | 'right' | 'center'

export type MovementType =
  // Upper Extremity - Shoulder
  | 'shoulder_flexion'
  | 'shoulder_extension'
  // Upper Extremity - Elbow
  | 'elbow_flexion'
  // Upper Extremity - Wrist
  | 'wrist_flexion'
  | 'wrist_extension'
  // Upper Extremity - Finger
  | 'finger_mcp_flexion'
  | 'finger_pip_flexion'
  // Lower Extremity - Hip
  | 'hip_flexion'
  | 'hip_abduction'
  // Lower Extremity - Knee
  | 'knee_flexion'
  // Lower Extremity - Ankle
  | 'ankle_dorsiflexion'
  | 'ankle_plantarflexion'

export interface NormalRange {
  min: number
  max: number
}

export interface JointMovement {
  id: MovementType
  category: JointCategory
  nameEn: string
  nameKo: string
  descriptionEn: string
  descriptionKo: string
  guideEn: string
  guideKo: string
  normalRange: NormalRange
  side: JointSide
  cameraMeasurable: boolean // 카메라로 측정 가능 여부
  // MediaPipe 랜드마크 인덱스 (cameraMeasurable인 경우에만 사용)
  landmarks: {
    point1: number // 시작점
    point2: number // 중심점 (각도 측정 기준)
    point3: number // 끝점
  }
}

export interface CalibrationData {
  movementId: MovementType
  side: JointSide
  minAngle: number
  maxAngle: number
  calibratedAt: string
}

export interface MeasurementRecord {
  id: string
  movementId: MovementType
  side: JointSide
  angle: number
  normalRange: NormalRange
  calibration?: CalibrationData
  timestamp: string
}

export interface RomMeasurementSession {
  id: string
  timestamp: string
  measurements: MeasurementRecord[]
}

// 관절별 카테고리 정보
export interface JointCategoryInfo {
  id: JointCategory
  extremity: ExtremityGroup
  nameEn: string
  nameKo: string
  icon: string
  movements: MovementType[]
}
