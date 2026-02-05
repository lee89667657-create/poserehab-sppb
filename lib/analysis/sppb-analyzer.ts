// @ts-nocheck
import type { Landmark } from '@/types/posture'
import { POSE_LANDMARKS } from '@/hooks/use-pose-detection'

// SPPB 분석기 클래스
export class SPPBAnalyzer {
  // 균형 검사 - CoP (Center of Pressure) 추적
  private balanceHistory: { x: number; y: number; timestamp: number }[] = []
  private balanceStartTime: number = 0
  private baselineCoP: { x: number; y: number } | null = null

  // 보행 속도 - 발목 위치 추적
  private gaitStartTime: number = 0
  private leftAnkleHistory: { x: number; timestamp: number }[] = []
  private rightAnkleHistory: { x: number; timestamp: number }[] = []
  private gaitStartX: number | null = null
  private isGaitStarted: boolean = false
  private gaitEndX: number | null = null

  // 의자 일어나기 - 엉덩이 Y좌표 추적
  private chairStartTime: number = 0
  private hipYHistory: { y: number; timestamp: number }[] = []
  private chairStandCount: number = 0
  private lastState: 'sitting' | 'standing' | 'unknown' = 'unknown'
  private calibrationFrames: number[] = []
  private standingThreshold: number = 0
  private sittingThreshold: number = 0

  constructor() {
    this.reset()
  }

  reset() {
    this.resetBalance()
    this.resetGait()
    this.resetChairStand()
  }

  resetBalance() {
    this.balanceHistory = []
    this.balanceStartTime = 0
    this.baselineCoP = null
  }

  resetGait() {
    this.gaitStartTime = 0
    this.leftAnkleHistory = []
    this.rightAnkleHistory = []
    this.gaitStartX = null
    this.isGaitStarted = false
    this.gaitEndX = null
  }

  resetChairStand() {
    this.chairStartTime = 0
    this.hipYHistory = []
    this.chairStandCount = 0
    this.lastState = 'unknown'
    this.calibrationFrames = []
    this.standingThreshold = 0
    this.sittingThreshold = 0
  }

  // ==================== 공통 유틸리티 ====================

  private getHipCenter(landmarks: Landmark[]): { x: number; y: number } {
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
    return {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    }
  }

  private getShoulderCenter(landmarks: Landmark[]): { x: number; y: number } {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    return {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    }
  }

  private getAnkleCenter(landmarks: Landmark[]): { x: number; y: number } {
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE]
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
    return {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
    }
  }

  // ==================== 균형 검사 ====================
  // 정면 촬영, CoP(무게중심) 변화로 흔들림 측정

  startBalanceTest() {
    this.resetBalance()
    this.balanceStartTime = Date.now()
  }

  processBalanceFrame(landmarks: Landmark[]): {
    copX: number
    copY: number
    sway: number
    swayPath: number
    duration: number
    isStable: boolean
    bodyCenter: { x: number; y: number }
  } {
    const now = Date.now()
    const duration = (now - this.balanceStartTime) / 1000

    // CoP 계산: 발목 중심점 (정면 촬영 시 무게중심 추정)
    const ankleCenter = this.getAnkleCenter(landmarks)
    const hipCenter = this.getHipCenter(landmarks)
    const shoulderCenter = this.getShoulderCenter(landmarks)

    // 몸 전체 중심 (상체 기울기 반영)
    const bodyCenter = {
      x: (ankleCenter.x * 0.3 + hipCenter.x * 0.4 + shoulderCenter.x * 0.3),
      y: (ankleCenter.y + hipCenter.y + shoulderCenter.y) / 3,
    }

    // 첫 프레임에서 기준점 설정
    if (!this.baselineCoP) {
      this.baselineCoP = { ...bodyCenter }
    }

    // 히스토리에 추가
    this.balanceHistory.push({
      x: bodyCenter.x,
      y: bodyCenter.y,
      timestamp: now,
    })

    // 최근 2초 데이터만 유지 (흔들림 계산용)
    const twoSecondsAgo = now - 2000
    this.balanceHistory = this.balanceHistory.filter(p => p.timestamp > twoSecondsAgo)

    // 흔들림(Sway) 계산 - 표준편차 기반
    const sway = this.calculateSway()

    // 이동 경로 총 길이
    const swayPath = this.calculateSwayPath()

    // 안정성 판단 (sway < 1.5%면 안정적)
    const isStable = sway < 0.015

    return {
      copX: bodyCenter.x - (this.baselineCoP?.x || 0),
      copY: bodyCenter.y - (this.baselineCoP?.y || 0),
      sway,
      swayPath,
      duration,
      isStable,
      bodyCenter,
    }
  }

  private calculateSway(): number {
    if (this.balanceHistory.length < 5) return 0

    const xValues = this.balanceHistory.map(p => p.x)
    const yValues = this.balanceHistory.map(p => p.y)

    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length
    const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length

    const xVariance = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xValues.length
    const yVariance = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yValues.length

    return Math.sqrt(xVariance + yVariance)
  }

  private calculateSwayPath(): number {
    if (this.balanceHistory.length < 2) return 0

    let totalPath = 0
    for (let i = 1; i < this.balanceHistory.length; i++) {
      const dx = this.balanceHistory[i].x - this.balanceHistory[i - 1].x
      const dy = this.balanceHistory[i].y - this.balanceHistory[i - 1].y
      totalPath += Math.sqrt(dx * dx + dy * dy)
    }
    return totalPath
  }

  // ==================== 보행 속도 검사 ====================
  // 측면 촬영, 발목 X좌표 이동으로 거리/속도 측정

  startGaitTest() {
    this.resetGait()
    this.gaitStartTime = Date.now()
  }

  processGaitFrame(landmarks: Landmark[]): {
    distance: number
    estimatedMeters: number
    duration: number
    speed: number
    isWalking: boolean
    ankleX: number
    progress: number
  } {
    const now = Date.now()
    const duration = (now - this.gaitStartTime) / 1000

    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE]
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
    const ankleX = (leftAnkle.x + rightAnkle.x) / 2

    // 히스토리 저장
    this.leftAnkleHistory.push({ x: leftAnkle.x, timestamp: now })
    this.rightAnkleHistory.push({ x: rightAnkle.x, timestamp: now })

    // 최근 1초 데이터만 유지
    const oneSecondAgo = now - 1000
    this.leftAnkleHistory = this.leftAnkleHistory.filter(p => p.timestamp > oneSecondAgo)
    this.rightAnkleHistory = this.rightAnkleHistory.filter(p => p.timestamp > oneSecondAgo)

    // 시작 위치 설정
    if (this.gaitStartX === null) {
      this.gaitStartX = ankleX
    }

    // 걷기 감지 (최근 0.5초간 이동량 체크)
    const recentMovement = this.getRecentMovement()
    const isWalking = recentMovement > 0.01

    if (isWalking && !this.isGaitStarted) {
      this.isGaitStarted = true
      this.gaitStartX = ankleX
      this.gaitStartTime = Date.now()
    }

    // 이동 거리 계산 (정규화된 값)
    const distance = Math.abs(ankleX - (this.gaitStartX || 0))

    // 실제 거리 추정 (화면 너비의 60% ≈ 4m로 가정)
    const estimatedMeters = distance * (4 / 0.6)

    // 진행률 (4m 기준)
    const progress = Math.min((estimatedMeters / 4) * 100, 100)

    // 속도 계산
    const speed = duration > 0 ? estimatedMeters / duration : 0

    return {
      distance,
      estimatedMeters,
      duration: this.isGaitStarted ? duration : 0,
      speed,
      isWalking,
      ankleX,
      progress,
    }
  }

  private getRecentMovement(): number {
    if (this.leftAnkleHistory.length < 2) return 0

    const recent = this.leftAnkleHistory.slice(-10)
    if (recent.length < 2) return 0

    return Math.abs(recent[recent.length - 1].x - recent[0].x)
  }

  // ==================== 의자 일어나기 검사 ====================
  // 측면 촬영, 엉덩이 Y좌표 변화로 앉기/서기 감지

  startChairStandTest() {
    this.resetChairStand()
    this.chairStartTime = Date.now()
  }

  processChairStandFrame(landmarks: Landmark[]): {
    count: number
    duration: number
    state: 'sitting' | 'standing' | 'transitioning' | 'calibrating'
    hipY: number
    isCalibrated: boolean
    isComplete: boolean
  } {
    const now = Date.now()
    const duration = (now - this.chairStartTime) / 1000

    const hipCenter = this.getHipCenter(landmarks)
    const kneeCenter = {
      x: (landmarks[POSE_LANDMARKS.LEFT_KNEE].x + landmarks[POSE_LANDMARKS.RIGHT_KNEE].x) / 2,
      y: (landmarks[POSE_LANDMARKS.LEFT_KNEE].y + landmarks[POSE_LANDMARKS.RIGHT_KNEE].y) / 2,
    }

    // 엉덩이-무릎 비율로 상태 판단 (측면 촬영)
    const hipKneeRatio = hipCenter.y / kneeCenter.y

    // 캘리브레이션 (처음 1.5초간 앉은 자세 기준 설정)
    if (duration < 1.5) {
      this.calibrationFrames.push(hipKneeRatio)
      return {
        count: 0,
        duration,
        state: 'calibrating',
        hipY: hipCenter.y,
        isCalibrated: false,
        isComplete: false,
      }
    }

    // 캘리브레이션 완료
    if (this.sittingThreshold === 0 && this.calibrationFrames.length > 0) {
      const avgRatio = this.calibrationFrames.reduce((a, b) => a + b, 0) / this.calibrationFrames.length
      this.sittingThreshold = avgRatio - 0.03 // 앉은 상태 기준
      this.standingThreshold = avgRatio - 0.15 // 선 상태 기준 (엉덩이가 더 위로)
      this.lastState = 'sitting'
    }

    // 상태 판단
    let currentState: 'sitting' | 'standing' | 'transitioning'
    if (hipKneeRatio < this.standingThreshold) {
      currentState = 'standing'
    } else if (hipKneeRatio > this.sittingThreshold) {
      currentState = 'sitting'
    } else {
      currentState = 'transitioning'
    }

    // 앉은 상태에서 선 상태로 전환 시 카운트 증가
    if (this.lastState === 'sitting' && currentState === 'standing') {
      this.chairStandCount++
    }

    this.lastState = currentState

    // 히스토리 저장
    this.hipYHistory.push({ y: hipCenter.y, timestamp: now })

    return {
      count: this.chairStandCount,
      duration,
      state: currentState,
      hipY: hipCenter.y,
      isCalibrated: true,
      isComplete: this.chairStandCount >= 5,
    }
  }

  // ==================== 포즈 유효성 검사 ====================

  isValidPose(landmarks: Landmark[]): boolean {
    if (!landmarks || landmarks.length < 33) return false

    const keyLandmarks = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ]

    return keyLandmarks.every(
      idx => landmarks[idx] && landmarks[idx].visibility > 0.5
    )
  }

  // 전신이 화면에 잘 들어오는지 확인
  isFullBodyVisible(landmarks: Landmark[]): {
    isVisible: boolean
    issues: string[]
  } {
    const issues: string[] = []

    if (!landmarks || landmarks.length < 33) {
      return { isVisible: false, issues: ['포즈를 감지할 수 없습니다'] }
    }

    // 머리가 화면 상단에 있는지
    const nose = landmarks[POSE_LANDMARKS.NOSE]
    if (nose.y > 0.3) {
      issues.push('머리가 화면 상단에 보이도록 해주세요')
    }

    // 발이 화면 하단에 있는지
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE]
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
    if (leftAnkle.y < 0.7 || rightAnkle.y < 0.7) {
      issues.push('발이 화면 하단에 보이도록 해주세요')
    }

    // 좌우 팔이 보이는지
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST]
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
    if (leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) {
      issues.push('양 팔이 보이도록 해주세요')
    }

    return {
      isVisible: issues.length === 0,
      issues,
    }
  }
}

// 싱글톤 인스턴스
let analyzerInstance: SPPBAnalyzer | null = null

export function getSPPBAnalyzer(): SPPBAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new SPPBAnalyzer()
  }
  return analyzerInstance
}

export function resetSPPBAnalyzer(): void {
  if (analyzerInstance) {
    analyzerInstance.reset()
  }
  analyzerInstance = new SPPBAnalyzer()
}
