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
  landmarksRef: React.MutableRefObject<Landmark[]>
  fps: number
  loadModel: () => Promise<void>
  detectPose: (videoElement: HTMLVideoElement) => void
  detectPoseFromImage: (imageElement: HTMLImageElement | HTMLCanvasElement) => Promise<Landmark[]>
  startDetection: (videoElement: HTMLVideoElement) => void
  stopDetection: () => void
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}): UsePoseDetectionReturn {
  const {
    onResults,
    modelComplexity = 0,
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [fps, setFps] = useState(0)

  const poseRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isDetectingRef = useRef(false)
  const isInitializingRef = useRef(false)

  // Performance optimization refs
  const landmarksRef = useRef<Landmark[]>([])
  const isProcessingRef = useRef(false)
  const lastStateUpdateRef = useRef(0)
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 })
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable ref for onResults callback to avoid stale closures
  const onResultsRef = useRef(onResults)
  onResultsRef.current = onResults

  // 추적 안정성을 위한 이전 사람 정보 저장
  const lastPersonCenterRef = useRef<{ x: number; y: number } | null>(null)
  const lastPersonSizeRef = useRef<number>(0)
  const stableFrameCountRef = useRef(0)
  const rejectedFrameCountRef = useRef(0)

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

  // 몸 크기 계산 (어깨 너비 + 몸통 높이)
  const calculateBodySize = useCallback((poseLandmarks: any[]): number => {
    const leftShoulder = poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER]
    const rightShoulder = poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const leftHip = poseLandmarks[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = poseLandmarks[POSE_LANDMARKS.RIGHT_HIP]

    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x)
    const torsoHeight = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2)

    return shoulderWidth + torsoHeight
  }, [])

  // 주요 랜드마크의 평균 visibility
  const calculateVisibility = useCallback((poseLandmarks: any[]): number => {
    const keyIndices = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
    ]
    const visibilities = keyIndices.map(i => poseLandmarks[i]?.visibility || 0)
    return visibilities.reduce((a, b) => a + b, 0) / visibilities.length
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

  // 감지된 사람이 유효한지 확인
  const shouldAcceptPerson = useCallback((poseLandmarks: any[]): boolean => {
    const currentCenter = calculatePersonCenter(poseLandmarks)
    const currentSize = calculateBodySize(poseLandmarks)
    const visibility = calculateVisibility(poseLandmarks)
    const distanceFromScreenCenter = getDistanceFromCenter(currentCenter)

    if (typeof window !== 'undefined' && (window as any).__POSE_DEBUG__) {
      console.log('[Pose] Person check:', {
        visibility: visibility.toFixed(2),
        distanceFromCenter: distanceFromScreenCenter.toFixed(2),
        bodySize: currentSize.toFixed(2),
        center: { x: currentCenter.x.toFixed(2), y: currentCenter.y.toFixed(2) }
      })
    }

    if (visibility < 0.3) return false
    if (distanceFromScreenCenter > 0.5) return false
    if (currentSize < 0.08) return false

    if (!lastPersonCenterRef.current) {
      lastPersonCenterRef.current = currentCenter
      lastPersonSizeRef.current = currentSize
      stableFrameCountRef.current = 1
      rejectedFrameCountRef.current = 0
      return true
    }

    const distanceFromLastPerson = getDistance(currentCenter, lastPersonCenterRef.current)

    if (distanceFromLastPerson > 0.12) {
      rejectedFrameCountRef.current++
      if (rejectedFrameCountRef.current > 30) {
        const lastDistanceFromCenter = getDistanceFromCenter(lastPersonCenterRef.current)
        if (distanceFromScreenCenter < lastDistanceFromCenter && currentSize >= lastPersonSizeRef.current * 0.7) {
          lastPersonCenterRef.current = currentCenter
          lastPersonSizeRef.current = currentSize
          stableFrameCountRef.current = 1
          rejectedFrameCountRef.current = 0
          return true
        }
      }
      return false
    }

    if (currentSize < lastPersonSizeRef.current * 0.5) {
      rejectedFrameCountRef.current++
      return false
    }

    lastPersonCenterRef.current = {
      x: lastPersonCenterRef.current.x * 0.7 + currentCenter.x * 0.3,
      y: lastPersonCenterRef.current.y * 0.7 + currentCenter.y * 0.3,
    }
    lastPersonSizeRef.current = lastPersonSizeRef.current * 0.8 + currentSize * 0.2
    stableFrameCountRef.current++
    rejectedFrameCountRef.current = 0
    return true
  }, [calculatePersonCenter, calculateBodySize, calculateVisibility, getDistanceFromCenter, getDistance])

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

    console.log('[Pose] Initializing MediaPipe Pose (complexity:', modelComplexity, ')...')

    try {
      await loadMediaPipeScript()

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
          if (!shouldAcceptPerson(results.poseLandmarks)) {
            return
          }

          const processed = processLandmarks(results.poseLandmarks)

          // Always update ref immediately (no React re-render)
          landmarksRef.current = processed

          // FPS tracking
          fpsCounterRef.current.frames++

          // Throttle React state update to reduce re-renders (~10fps)
          const now = performance.now()
          if (now - lastStateUpdateRef.current >= 100) {
            lastStateUpdateRef.current = now
            setLandmarks(processed)
          }

          onResultsRef.current?.(processed)
        }
      })

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
  }, [modelComplexity, minDetectionConfidence, minTrackingConfidence, processLandmarks, shouldAcceptPerson])

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

        const handleResult = (results: any) => {
          if (results.poseLandmarks) {
            const processed = processLandmarks(results.poseLandmarks)
            landmarksRef.current = processed
            setLandmarks(processed)
            onResultsRef.current?.(processed)
            resolve(processed)
          } else {
            resolve([])
          }
        }

        poseRef.current.onResults(handleResult)
        poseRef.current.send({ image: imageElement }).catch(() => {
          resolve([])
        })
      })
    },
    [initializePose, processLandmarks]
  )

  // Continuous detection - OPTIMIZED (non-blocking rAF loop)
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
        isProcessingRef.current = false
        console.log('[Pose] Detection loop started')

        // Start FPS counter
        fpsCounterRef.current = { frames: 0, lastTime: performance.now() }
        if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current)
        fpsIntervalRef.current = setInterval(() => {
          const now = performance.now()
          const elapsed = (now - fpsCounterRef.current.lastTime) / 1000
          if (elapsed > 0) {
            const currentFps = Math.round(fpsCounterRef.current.frames / elapsed)
            setFps(currentFps)
            console.log(`[Pose] FPS: ${currentFps}`)
            fpsCounterRef.current = { frames: 0, lastTime: now }
          }
        }, 2000)

        // Non-blocking detection loop
        // rAF runs at display refresh rate; frames are sent only when previous completes
        const detect = () => {
          if (!isDetectingRef.current) return

          if (!isProcessingRef.current && poseRef.current && videoElement.readyState >= 2) {
            isProcessingRef.current = true
            poseRef.current.send({ image: videoElement })
              .finally(() => { isProcessingRef.current = false })
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
    isProcessingRef.current = false

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Stop FPS counter
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current)
      fpsIntervalRef.current = null
    }
    setFps(0)

    // 추적 상태 리셋
    lastPersonCenterRef.current = null
    lastPersonSizeRef.current = 0
    stableFrameCountRef.current = 0
    rejectedFrameCountRef.current = 0
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
    landmarksRef,
    fps,
    loadModel,
    detectPose,
    detectPoseFromImage,
    startDetection,
    stopDetection,
  }
}
