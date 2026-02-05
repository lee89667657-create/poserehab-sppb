'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { usePatientGuideStore } from '@/stores/patient-guide-store'
import { useTranslation } from '@/hooks/use-translation'
import { useCamera } from '@/hooks/use-camera'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  User,
  Hand,
  Footprints,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Move,
  Target,
  Grip,
  CircleDot,
  Camera,
  CameraOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 가이드 아이콘 매핑
const GuideIcon = ({ iconType, className }: { iconType?: string; className?: string }) => {
  const iconClass = cn('w-full h-full', className)

  switch (iconType) {
    case 'stand-up':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <ArrowUp className="w-16 h-16 text-primary animate-bounce" />
          <User className="w-32 h-32 text-primary/80" />
        </div>
      )
    case 'standing':
      return <User className={cn(iconClass, 'text-primary')} />
    case 'sitting':
      return (
        <div className={cn('flex items-end justify-center', iconClass)}>
          <User className="w-32 h-32 text-primary/80 -rotate-12" />
        </div>
      )
    case 'sit-down':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <User className="w-32 h-32 text-primary/80" />
          <ArrowDown className="w-16 h-16 text-primary animate-bounce" />
        </div>
      )
    case 'transfer':
      return (
        <div className={cn('flex items-center justify-center gap-4', iconClass)}>
          <User className="w-24 h-24 text-primary/60" />
          <ArrowRight className="w-12 h-12 text-primary animate-pulse" />
          <User className="w-24 h-24 text-primary" />
        </div>
      )
    case 'eyes-closed':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-4', iconClass)}>
          <EyeOff className="w-20 h-20 text-primary" />
          <User className="w-28 h-28 text-primary/80" />
        </div>
      )
    case 'feet-together':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <User className="w-28 h-28 text-primary/80" />
          <Footprints className="w-16 h-16 text-primary" />
        </div>
      )
    case 'reach-forward':
      return (
        <div className={cn('flex items-center justify-center', iconClass)}>
          <User className="w-28 h-28 text-primary/80" />
          <ArrowRight className="w-16 h-16 text-primary animate-pulse" />
        </div>
      )
    case 'pick-up':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <User className="w-24 h-24 text-primary/80 rotate-12" />
          <ArrowDown className="w-12 h-12 text-primary animate-bounce" />
          <CircleDot className="w-10 h-10 text-primary" />
        </div>
      )
    case 'look-behind':
      return (
        <div className={cn('flex items-center justify-center gap-2', iconClass)}>
          <RotateCw className="w-16 h-16 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <User className="w-28 h-28 text-primary/80" />
        </div>
      )
    case 'turn-360':
      return (
        <div className={cn('flex items-center justify-center', iconClass)}>
          <div className="relative">
            <User className="w-28 h-28 text-primary/80" />
            <RotateCw className="absolute -top-4 -right-4 w-12 h-12 text-primary animate-spin" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      )
    case 'step-up':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <User className="w-24 h-24 text-primary/80" />
          <div className="flex gap-2">
            <Footprints className="w-10 h-10 text-primary" />
            <ArrowUp className="w-8 h-8 text-primary animate-bounce" />
          </div>
        </div>
      )
    case 'tandem':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <User className="w-28 h-28 text-primary/80" />
          <div className="flex flex-col">
            <Footprints className="w-8 h-8 text-primary" />
            <Footprints className="w-8 h-8 text-primary/60 -mt-2" />
          </div>
        </div>
      )
    case 'one-leg':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <User className="w-28 h-28 text-primary/80" />
          <Footprints className="w-10 h-10 text-primary" />
        </div>
      )
    // Hand Function icons
    case 'grip':
    case 'grasp':
      return <Grip className={cn(iconClass, 'text-primary')} />
    case 'lateral-pinch':
    case 'three-jaw':
    case 'tip-pinch':
    case 'pinch':
      return <Hand className={cn(iconClass, 'text-primary')} />
    case 'arm-forward':
      return (
        <div className={cn('flex items-center justify-center', iconClass)}>
          <User className="w-24 h-24 text-primary/80" />
          <ArrowUp className="w-12 h-12 text-primary rotate-45" />
        </div>
      )
    case 'arm-lateral':
      return (
        <div className={cn('flex items-center justify-center', iconClass)}>
          <ArrowLeft className="w-10 h-10 text-primary" />
          <User className="w-24 h-24 text-primary/80" />
          <ArrowRight className="w-10 h-10 text-primary" />
        </div>
      )
    case 'hand-head':
      return (
        <div className={cn('flex flex-col items-center justify-center', iconClass)}>
          <Hand className="w-12 h-12 text-primary -mb-2" />
          <User className="w-28 h-28 text-primary/80" />
        </div>
      )
    case 'hand-back':
      return (
        <div className={cn('flex items-center justify-center', iconClass)}>
          <User className="w-28 h-28 text-primary/80" />
          <Hand className="w-12 h-12 text-primary -ml-8 mt-8" />
        </div>
      )
    case 'cube':
      return (
        <div className={cn('flex items-center justify-center gap-4', iconClass)}>
          <div className="w-12 h-12 border-4 border-primary bg-primary/20 rounded" />
          <ArrowRight className="w-10 h-10 text-primary animate-pulse" />
          <div className="w-12 h-12 border-4 border-primary/50 border-dashed rounded" />
        </div>
      )
    case 'pegboard':
      return (
        <div className={cn('flex flex-col items-center justify-center gap-2', iconClass)}>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={cn(
                'w-6 h-6 rounded-full border-2',
                i < 5 ? 'bg-primary border-primary' : 'border-primary/50'
              )} />
            ))}
          </div>
        </div>
      )
    case 'rom':
      return (
        <div className={cn('flex items-center justify-center', iconClass)}>
          <Move className="w-20 h-20 text-primary" />
          <Target className="w-28 h-28 text-primary/60 absolute" />
        </div>
      )
    default:
      return <User className={cn(iconClass, 'text-primary/60')} />
  }
}

export default function PatientGuidePage() {
  const { t, language } = useTranslation()
  const {
    currentGuide,
    isActive,
    timerSeconds,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer,
    tickTimer,
  } = usePatientGuideStore()

  const [mounted, setMounted] = useState(false)

  // 카메라 훅 (640x480)
  const { videoRef, isStreaming, error: cameraError, startCamera, stopCamera } = useCamera({
    width: 640,
    height: 480,
  })

  // 타이머 틱
  useEffect(() => {
    if (!isTimerRunning) return

    const interval = setInterval(() => {
      tickTimer()
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, tickTimer])

  useEffect(() => {
    setMounted(true)
  }, [])

  // 페이지 진입 시 자동으로 카메라 시작
  useEffect(() => {
    if (mounted) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [mounted, startCamera, stopCamera])

  // 타이머 포맷팅
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 음성 안내 (Web Speech API)
  const speakGuide = useCallback(() => {
    if (!currentGuide) return

    const text = language === 'ko' ? currentGuide.instruction : currentGuide.instructionEn

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'ko' ? 'ko-KR' : 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }, [currentGuide, language])

  if (!mounted) return null

  // 카메라 영역 (왼쪽 패널 - 공유)
  const cameraPanel = (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
          {cameraError ? (
            <>
              <CameraOff className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-400 text-lg text-center px-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors"
              >
                {language === 'ko' ? '다시 시도' : 'Retry'}
              </button>
            </>
          ) : (
            <>
              <Camera className="w-16 h-16 text-gray-400 mb-4 animate-pulse" />
              <p className="text-gray-400 text-lg">
                {language === 'ko' ? '카메라 연결 중...' : 'Connecting camera...'}
              </p>
            </>
          )}
        </div>
      )}
      {/* LIVE 배지 */}
      {isStreaming && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white text-sm">LIVE</span>
        </div>
      )}
    </div>
  )

  return (
    <MainLayout>
      {/* 모바일: 세로 배치 / 데스크탑: 가로 배치 */}
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
        {/* 왼쪽: 카메라 미러링 (전신 세로) */}
        <div className="h-[40vh] lg:h-full lg:w-1/2 flex-shrink-0">
          {cameraPanel}
        </div>

        {/* 오른쪽: 가이드 영역 */}
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {!isActive || !currentGuide ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8"
              >
                <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                  {language === 'ko' ? 'BBS 균형 검사' : 'BBS Balance Test'}
                </h1>
                <p className="text-2xl lg:text-3xl text-text-secondary">
                  {language === 'ko'
                    ? '대기 중... 치료사가 검사 항목을 선택하면 가이드가 표시됩니다'
                    : 'Waiting... Guide will appear when therapist selects a test item'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* 가이드 콘텐츠 (세로 중앙 정렬) */}
                <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                  <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
                    {/* 검사 유형 라벨 */}
                    <div className="text-lg lg:text-xl text-primary font-medium">
                      {currentGuide.type === 'bbs' && (language === 'ko' ? 'BBS 균형 검사' : 'BBS Balance Test')}
                      {currentGuide.type === 'rom' && (language === 'ko' ? 'ROM 관절가동범위' : 'ROM Range of Motion')}
                      {currentGuide.type === 'handFunction' && (language === 'ko' ? '손 기능 검사' : 'Hand Function Test')}
                    </div>

                    {/* 항목 제목 */}
                    <h1 className="text-3xl lg:text-5xl font-bold text-text-primary text-center">
                      {language === 'ko' ? currentGuide.title : currentGuide.titleEn}
                    </h1>

                    {/* 가이드 아이콘 */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-40 h-40 lg:w-52 lg:h-52 flex items-center justify-center"
                    >
                      <GuideIcon iconType={currentGuide.icon} className="w-full h-full" />
                    </motion.div>

                    {/* 가이드 텍스트 */}
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl lg:text-5xl font-medium text-text-primary leading-relaxed text-center"
                    >
                      &ldquo;{language === 'ko' ? currentGuide.instruction : currentGuide.instructionEn}&rdquo;
                    </motion.p>
                  </div>
                </div>

                {/* 하단: 타이머 + 음성 안내 */}
                <div className="bg-surface border-t border-border py-4 lg:py-6 px-6">
                  <div className="flex items-center justify-center gap-4 lg:gap-6 flex-wrap">
                    {/* 음성 안내 버튼 */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={speakGuide}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Volume2 className="w-6 h-6" />
                      <span className="text-lg font-medium">
                        {language === 'ko' ? '음성 안내' : 'Voice Guide'}
                      </span>
                    </motion.button>

                    {/* 타이머 */}
                    {currentGuide.duration && currentGuide.duration > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="bg-background rounded-2xl px-6 py-3 border border-border">
                          <span className={cn(
                            'text-4xl lg:text-5xl font-mono font-bold',
                            timerSeconds <= 10 && timerSeconds > 0 ? 'text-red-500' : 'text-text-primary'
                          )}>
                            {formatTime(timerSeconds)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {!isTimerRunning ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={startTimer}
                              disabled={timerSeconds === 0}
                              className={cn(
                                'p-3 rounded-xl transition-colors',
                                timerSeconds === 0
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              )}
                            >
                              <Play className="w-7 h-7" />
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={stopTimer}
                              className="p-3 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                            >
                              <Pause className="w-7 h-7" />
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={resetTimer}
                            className="p-3 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                          >
                            <RotateCcw className="w-7 h-7" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  )
}
