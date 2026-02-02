'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Landmark } from '@/types/posture'

// MediaPipe landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

// CDN URL for MediaPipe - using stable version
const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635988162'

// Global script loading state
let scriptLoadPromise: Promise<void> | null = null
let isScriptLoaded = false

// Load MediaPipe script from CDN
function loadMediaPipeScript(): Promise<void> {
  if (isScriptLoaded) {
    return Promise.resolve()
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  console.log('[Pose] Loading MediaPipe Pose script...')

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).Pose) {
      console.log('[Pose] Already loaded from window')
      isScriptLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `${MEDIAPIPE_CDN}/pose.js`
    script.crossOrigin = 'anonymous'

    script.onload = () => {
      console.log('[Pose] Script loaded successfully')
      isScriptLoaded = true
      resolve()
    }

    script.onerror = (err) => {
      console.error('[Pose] Script load error:', err)
      scriptLoadPromise = null
      reject(new Error('Failed to load MediaPipe Pose script'))
    }

    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

interface UsePoseDetectionOptions {
  onResults?: (landmarks: Landmark[]) => void
  modelComplexity?: 0 | 1 | 2
  minDetectionConfidence?: number
  minTrackingConfidence?: number
}

interface UsePoseDetectionReturn {
  isLoading: boolean
  isReady: boolean
  error: string | null
  landmarks: Landmark[]
  loadModel: () => Promise<void>
  detectPose: (videoElement: HTMLVideoElement) => void
  detectPoseFromImage: (imageElement: HTMLImageElement | HTMLCanvasElement) => Promise<Landmark[]>
  startDetection: (videoElement: HTMLVideoElement) => void
  stopDetection: () => void
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}): UsePoseDetectionReturn {
  const {
    onResults,
    modelComplexity = 1,
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [landmarks, setLandmarks] = useState<Landmark[]>([])

  const poseRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isDetectingRef = useRef(false)
  const isInitializingRef = useRef(false)

  // 추적 안정성을 위한 이전 사람 위치 저장
  const lastPersonCenterRef = useRef<{ x: number; y: number } | null>(null)
  const stableFrameCountRef = useRef(0)

  // 사람의 중심점 계산 (어깨와 엉덩이의 중간)
  const calculatePersonCenter = useCallback((poseLandmarks: any[]): { x: number; y: number } => {
    const leftShoulder = poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER]
    const rightShoulder = poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const leftHip = poseLandmarks[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = poseLandmarks[POSE_LANDMARKS.RIGHT_HIP]

    const centerX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4
    const centerY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4

    return { x: centerX, y: centerY }
  }, [])

  // 화면 중앙(0.5, 0.5)과의 거리 계산
  const getDistanceFromCenter = useCallback((center: { x: number; y: number }): number => {
    const dx = center.x - 0.5
    const dy = center.y - 0.5
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // 두 점 사이의 거리
  const getDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // 감지된 사람이 유효한지 확인 (화면 중앙 기준 추적)
  const shouldAcceptPerson = useCallback((poseLandmarks: any[]): boolean => {
    const currentCenter = calculatePersonCenter(poseLandmarks)
    const distanceFromScreenCenter = getDistanceFromCenter(currentCenter)

    // 화면 중앙에서 너무 먼 사람은 무시 (화면의 40% 이상 떨어진 경우)
    if (distanceFromScreenCenter > 0.4) {
      return false
    }

    // 이전에 추적 중인 사람이 없으면 수락
    if (!lastPersonCenterRef.current) {
      lastPersonCenterRef.current = currentCenter
      stableFrameCountRef.current = 1
      return true
    }

    // 이전 사람과의 거리
    const distanceFromLastPerson = getDistance(currentCenter, lastPersonCenterRef.current)

    // 위치가 갑자기 크게 변했으면 (다른 사람으로 전환된 것으로 추정)
    if (distanceFromLastPerson > 0.15) {
      // 현재 사람이 화면 중앙에 더 가까우면 새 사람으로 전환
      const lastDistanceFromCenter = getDistanceFromCenter(lastPersonCenterRef.current)
      if (distanceFromScreenCenter < lastDistanceFromCenter) {
        lastPersonCenterRef.current = currentCenter
        stableFrameCountRef.current = 1
        return true
      }
      // 그렇지 않으면 무시 (이전 사람 유지)
      return false
    }

    // 정상적인 움직임 - 위치 업데이트
    // 스무딩 적용하여 급격한 변화 방지
    lastPersonCenterRef.current = {
      x: lastPersonCenterRef.current.x * 0.7 + currentCenter.x * 0.3,
      y: lastPersonCenterRef.current.y * 0.7 + currentCenter.y * 0.3,
    }
    stableFrameCountRef.current++
    return true
  }, [calculatePersonCenter, getDistanceFromCenter, getDistance])

  // Process landmarks helper
  const processLandmarks = useCallback((poseLandmarks: any[]): Landmark[] => {
    return poseLandmarks.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility,
    }))
  }, [])

  // Initialize MediaPipe Pose
  const initializePose = useCallback(async () => {
    if (poseRef.current || isInitializingRef.current) return

    isInitializingRef.current = true
    setIsLoading(true)
    setError(null)

    console.log('[Pose] Initializing MediaPipe Pose...')

    try {
      // Load script from CDN
      await loadMediaPipeScript()

      // Access Pose from global window
      const PoseClass = (window as any).Pose
      if (!PoseClass) {
        throw new Error('MediaPipe Pose class not found')
      }

      console.log('[Pose] Creating Pose instance...')

      const pose = new PoseClass({
        locateFile: (file: string) => {
          const url = `${MEDIAPIPE_CDN}/${file}`
          console.log('[Pose] Loading file:', file)
          return url
        },
      })

      pose.setOptions({
        modelComplexity,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence,
        minTrackingConfidence,
      })

      pose.onResults((results: any) => {
        if (results.poseLandmarks) {
          // 화면 중앙에 가장 가까운 사람만 추적
          if (!shouldAcceptPerson(results.poseLandmarks)) {
            return // 다른 사람으로 전환된 것으로 판단되면 무시
          }
          const processed = processLandmarks(results.poseLandmarks)
          setLandmarks(processed)
          onResults?.(processed)
        }
      })

      // Wait for model to initialize with timeout
      console.log('[Pose] Waiting for model initialization...')
      await Promise.race([
        pose.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Pose initialization timeout')), 30000)
        )
      ])

      poseRef.current = pose
      setIsReady(true)
      console.log('[Pose] MediaPipe Pose ready!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize pose detection'
      setError(errorMessage)
      console.error('[Pose] Initialization error:', err)
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }, [modelComplexity, minDetectionConfidence, minTrackingConfidence, onResults, processLandmarks, shouldAcceptPerson])

  // Preload model without starting detection
  const loadModel = useCallback(async () => {
    if (poseRef.current || isInitializingRef.current) return
    await initializePose()
  }, [initializePose])

  // Single frame detection
  const detectPose = useCallback(
    async (videoElement: HTMLVideoElement) => {
      if (!poseRef.current) {
        await initializePose()
      }

      if (poseRef.current && videoElement.readyState >= 2) {
        try {
          await poseRef.current.send({ image: videoElement })
        } catch (err) {
          console.error('Pose detection error:', err)
        }
      }
    },
    [initializePose]
  )

  // Image detection - returns landmarks from a single image
  const detectPoseFromImage = useCallback(
    async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<Landmark[]> => {
      if (!poseRef.current) {
        await initializePose()
      }

      return new Promise((resolve) => {
        if (!poseRef.current) {
          resolve([])
          return
        }

        // Set up one-time result handler
        const handleResult = (results: any) => {
          if (results.poseLandmarks) {
            const processed = processLandmarks(results.poseLandmarks)
            setLandmarks(processed)
            onResults?.(processed)
            resolve(processed)
          } else {
            resolve([])
          }
        }

        // Temporarily set result handler for this detection
        poseRef.current.onResults(handleResult)

        // Send image for detection
        poseRef.current.send({ image: imageElement }).catch(() => {
          resolve([])
        })
      })
    },
    [initializePose, onResults, processLandmarks]
  )

  // Continuous detection
  const startDetection = useCallback(
    async (videoElement: HTMLVideoElement) => {
      console.log('[Pose] Starting detection...')

      try {
        if (!poseRef.current) {
          console.log('[Pose] Model not ready, initializing...')
          await initializePose()
        }

        if (!poseRef.current) {
          console.error('[Pose] Failed to initialize model')
          return
        }

        isDetectingRef.current = true
        console.log('[Pose] Detection loop started')

        const detect = async () => {
          if (!isDetectingRef.current) return

          if (poseRef.current && videoElement.readyState >= 2) {
            try {
              await poseRef.current.send({ image: videoElement })
            } catch (err) {
              // Ignore send errors during continuous detection
            }
          }

          if (isDetectingRef.current) {
            animationFrameRef.current = requestAnimationFrame(detect)
          }
        }

        detect()
      } catch (err) {
        console.error('[Pose] startDetection error:', err)
        setError(err instanceof Error ? err.message : 'Failed to start pose detection')
      }
    },
    [initializePose]
  )

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    // 추적 상태 리셋
    lastPersonCenterRef.current = null
    stableFrameCountRef.current = 0
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      stopDetection()
      if (poseRef.current) {
        try {
          poseRef.current.close()
        } catch (e) {
          // Ignore close errors
        }
        poseRef.current = null
      }
    }
  }, [stopDetection])

  return {
    isLoading,
    isReady,
    error,
    landmarks,
    loadModel,
    detectPose,
    detectPoseFromImage,
    startDetection,
    stopDetection,
  }
}
