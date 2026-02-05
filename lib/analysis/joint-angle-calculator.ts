import type { Landmark } from '@/types/posture'
import type { JointMovement, MovementType, JointSide } from '@/types/rom'
import { getMovementById, getMirroredLandmarks } from '@/lib/rom-constants'

// 세 점 사이의 각도 계산 (point2가 중심점/꼭짓점)
export function calculateAngle(
  point1: { x: number; y: number; z?: number },
  point2: { x: number; y: number; z?: number },
  point3: { x: number; y: number; z?: number }
): number {
  // 벡터 계산 (point2 -> point1, point2 -> point3)
  const v1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  }
  const v2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
  }

  // 내적
  const dotProduct = v1.x * v2.x + v1.y * v2.y

  // 벡터 크기
  const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }

  // 각도 계산 (라디안 -> 도)
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magnitude1 * magnitude2)))
  const angleRadians = Math.acos(cosAngle)
  const angleDegrees = (angleRadians * 180) / Math.PI

  return angleDegrees
}

// 특정 움직임에 대한 원시 각도 측정
export function measureJointAngle(
  landmarks: Landmark[],
  movementId: MovementType,
  side: JointSide
): number | null {
  if (landmarks.length < 33) {
    return null
  }

  const movement = getMovementById(movementId)
  if (!movement || !movement.cameraMeasurable) {
    return null
  }

  // 오른쪽인 경우 랜드마크 인덱스 미러링
  const landmarkIndices =
    side === 'right' && movement.side === 'left'
      ? getMirroredLandmarks(movement)
      : movement.landmarks

  const point1 = landmarks[landmarkIndices.point1]
  const point2 = landmarks[landmarkIndices.point2]
  const point3 = landmarks[landmarkIndices.point3]

  if (!point1 || !point2 || !point3) {
    return null
  }

  // 가시성 체크 (최소 0.1 이상)
  if (
    (point1.visibility ?? 0) < 0.1 ||
    (point2.visibility ?? 0) < 0.1 ||
    (point3.visibility ?? 0) < 0.1
  ) {
    return null
  }

  // 2D 각도 계산
  return calculateAngle(point1, point2, point3)
}

// 보충각 (180 - 원시 각도) 계산
// 관절 굽힘처럼 기준선이 일직선(≈180°)인 경우 사용
export function measureSupplementAngle(
  landmarks: Landmark[],
  movementId: MovementType,
  side: JointSide
): number | null {
  const rawAngle = measureJointAngle(landmarks, movementId, side)
  if (rawAngle === null) return null

  return Math.max(0, 180 - rawAngle)
}

// 움직임 유형에 따라 적절한 각도 계산 방식 선택
//
// 각도 계산 전략:
//
// 1) "Direct angle" (원시 각도 = ROM)
//    중립 자세에서 point1과 point3이 point2의 같은 방향에 위치
//    → 원시 각도 ≈ 0° (중립), 움직이면 각도 증가
//    예: shoulder_flexion → hip(아래), shoulder(중심), elbow(아래) → 팔 내리면 ≈0°, 올리면 증가
//
// 2) "Supplement angle" (180 - 원시 각도 = ROM)
//    중립 자세에서 point1과 point3이 point2의 반대편에 위치 (일직선 ≈ 180°)
//    → 180 - 원시 각도 = 0° (중립), 구부리면 각도 증가
//    예: elbow_flexion → shoulder(위), elbow(중심), wrist(아래) → 펴면 ≈180° → 0°
//
export function getJointAngle(
  landmarks: Landmark[],
  movementId: MovementType,
  side: JointSide
): number | null {
  // === Category 1: Direct angle ===
  // 중립 시 point1, point3이 point2 같은 쪽 (각도 ≈ 0°)
  // 어깨: hip과 elbow가 모두 shoulder 아래에 위치
  const directAngleMovements: MovementType[] = [
    'shoulder_flexion',
    'shoulder_extension',
  ]

  // === Category 2: Supplement angle (180 - raw) ===
  // 중립 시 point1, point3이 point2 반대편 (각도 ≈ 180°)
  const supplementAngleMovements: MovementType[] = [
    'elbow_flexion',
    'knee_flexion',
    'hip_flexion',
    'wrist_flexion',
    'wrist_extension',
    'ankle_dorsiflexion',
    'ankle_plantarflexion',
  ]

  if (directAngleMovements.includes(movementId)) {
    return measureJointAngle(landmarks, movementId, side)
  }

  if (supplementAngleMovements.includes(movementId)) {
    return measureSupplementAngle(landmarks, movementId, side)
  }

  // 기본: 원시 각도 그대로 반환 (hip_abduction 등)
  return measureJointAngle(landmarks, movementId, side)
}

// 각도 안정화 (노이즈 제거)
export class AngleStabilizer {
  private history: number[] = []
  private maxHistorySize: number

  constructor(historySize: number = 5) {
    this.maxHistorySize = historySize
  }

  stabilize(angle: number): number {
    this.history.push(angle)
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }

    // 이동 평균 계산
    const sum = this.history.reduce((a, b) => a + b, 0)
    return sum / this.history.length
  }

  reset(): void {
    this.history = []
  }
}

// 상태 판단
export type AngleStatus = 'normal' | 'low' | 'high' | 'max'

export function getAngleStatus(
  angle: number,
  normalMin: number,
  normalMax: number,
  calibrationMax?: number
): AngleStatus {
  if (calibrationMax !== undefined && angle >= calibrationMax) {
    return 'max'
  }
  if (angle < normalMin) {
    return 'low'
  }
  if (angle > normalMax) {
    return 'high'
  }
  return 'normal'
}
