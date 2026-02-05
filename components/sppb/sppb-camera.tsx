'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { GaitSkeleton } from '@/components/gait/gait-skeleton'
import { useCamera } from '@/hooks/use-camera'
import { usePoseDetection } from '@/hooks/use-pose-detection'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import type { Landmark } from '@/types/posture'

interface SPPBCameraProps {
  isActive: boolean
  testType: 'balance' | 'gait' | 'chair'
  onFrame?: (landmarks: Landmark[], timestamp: number) => void
  showSkeleton?: boolean
  showGuide?: boolean
  overlayContent?: React.ReactNode
}

export function SPPBCamera({
  isActive,
  testType,
  onFrame,
  showSkeleton = true,
  showGuide = true,
  overlayContent,
}: SPPBCameraProps) {
  const { language } = useTranslation()
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const lastFrameTimeRef = useRef<number>(0)

  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 })
  const [fps, setFps] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)

  // 카메라 훅
  const {
    videoRef,
    isStreaming,
    error: cameraError,
    startCamera,
  } = useCamera()

  // MediaPipe Pose 훅
  const {
    isLoading: isModelLoading,
    isReady: isModelReady,
    error: modelError,
    landmarks,
    loadModel,
    startDetection,
    stopDetection,
  } = usePoseDetection({
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  // 비디오 크기 업데이트
  const updateVideoDimensions = useCallback((video: HTMLVideoElement) => {
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }
  }, [])

  // 웹캠 시작 & 모델 프리로드
  useEffect(() => {
    let isMounted = true

    const initializeCamera = async () => {
      setIsInitializing(true)
      console.log('[SPPBCamera] Starting camera initialization...')

      try {
        // 카메라와 모델을 동시에 로드
        await Promise.all([
          startCamera(),
          loadModel()
        ])
        if (isMounted) {
          console.log('[SPPBCamera] Camera and model ready')
          const video = videoRef.current
          if (video) {
            console.log('[SPPBCamera] Video element state:', {
              hasSrcObject: !!video.srcObject,
              readyState: video.readyState,
              paused: video.paused,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            })
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[SPPBCamera] Initialization error:', err)
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeCamera()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 비디오 메타데이터 로드
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      updateVideoDimensions(video)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    if (video.readyState >= 1) {
      updateVideoDimensions(video)
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoRef, updateVideoDimensions])

  // 감지 상태 추적 ref
  const isDetectionRunningRef = useRef(false)

  // 웹캠 분석 - isActive가 true가 되면 시작
  useEffect(() => {
    const video = videoRef.current
    const shouldDetect = isActive && isStreaming && isModelReady && !!video

    console.log('[SPPBCamera] Detection effect:', {
      isActive,
      isStreaming,
      isModelReady,
      hasVideo: !!video,
      shouldDetect,
      isCurrentlyDetecting: isDetectionRunningRef.current
    })

    if (shouldDetect && !isDetectionRunningRef.current) {
      console.log('[SPPBCamera] Starting detection...')
      isDetectionRunningRef.current = true
      startDetection(video)
    } else if (!shouldDetect && isDetectionRunningRef.current) {
      console.log('[SPPBCamera] Stopping detection...')
      isDetectionRunningRef.current = false
      stopDetection()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isStreaming, isModelReady])

  // 컴포넌트 언마운트 시에만 클린업
  useEffect(() => {
    return () => {
      if (isDetectionRunningRef.current) {
        console.log('[SPPBCamera] Unmount cleanup: stopping detection')
        isDetectionRunningRef.current = false
        stopDetection()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 랜드마크 처리
  useEffect(() => {
    if (landmarks && landmarks.length > 0 && isActive) {
      const now = performance.now()

      if (lastFrameTimeRef.current > 0) {
        const elapsed = now - lastFrameTimeRef.current
        setFps(Math.round(1000 / elapsed))
      }

      onFrame?.(landmarks, now)
      lastFrameTimeRef.current = now
    }
  }, [landmarks, isActive, onFrame])

  const error = cameraError || modelError
  const showLoadingOverlay = isModelLoading || isInitializing

  // 가이드 정보
  const guideInfo = getGuideInfo(testType, language)

  return (
    <div className="space-y-4">
      {/* 비디오 영역 */}
      <div
        ref={videoContainerRef}
        className="bg-black relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border"
      >
        {/* 로딩 오버레이 */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-white">
              {isInitializing
                ? language === 'ko' ? '카메라 초기화 중...' : 'Initializing camera...'
                : language === 'ko' ? 'AI 모델 로딩 중...' : 'Loading AI model...'}
            </span>
          </div>
        )}

        {/* 에러 표시 */}
        {error && !showLoadingOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
            <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
            <span className="text-sm text-white">{error}</span>
          </div>
        )}

        {/* 웹캠 비디오 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: testType === 'balance' ? 'scaleX(-1)' : 'none' }}
        />

        {/* 가이드 실루엣 (항상 표시) */}
        {showGuide && isStreaming && !showLoadingOverlay && (
          <GuideSilhouette testType={testType} language={language} isActive={isActive} />
        )}

        {/* 스켈레톤 오버레이 */}
        {showSkeleton && landmarks && landmarks.length > 0 && (
          <div
            className="absolute inset-0 z-10"
            style={{ transform: testType === 'balance' ? 'scaleX(-1)' : 'none' }}
          >
            <GaitSkeleton
              landmarks={landmarks}
              videoWidth={videoDimensions.width}
              videoHeight={videoDimensions.height}
              containerRef={videoContainerRef}
              mirrored={false}
            />
          </div>
        )}

        {/* 커스텀 오버레이 */}
        {overlayContent && (
          <div className="absolute inset-0 z-15 pointer-events-none">
            {overlayContent}
          </div>
        )}

        {/* FPS & 상태 표시 */}
        {isActive && (
          <>
            <div className="absolute left-3 top-3 z-30 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white">
              {fps} FPS
            </div>
            <motion.div
              className="absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="h-2 w-2 rounded-full bg-white" />
              <span className="text-sm font-medium text-white">
                {language === 'ko' ? '측정 중' : 'Recording'}
              </span>
            </motion.div>
          </>
        )}

        {/* 포즈 감지 상태 */}
        {isActive && (
          <div
            className={cn(
              'absolute bottom-3 left-3 z-30 rounded-lg px-2 py-1 text-xs font-medium text-white',
              landmarks && landmarks.length > 0 ? 'bg-emerald-500/80' : 'bg-amber-500/80'
            )}
          >
            {landmarks && landmarks.length > 0
              ? language === 'ko' ? '포즈 감지됨' : 'Pose Detected'
              : language === 'ko' ? '포즈 감지 중...' : 'Detecting pose...'}
          </div>
        )}
      </div>

      {/* 촬영 가이드 */}
      {!isActive && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              {guideInfo.icon}
            </div>
            <div>
              <h4 className="text-text-primary font-medium">{guideInfo.title}</h4>
              <ul className="mt-2 text-text-secondary text-sm space-y-1">
                {guideInfo.instructions.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 가이드 실루엣 컴포넌트
function GuideSilhouette({
  testType,
  language,
  isActive = false,
}: {
  testType: 'balance' | 'gait' | 'chair'
  language: string
  isActive?: boolean
}) {
  // 검사 중에는 더 투명하게
  const opacity = isActive ? 'opacity-15' : 'opacity-30'

  const silhouettes = {
    balance: (
      // 정면 서있는 자세
      <svg viewBox="0 0 100 200" className={cn('h-full w-auto', opacity)}>
        <ellipse cx="50" cy="20" rx="12" ry="15" fill="white" /> {/* 머리 */}
        <line x1="50" y1="35" x2="50" y2="100" stroke="white" strokeWidth="4" /> {/* 몸통 */}
        <line x1="50" y1="50" x2="25" y2="80" stroke="white" strokeWidth="3" /> {/* 왼팔 */}
        <line x1="50" y1="50" x2="75" y2="80" stroke="white" strokeWidth="3" /> {/* 오른팔 */}
        <line x1="50" y1="100" x2="35" y2="160" stroke="white" strokeWidth="4" /> {/* 왼다리 */}
        <line x1="50" y1="100" x2="65" y2="160" stroke="white" strokeWidth="4" /> {/* 오른다리 */}
        <ellipse cx="35" cy="165" rx="8" ry="4" fill="white" /> {/* 왼발 */}
        <ellipse cx="65" cy="165" rx="8" ry="4" fill="white" /> {/* 오른발 */}
      </svg>
    ),
    gait: (
      // 측면 걷는 자세
      <svg viewBox="0 0 200 200" className={cn('h-full w-auto', opacity)}>
        {/* 시작점 */}
        <line x1="30" y1="170" x2="30" y2="190" stroke="lime" strokeWidth="2" strokeDasharray="5,5" />
        <text x="25" y="198" fill="lime" fontSize="8">START</text>
        {/* 끝점 */}
        <line x1="170" y1="170" x2="170" y2="190" stroke="lime" strokeWidth="2" strokeDasharray="5,5" />
        <text x="165" y="198" fill="lime" fontSize="8">END</text>
        {/* 화살표 */}
        <line x1="50" y1="180" x2="150" y2="180" stroke="white" strokeWidth="2" markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="white" />
          </marker>
        </defs>
        {/* 사람 (측면) */}
        <ellipse cx="100" cy="30" rx="10" ry="12" fill="white" />
        <path d="M100,42 Q95,70 100,100" stroke="white" strokeWidth="4" fill="none" />
        <line x1="100" y1="55" x2="85" y2="75" stroke="white" strokeWidth="3" />
        <line x1="100" y1="55" x2="115" y2="70" stroke="white" strokeWidth="3" />
        <path d="M100,100 Q90,130 85,160" stroke="white" strokeWidth="4" fill="none" />
        <path d="M100,100 Q110,130 120,155" stroke="white" strokeWidth="4" fill="none" />
      </svg>
    ),
    chair: (
      // 측면 의자에 앉은 자세
      <svg viewBox="0 0 150 200" className={cn('h-full w-auto', opacity)}>
        {/* 의자 */}
        <rect x="40" y="120" width="60" height="8" fill="gray" /> {/* 좌석 */}
        <rect x="90" y="80" width="8" height="100" fill="gray" /> {/* 등받이 */}
        <rect x="40" y="128" width="8" height="50" fill="gray" /> {/* 왼쪽 다리 */}
        <rect x="90" y="128" width="8" height="50" fill="gray" /> {/* 오른쪽 다리 */}
        {/* 앉은 사람 */}
        <ellipse cx="70" cy="55" rx="12" ry="14" fill="white" /> {/* 머리 */}
        <path d="M70,69 L70,120" stroke="white" strokeWidth="4" /> {/* 상체 */}
        <line x1="70" y1="85" x2="55" y2="105" stroke="white" strokeWidth="3" /> {/* 팔 */}
        <path d="M70,120 L50,125 L50,175" stroke="white" strokeWidth="4" fill="none" /> {/* 다리 */}
        <ellipse cx="50" cy="180" rx="10" ry="4" fill="white" /> {/* 발 */}
      </svg>
    ),
  }

  return (
    <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
      <div className="h-3/4 flex items-center justify-center">
        {silhouettes[testType]}
      </div>
      {/* 가이드 텍스트 - 검사 전에만 표시 */}
      {!isActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 text-center text-sm text-white">
          {testType === 'balance' && (language === 'ko' ? '실루엣에 맞춰 서주세요' : 'Align with the silhouette')}
          {testType === 'gait' && (language === 'ko' ? '측면에서 걷는 모습이 보이게 해주세요' : 'Show your side profile while walking')}
          {testType === 'chair' && (language === 'ko' ? '의자와 함께 측면이 보이게 해주세요' : 'Show your side profile with the chair')}
        </div>
      )}
    </div>
  )
}

// 가이드 정보
function getGuideInfo(testType: 'balance' | 'gait' | 'chair', language: string) {
  const guides = {
    balance: {
      icon: '⚖️',
      title: language === 'ko' ? '균형 검사 촬영 가이드' : 'Balance Test Guide',
      instructions: language === 'ko'
        ? [
            '카메라에서 약 2m 거리에 서주세요',
            '전신이 화면에 나오도록 정면을 보세요',
            '양 팔은 편안하게 옆에 두세요',
            '검사 시작 후 10초간 자세를 유지하세요',
          ]
        : [
            'Stand about 2m from the camera',
            'Face the camera with your full body visible',
            'Keep your arms relaxed at your sides',
            'Hold the position for 10 seconds after starting',
          ],
    },
    gait: {
      icon: '🚶',
      title: language === 'ko' ? '보행 속도 검사 안내' : 'Gait Speed Test Guide',
      instructions: language === 'ko'
        ? [
            '바닥에 4m 거리를 테이프로 표시해주세요',
            '시작선에 환자를 세워주세요',
            '카메라는 측면에서 촬영 (전신 안 보여도 됨)',
            '검사자가 시작/종료 버튼으로 시간 측정',
          ]
        : [
            'Mark 4m distance on the floor with tape',
            'Position patient at the start line',
            'Camera on the side (full body not required)',
            'Examiner measures time with start/stop buttons',
          ],
    },
    chair: {
      icon: '🪑',
      title: language === 'ko' ? '의자 일어나기 검사 안내' : 'Chair Stand Test Guide',
      instructions: language === 'ko'
        ? [
            '의자에 앉은 상태에서 시작하세요',
            '팔짱을 끼고 5회 일어났다 앉기',
            '측정자가 5회 완료 시 종료 버튼 클릭',
            '카메라는 참고용 (자동 감지 없음)',
          ]
        : [
            'Start in a seated position',
            'Stand up and sit down 5 times with arms crossed',
            'Examiner clicks stop after 5 reps',
            'Camera is for reference only (no auto-detection)',
          ],
    },
  }

  return guides[testType]
}
