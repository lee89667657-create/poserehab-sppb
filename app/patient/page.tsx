'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePatientGuideStore } from '@/stores/patient-guide-store'
import { useUserStore } from '@/stores/user-store'
import { useBBSStore } from '@/stores/bbs-store'
import { useRomStore } from '@/stores/rom-store'
import { useHandFunctionStore } from '@/stores/hand-function-store'
import { useFACStore } from '@/stores/fac-store'
import { useMBIStore } from '@/stores/mbi-store'
import { useMMTStore } from '@/stores/mmt-store'
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
  Activity,
  BookOpen,
  TrendingUp,
  Shield,
  Sparkles,
  Smile,
  PersonStanding,
  HeartHandshake,
  Dumbbell,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  ListChecks,
  SkipForward,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts'

// ─── 탭 타입 ───
type TabType = 'status' | 'guide' | 'progress'

// ─── 가이드 아이콘 매핑 (기존 patient-guide에서 이동) ───
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

// ─── 평가 카드 컴포넌트 (컴팩트) ───
function AssessmentCard({
  icon: Icon,
  title,
  toolName,
  hasData,
  delay,
  accentColor,
  children,
}: {
  icon: React.ElementType
  title: string
  toolName?: string
  hasData: boolean
  delay: number
  accentColor?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'rounded-xl overflow-hidden relative flex flex-col',
        hasData
          ? 'bg-gray-800/80 border border-border'
          : 'bg-surface/50 border-2 border-dashed border-border'
      )}
    >
      {hasData && accentColor && (
        <div className={cn('absolute left-0 top-0 bottom-0 w-1', accentColor)} />
      )}
      <div className={cn('p-3 flex-1 flex flex-col', hasData && accentColor && 'pl-4')}>
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className={cn('w-6 h-6', hasData ? 'text-primary' : 'text-text-secondary/40')} />
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          {toolName && (
            <span className="text-xs text-text-secondary/60 font-medium">({toolName})</span>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  )
}

// ─── 백분율 바 (컴팩트) ───
function PercentBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full h-2.5 bg-background rounded-full overflow-hidden mt-1.5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
  )
}

// ─── 미평가 메시지 (컴팩트) ───
function NotYetMessage({ language, icon: Icon }: { language: string; icon: React.ElementType }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <Icon className="w-10 h-10 text-text-secondary/25 mb-1.5" />
      <span className="text-base text-text-secondary">
        {language === 'ko' ? '아직 검사 전이에요' : 'Not yet tested'}
      </span>
      <span className="text-xs text-text-secondary/50 mt-0.5">
        {language === 'ko' ? '검사 후 결과를 확인할 수 있어요' : 'Results available after testing'}
      </span>
    </div>
  )
}

// ─── 내 현황 탭 ───
function StatusTab({ language }: { language: string }) {
  const { profile } = useUserStore()
  const { history: bbsHistory } = useBBSStore()
  const { sessions: romSessions } = useRomStore()
  const { history: handHistory } = useHandFunctionStore()
  const { history: facHistory } = useFACStore()
  const { history: mbiHistory } = useMBIStore()
  const { history: mmtHistory } = useMMTStore()

  const latestBBS = bbsHistory[0]
  const latestFAC = facHistory[0]
  const latestMBI = mbiHistory[0]
  const latestMMT = mmtHistory[0]
  const latestHand = handHistory[0]
  const latestROM = romSessions[0]

  // BBS: 56점 만점
  const bbsPercent = latestBBS ? Math.round((latestBBS.totalScore / 56) * 100) : 0
  const bbsMessage = language === 'ko'
    ? bbsPercent >= 80 ? '균형 능력이 좋아요!' : bbsPercent >= 40 ? '조금 더 연습하면 좋아요!' : '꾸준히 연습하면 나아질 거예요!'
    : bbsPercent >= 80 ? 'Great balance!' : bbsPercent >= 40 ? 'A little more practice will help!' : 'Keep practicing, you will improve!'

  // FAC: 0~5 레벨
  const facMessages: Record<number, { ko: string; en: string }> = {
    0: { ko: '아직 걷기가 어려워요', en: 'Walking is still difficult' },
    1: { ko: '많은 도움이 있으면 걸을 수 있어요', en: 'Can walk with a lot of help' },
    2: { ko: '보조가 있으면 걸을 수 있어요', en: 'Can walk with some assistance' },
    3: { ko: '가까이서 지켜보면 걸을 수 있어요', en: 'Can walk with standby help' },
    4: { ko: '평지에서는 혼자 걸을 수 있어요', en: 'Can walk independently on flat ground' },
    5: { ko: '어디서든 혼자 걸을 수 있어요!', en: 'Can walk independently everywhere!' },
  }

  // MBI: 100점 만점
  const mbiPercent = latestMBI ? Math.round((latestMBI.totalScore / 100) * 100) : 0
  const mbiMessage = language === 'ko'
    ? mbiPercent >= 80 ? '대부분 혼자 하실 수 있어요!' : mbiPercent >= 50 ? '절반 이상 혼자 하실 수 있어요!' : '조금씩 독립성이 늘고 있어요!'
    : mbiPercent >= 80 ? 'You can do most things on your own!' : mbiPercent >= 50 ? 'You can do more than half by yourself!' : 'Your independence is growing!'

  // MMT: 각 근육 0~5, 평균 계산
  const mmtAvg = (() => {
    if (!latestMMT) return 0
    const scores = Object.values(latestMMT.scores)
    if (scores.length === 0) return 0
    let total = 0
    let count = 0
    scores.forEach((s) => {
      if (s.lt !== null) { total += s.lt; count++ }
      if (s.rt !== null) { total += s.rt; count++ }
    })
    return count > 0 ? total / count : 0
  })()
  const mmtPercent = Math.round((mmtAvg / 5) * 100)
  const mmtMessage = language === 'ko'
    ? mmtPercent >= 80 ? '근력이 아주 좋아요!' : mmtPercent >= 50 ? '근력이 좋아지고 있어요!' : '꾸준히 운동하면 강해질 거예요!'
    : mmtPercent >= 80 ? 'Your strength is excellent!' : mmtPercent >= 50 ? 'Your strength is improving!' : 'Keep exercising, you will get stronger!'

  // Hand: 32점 만점 (각 손)
  const handLPercent = latestHand ? Math.round((latestHand.leftTotalScore / 32) * 100) : 0
  const handRPercent = latestHand ? Math.round((latestHand.rightTotalScore / 32) * 100) : 0

  // ROM: 측정 관절 수
  const romCount = latestROM ? latestROM.measurements.length : 0

  const today = new Date()
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0">
        {/* 상단: 환자 이름 + 날짜 */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <span className="text-sm text-text-secondary">
            {profile.name || (language === 'ko' ? '게스트' : 'Guest')}{language === 'ko' ? '님' : ''} | {dateStr}
          </span>
        </div>
        {/* 평가 카드 그리드 — 2열 3행, 한 화면에 */}
        <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-3">

          {/* BBS 균형 능력 */}
          <AssessmentCard icon={Shield} title={language === 'ko' ? '균형 능력' : 'Balance'} toolName="BBS" hasData={!!latestBBS} delay={0.05} accentColor="bg-purple-500">
            {latestBBS ? (
              <>
                <p className="text-4xl lg:text-5xl font-extrabold text-primary">{bbsPercent}%</p>
                <PercentBar percent={bbsPercent} color={bbsPercent >= 80 ? 'bg-secondary' : bbsPercent >= 40 ? 'bg-warning' : 'bg-error'} />
                <p className="text-sm text-text-secondary mt-1">{bbsMessage}</p>
              </>
            ) : (
              <NotYetMessage language={language} icon={Shield} />
            )}
          </AssessmentCard>

          {/* FAC 보행 능력 */}
          <AssessmentCard icon={PersonStanding} title={language === 'ko' ? '보행 능력' : 'Walking'} toolName="FAC" hasData={!!latestFAC} delay={0.1} accentColor="bg-blue-500">
            {latestFAC ? (
              <>
                <p className="text-4xl lg:text-5xl font-extrabold text-primary">
                  Lv.{latestFAC.level}
                  <span className="text-lg text-text-secondary font-medium ml-1">/5</span>
                </p>
                <PercentBar percent={(latestFAC.level / 5) * 100} color={latestFAC.level >= 4 ? 'bg-secondary' : latestFAC.level >= 2 ? 'bg-warning' : 'bg-error'} />
                <p className="text-sm text-text-secondary mt-1">
                  {facMessages[latestFAC.level]?.[language === 'ko' ? 'ko' : 'en'] || ''}
                </p>
              </>
            ) : (
              <NotYetMessage language={language} icon={PersonStanding} />
            )}
          </AssessmentCard>

          {/* MBI 일상생활 독립도 */}
          <AssessmentCard icon={HeartHandshake} title={language === 'ko' ? '일상생활' : 'Daily'} toolName="MBI" hasData={!!latestMBI} delay={0.15}>
            {latestMBI ? (
              <>
                <p className="text-3xl lg:text-4xl font-bold text-primary">{mbiPercent}%</p>
                <PercentBar percent={mbiPercent} color={mbiPercent >= 80 ? 'bg-secondary' : mbiPercent >= 50 ? 'bg-warning' : 'bg-error'} />
                <p className="text-sm text-text-secondary mt-1">{mbiMessage}</p>
              </>
            ) : (
              <NotYetMessage language={language} icon={HeartHandshake} />
            )}
          </AssessmentCard>

          {/* MMT 근력 */}
          <AssessmentCard icon={Dumbbell} title={language === 'ko' ? '근력' : 'Strength'} toolName="MMT" hasData={!!latestMMT} delay={0.2}>
            {latestMMT ? (
              <>
                <p className="text-3xl lg:text-4xl font-bold text-primary">{mmtPercent}%</p>
                <PercentBar percent={mmtPercent} color={mmtPercent >= 80 ? 'bg-secondary' : mmtPercent >= 50 ? 'bg-warning' : 'bg-error'} />
                <p className="text-sm text-text-secondary mt-1">{mmtMessage}</p>
              </>
            ) : (
              <NotYetMessage language={language} icon={Dumbbell} />
            )}
          </AssessmentCard>

          {/* Hand 손 기능 */}
          <AssessmentCard icon={Hand} title={language === 'ko' ? '손 기능' : 'Hand'} toolName="Hand Function" hasData={!!latestHand} delay={0.25}>
            {latestHand ? (
              <>
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-xs text-text-secondary">{language === 'ko' ? '좌' : 'L'}</span>
                    <p className="text-2xl lg:text-3xl font-bold text-primary">{handLPercent}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">{language === 'ko' ? '우' : 'R'}</span>
                    <p className="text-2xl lg:text-3xl font-bold text-primary">{handRPercent}%</p>
                  </div>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary w-5">{language === 'ko' ? '좌' : 'L'}</span>
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${handLPercent}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary w-5">{language === 'ko' ? '우' : 'R'}</span>
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${handRPercent}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <NotYetMessage language={language} icon={Hand} />
            )}
          </AssessmentCard>

          {/* ROM 관절 움직임 */}
          <AssessmentCard icon={Move} title={language === 'ko' ? '관절 움직임' : 'Joint'} toolName="ROM" hasData={!!latestROM} delay={0.3}>
            {latestROM ? (
              <>
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {romCount}
                  <span className="text-lg text-text-secondary font-medium ml-1">
                    {language === 'ko' ? '개 관절' : 'joints'}
                  </span>
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {language === 'ko' ? '정상 범위에서 움직이고 있어요' : 'Moving within normal range'}
                </p>
              </>
            ) : (
              <NotYetMessage language={language} icon={Move} />
            )}
          </AssessmentCard>
        </div>
      </div>
    </div>
  )
}

// ─── BBS 항목 데이터 (K-BBS 공식 지시사항 기준) ───
// instruction: 화면에 표시되는 가이드 텍스트
// instruction: 화면 표시 및 음성 안내에 동일하게 사용
// demoVideo: 시범 영상 경로 (null = 아직 없음)
const BBS_GUIDE_ITEMS = [
  { id: 1, title: '앉은 자세에서 일어나기', titleEn: 'Sit to Stand', instruction: '의자에서 일어나 보세요. 손을 사용하지 말고 일어나 보세요.', instructionEn: 'Stand up from the chair. Try not to use your hands.', emoji: '\u{1FA91}', duration: 0, demoVideo: '/videos/bbs/bbs_01_sitting_to_standing.mp4' },
  { id: 2, title: '지지 없이 서 있기', titleEn: 'Standing Unsupported', instruction: '아무것도 잡지 말고 2분간 서 계세요.', instructionEn: 'Stand for 2 minutes without holding anything.', emoji: '\u{1F9CD}', duration: 120, demoVideo: '/videos/bbs/bbs_02_standing_unsupported.mp4' },
  { id: 3, title: '지지 없이 앉아 있기', titleEn: 'Sitting Unsupported', instruction: '팔짱을 끼고 2분간 앉아 계세요.', instructionEn: 'Sit with arms folded for 2 minutes.', emoji: '\u{1FA91}', duration: 120, demoVideo: '/videos/bbs/bbs_03_sitting_unsupported.mp4' },
  { id: 4, title: '선 자세에서 앉기', titleEn: 'Stand to Sit', instruction: '천천히 앉아 보세요.', instructionEn: 'Please sit down slowly.', emoji: '\u{1F9CD}', duration: 0, demoVideo: '/videos/bbs/bbs_04_standing_to_sitting.mp4' },
  { id: 5, title: '이동하기', titleEn: 'Transfers', instruction: '의자에서 다른 의자로 옮겨 앉으세요. 한쪽은 팔걸이가 있는 의자, 한쪽은 없는 의자입니다.', instructionEn: 'Transfer from one chair to another. One chair has armrests, the other does not.', emoji: '\u{1FA91}', duration: 0, demoVideo: '/videos/bbs/bbs_05_transfers.mp4' },
  { id: 6, title: '눈 감고 서 있기', titleEn: 'Standing with Eyes Closed', instruction: '눈을 감고 10초간 서 계세요.', instructionEn: 'Close your eyes and stand for 10 seconds.', emoji: '\u{1F60C}', duration: 10, demoVideo: '/videos/bbs/bbs_06_eyes_closed.mp4' },
  { id: 7, title: '두 발 모아 서 있기', titleEn: 'Standing with Feet Together', instruction: '두 발을 모으고 서 계세요.', instructionEn: 'Stand with your feet together.', emoji: '\u{1F9B6}', duration: 60, demoVideo: '/videos/bbs/bbs_07_feet_together.mp4' },
  { id: 8, title: '팔을 뻗어 앞으로 내밀기', titleEn: 'Reaching Forward', instruction: '팔을 90도로 들고, 손끝을 가능한 한 앞으로 쭉 뻗어 보세요.', instructionEn: 'Raise your arms to 90 degrees and reach forward as far as you can.', emoji: '\u{1F646}', duration: 0, demoVideo: '/videos/bbs/bbs_08_reaching_forward.mp4' },
  { id: 9, title: '바닥의 물건 집어올리기', titleEn: 'Pick Up Object', instruction: '발 앞에 놓인 물건을 주워 보세요.', instructionEn: 'Pick up the object placed in front of your feet.', emoji: '\u{1F9CE}', duration: 0, demoVideo: '/videos/bbs/bbs_09_pick_up_object.mp4' },
  { id: 10, title: '서서 좌우 뒤돌아보기', titleEn: 'Turning to Look Behind', instruction: '왼쪽 어깨 너머로 뒤를 돌아보세요. 오른쪽도 해 보세요.', instructionEn: 'Turn to look behind over your left shoulder. Then try the right side.', emoji: '\u{1F504}', duration: 0, demoVideo: '/videos/bbs/bbs_10_turning_look_behind.mp4' },
  { id: 11, title: '제자리에서 360도 회전하기', titleEn: 'Turn 360 Degrees', instruction: '제자리에서 한 바퀴 돌아 보세요. 반대 방향으로도 한 바퀴 돌아 보세요.', instructionEn: 'Turn a full circle in place. Then turn in the opposite direction.', emoji: '\u{1F503}', duration: 0, demoVideo: '/videos/bbs/bbs_11_turn_360.mp4' },
  { id: 12, title: '발판에 발 교대로 올리기', titleEn: 'Alternate Foot on Step', instruction: '발판 위에 발을 번갈아 올려 보세요.', instructionEn: 'Place each foot alternately on the step.', emoji: '\u{1F9B6}', duration: 0, demoVideo: '/videos/bbs/bbs_12_foot_on_step.mp4' },
  { id: 13, title: '일렬로 서 있기', titleEn: 'Tandem Standing', instruction: '한 발을 다른 발 바로 앞에 놓고 서 보세요.', instructionEn: 'Place one foot directly in front of the other and stand.', emoji: '\u{1F9B6}', duration: 30, demoVideo: '/videos/bbs/bbs_13_tandem_standing.mp4' },
  { id: 14, title: '한 발로 서 있기', titleEn: 'Standing on One Leg', instruction: '잡지 말고 한 발로 서 보세요.', instructionEn: 'Stand on one leg without holding anything.', emoji: '\u{1F9B6}\u{261D}\u{FE0F}', duration: 10, demoVideo: '/videos/bbs/bbs_14_one_leg_standing.mp4' },
]

// ─── 검사 가이드 탭 ───
function GuideTab({ language }: { language: string }) {
  const {
    timerSeconds,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer,
    tickTimer,
    setGuide,
    clearGuide,
  } = usePatientGuideStore()

  // 모드: false = 순차 모드, true = 선택 모드
  const [isSelectMode, setIsSelectMode] = useState(false)
  // 선택 모드에서 체크된 항목 ID
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set(BBS_GUIDE_ITEMS.map(i => i.id)))
  // 현재 진행 목록에서의 인덱스 (-1 = 미시작)
  const [currentIndex, setCurrentIndex] = useState(-1)
  // 자동 만점 처리된 항목
  const [autoScoredIds, setAutoScoredIds] = useState<Set<number>>(new Set())
  // 완료된 항목
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set())
  // 검사 완료 상태
  const [isCompleted, setIsCompleted] = useState(false)
  // 카메라 미러링
  const [isMirrored, setIsMirrored] = useState(true)
  // 카메라 화면 ON/OFF
  const [isCameraVisible, setIsCameraVisible] = useState(true)

  const { videoRef, isStreaming, error: cameraError, startCamera, stopCamera } = useCamera({
    width: 640,
    height: 480,
  })

  // 진행 목록 계산
  const activeItems = isSelectMode
    ? BBS_GUIDE_ITEMS.filter(i => checkedIds.has(i.id))
    : BBS_GUIDE_ITEMS

  const currentItem = currentIndex >= 0 && currentIndex < activeItems.length
    ? activeItems[currentIndex]
    : null

  const isAutoScored = currentItem ? autoScoredIds.has(currentItem.id) : false

  // 타이머 틱
  useEffect(() => {
    if (!isTimerRunning) return
    const interval = setInterval(() => { tickTimer() }, 1000)
    return () => clearInterval(interval)
  }, [isTimerRunning, tickTimer])

  // 카메라: 항목 진행 시에만 시작 (완료 화면에서는 끔)
  useEffect(() => {
    if (currentItem && !isAutoScored && !isCompleted) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => { stopCamera() }
  }, [currentItem, isAutoScored, isCompleted, startCamera, stopCamera])

  // 타이머 포맷팅
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 항목 이동 (store 동기화 포함)
  const goToIndex = useCallback((idx: number) => {
    setCurrentIndex(idx)
    if (idx >= 0 && idx < activeItems.length) {
      const item = activeItems[idx]
      setGuide({
        type: 'bbs',
        id: item.id,
        title: item.title,
        titleEn: item.titleEn,
        instruction: item.instruction,
        instructionEn: item.instructionEn,
        duration: item.duration || undefined,
      })
    } else {
      clearGuide()
    }
  }, [activeItems, setGuide, clearGuide])

  // 다음 항목 (2→3 자동만점 로직 포함)
  const goNext = useCallback(() => {
    const nextIdx = currentIndex + 1
    if (nextIdx >= activeItems.length) {
      // 마지막 항목 → 검사 완료
      setIsCompleted(true)
      clearGuide()
      return
    }

    const nextItem = activeItems[nextIdx]

    // 2번 항목 완료 후 3번이 다음이면 → 자동 만점 처리하고 건너뛰기
    if (currentItem?.id === 2 && nextItem.id === 3) {
      setAutoScoredIds(prev => new Set(prev).add(3))
      setCompletedIds(prev => new Set(prev).add(3))
      // 3번 건너뛰고 그 다음으로
      const skipIdx = nextIdx + 1
      if (skipIdx < activeItems.length) {
        goToIndex(skipIdx)
      } else {
        // 3번이 마지막이면 검사 완료
        setIsCompleted(true)
        clearGuide()
      }
      return
    }

    goToIndex(nextIdx)
  }, [currentIndex, activeItems, currentItem, goToIndex, clearGuide])

  // 이전 항목
  const goPrev = useCallback(() => {
    if (isCompleted) {
      // 완료 화면에서 이전 → 마지막 항목으로 복귀
      setIsCompleted(false)
      const lastIdx = activeItems.length - 1
      if (lastIdx >= 0) goToIndex(lastIdx)
      return
    }
    if (currentIndex <= 0) return
    goToIndex(currentIndex - 1)
  }, [isCompleted, currentIndex, activeItems, goToIndex])

  // 현재 항목 완료 처리 + 다음으로
  const completeAndNext = useCallback(() => {
    if (currentItem) {
      setCompletedIds(prev => new Set(prev).add(currentItem.id))
    }
    goNext()
  }, [currentItem, goNext])

  // 음성 안내
  const speakGuide = useCallback(() => {
    if (!currentItem) return
    const text = language === 'ko'
      ? currentItem.instruction
      : currentItem.instructionEn
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'ko' ? 'ko-KR' : 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }, [currentItem, language])

  // 드롭다운으로 점프
  const handleDropdownJump = useCallback((id: number) => {
    setIsCompleted(false)
    const idx = activeItems.findIndex(i => i.id === id)
    if (idx >= 0) goToIndex(idx)
  }, [activeItems, goToIndex])

  // 체크박스 토글
  const toggleCheck = useCallback((id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  // 모드 전환 시 초기화
  const handleToggleMode = useCallback(() => {
    setIsSelectMode(prev => !prev)
    setCurrentIndex(-1)
    setAutoScoredIds(new Set())
    setCompletedIds(new Set())
    setIsCompleted(false)
    clearGuide()
  }, [clearGuide])

  // 시작
  const handleStart = useCallback(() => {
    if (activeItems.length === 0) return
    setAutoScoredIds(new Set())
    setCompletedIds(new Set())
    setIsCompleted(false)
    goToIndex(0)
  }, [activeItems, goToIndex])

  // 진행률 계산
  const completedCount = completedIds.size
  const totalCount = activeItems.length

  // 카메라 패널
  const cameraPanel = (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover transition-transform"
        style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
      />
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
          {cameraError ? (
            <>
              <CameraOff className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-400 text-xl text-center px-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-6 py-3 rounded-lg bg-primary text-white text-lg hover:bg-primary/80 transition-colors"
              >
                {language === 'ko' ? '다시 시도' : 'Retry'}
              </button>
            </>
          ) : (
            <>
              <Camera className="w-16 h-16 text-gray-400 mb-4 animate-pulse" />
              <p className="text-gray-400 text-xl">
                {language === 'ko' ? '카메라 연결 중...' : 'Connecting camera...'}
              </p>
            </>
          )}
        </div>
      )}
      {isStreaming && (
        <>
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white text-sm">LIVE</span>
          </div>
          <button
            onClick={() => setIsMirrored(prev => !prev)}
            className={cn(
              'absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              isMirrored
                ? 'bg-purple-600/80 text-white'
                : 'bg-black/50 text-gray-300'
            )}
          >
            <span>🔄</span>
            {language === 'ko' ? '미러링' : 'Mirror'}
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ─── 상단 바: 드롭다운 + 선택모드 토글 ─── */}
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center gap-4 flex-shrink-0 flex-wrap">
        {/* 드롭다운 */}
        <span className="text-lg text-text-secondary font-medium whitespace-nowrap">
          {language === 'ko' ? 'BBS 항목' : 'BBS Item'}:
        </span>
        <select
          value={currentItem?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value)
            if (id) handleDropdownJump(id)
          }}
          className="flex-1 max-w-sm px-4 py-3 rounded-xl bg-background border border-border text-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">
            {language === 'ko' ? '-- 항목 선택 --' : '-- Select --'}
          </option>
          {activeItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.emoji} {item.id}. {language === 'ko' ? item.title : item.titleEn}
              {autoScoredIds.has(item.id) ? (language === 'ko' ? ' (자동 만점)' : ' (Auto full)') : ''}
            </option>
          ))}
        </select>

        {/* 선택 모드 토글 */}
        <button
          onClick={handleToggleMode}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-lg font-medium transition-colors whitespace-nowrap',
            isSelectMode
              ? 'bg-primary text-white'
              : 'bg-background border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          {isSelectMode
            ? <ToggleRight className="w-6 h-6" />
            : <ToggleLeft className="w-6 h-6" />
          }
          {language === 'ko' ? '선택 모드' : 'Select Mode'}
        </button>

        {/* 카메라 화면 토글 */}
        <button
          onClick={() => setIsCameraVisible(prev => !prev)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-lg font-medium transition-colors whitespace-nowrap',
            isCameraVisible
              ? 'bg-purple-600 text-white'
              : 'bg-background border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          <span>{isCameraVisible ? '📷' : '📷'}</span>
          {language === 'ko' ? '화면' : 'Camera'}
        </button>
      </div>

      {/* ─── 선택 모드: 체크박스 목록 (진행 전에만 표시) ─── */}
      {isSelectMode && currentIndex < 0 && (
        <div className="bg-surface border-b border-border px-6 py-4 flex-shrink-0 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center gap-3 mb-4">
            <ListChecks className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-text-primary">
              {language === 'ko' ? '검사할 항목을 선택하세요' : 'Select items to test'}
            </span>
            <span className="text-lg text-text-secondary ml-auto">
              {checkedIds.size} / 14
            </span>
          </div>
          {/* 전체 선택 / 해제 */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setCheckedIds(new Set(BBS_GUIDE_ITEMS.map(i => i.id)))}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-lg font-medium hover:bg-primary/20 transition-colors"
            >
              {language === 'ko' ? '전체 선택' : 'Select All'}
            </button>
            <button
              onClick={() => setCheckedIds(new Set())}
              className="px-4 py-2 rounded-lg bg-background border border-border text-text-secondary text-lg font-medium hover:text-text-primary transition-colors"
            >
              {language === 'ko' ? '전체 해제' : 'Deselect All'}
            </button>
          </div>
          {/* 항목 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {BBS_GUIDE_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                  checkedIds.has(item.id)
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-background border border-border'
                )}
              >
                {checkedIds.has(item.id)
                  ? <CheckSquare className="w-6 h-6 text-primary flex-shrink-0" />
                  : <Square className="w-6 h-6 text-text-secondary/40 flex-shrink-0" />
                }
                <span className="text-xl">{item.emoji}</span>
                <span className={cn('text-lg font-medium', checkedIds.has(item.id) ? 'text-text-primary' : 'text-text-secondary')}>
                  {item.id}. {language === 'ko' ? item.title : item.titleEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── 메인 영역 ─── */}
      {isCompleted ? (
        /* ─── 검사 완료 화면 ─── */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="w-[80px] h-[80px] lg:w-[100px] lg:h-[100px] text-green-500 mx-auto mb-6" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl lg:text-4xl font-bold text-white mb-4"
            >
              {language === 'ko' ? '검사가 완료되었습니다' : 'Test Completed'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-400"
            >
              {language === 'ko' ? '수고하셨습니다. 감사합니다.' : 'Good job. Thank you.'}
            </motion.p>
          </div>

          {/* 완료 화면 하단 바 */}
          <div className="bg-surface border-t border-border py-4 lg:py-5 px-6 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-center gap-3 lg:gap-5">
              {/* 이전 (마지막 항목으로 돌아가기) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goPrev}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-medium transition-colors bg-background border border-border text-text-primary hover:bg-border"
              >
                <ChevronLeft className="w-6 h-6" />
                {language === 'ko' ? '이전' : 'Prev'}
              </motion.button>
            </div>

            {/* 진행률 바 - 100% */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-lg text-green-500 font-medium whitespace-nowrap">
                {totalCount} / {totalCount} {language === 'ko' ? '항목 완료' : 'completed'}
              </span>
            </div>
          </div>
        </div>
      ) : currentItem === null ? (
        /* 대기 / 시작 화면 */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <BookOpen className="w-16 h-16 text-text-secondary/30 mb-6" />
          {isSelectMode && currentIndex < 0 ? (
            <>
              <p className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">
                {checkedIds.size > 0
                  ? (language === 'ko' ? `${checkedIds.size}개 항목이 선택되었습니다` : `${checkedIds.size} items selected`)
                  : (language === 'ko' ? '항목을 선택해 주세요' : 'Please select items')}
              </p>
              {checkedIds.size > 0 && (
                <button
                  onClick={handleStart}
                  className="mt-6 px-8 py-4 rounded-xl bg-primary text-white text-2xl font-bold hover:bg-primary-hover transition-colors"
                >
                  {language === 'ko' ? '검사 시작' : 'Start Test'}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">
                {language === 'ko' ? 'BBS 균형 검사' : 'BBS Balance Scale'}
              </p>
              <p className="text-xl lg:text-2xl text-text-secondary mb-6">
                {language === 'ko'
                  ? '아래 버튼을 눌러 1번 항목부터 시작하세요'
                  : 'Press the button below to start from item 1'}
              </p>
              <button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl bg-primary text-white text-2xl font-bold hover:bg-primary-hover transition-colors"
              >
                {language === 'ko' ? '검사 시작' : 'Start Test'}
              </button>
            </>
          )}
        </div>
      ) : isAutoScored ? (
        /* 자동 만점 항목 표시 */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <SkipForward className="w-16 h-16 text-secondary mb-4" />
          <span className="text-[5rem] lg:text-[7rem] leading-none mb-4">{currentItem.emoji}</span>
          <h1 className="text-[2rem] lg:text-[3rem] font-bold text-text-primary leading-tight mb-3">
            {currentItem.id}. {language === 'ko' ? currentItem.title : currentItem.titleEn}
          </h1>
          <p className="text-2xl lg:text-3xl text-secondary font-bold">
            {language === 'ko' ? '(자동 만점) — 2번 항목 통과로 건너뜁니다' : '(Auto full score) — Skipped due to item 2 pass'}
          </p>
          <button
            onClick={completeAndNext}
            className="mt-8 px-8 py-4 rounded-xl bg-primary text-white text-2xl font-bold hover:bg-primary-hover transition-colors flex items-center gap-3"
          >
            {language === 'ko' ? '다음 항목' : 'Next Item'}
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      ) : (
        /* 가이드 모드: 카메라 + 안내 */
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* 왼쪽: 카메라 (OFF일 때 CSS로만 숨김, 스트림 유지) */}
          <div
            className={cn(
              'h-[35vh] lg:h-full lg:w-1/2 flex-shrink-0',
              !isCameraVisible && 'hidden'
            )}
          >
            {cameraPanel}
          </div>

          {/* 오른쪽: 가이드 안내 (카메라 OFF면 전체 너비) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col justify-center p-5 lg:p-8 overflow-y-auto gap-4">
              {/* 1) 항목 번호 + 이모지 + 제목 */}
              <h1 className="text-xl font-bold text-text-primary text-center truncate">
                {currentItem.id}. {currentItem.emoji} {language === 'ko' ? currentItem.title : currentItem.titleEn}
              </h1>

              {/* 2) 안내 문구 */}
              <p className="text-lg text-primary font-medium text-center leading-snug">
                &ldquo;{language === 'ko' ? currentItem.instruction : currentItem.instructionEn}&rdquo;
              </p>

              {/* 3) 시범 영상 (자동재생) */}
              {currentItem.demoVideo && (
                <div className="w-full mx-auto rounded-lg overflow-hidden bg-black" style={{ maxHeight: '35vh' }}>
                  <video
                    key={currentItem.id}
                    src={currentItem.demoVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full rounded-lg"
                    style={{ maxHeight: '35vh', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>

            {/* 하단: 네비게이션 + 타이머 + 음성 + 진행률 */}
            <div className="bg-surface border-t border-border py-4 lg:py-5 px-6 flex-shrink-0 space-y-3">
              {/* 컨트롤 행 */}
              <div className="flex items-center justify-center gap-3 lg:gap-5 flex-wrap">
                {/* 이전 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goPrev}
                  disabled={currentIndex <= 0}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-medium transition-colors',
                    currentIndex <= 0
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-background border border-border text-text-primary hover:bg-border'
                  )}
                >
                  <ChevronLeft className="w-6 h-6" />
                  {language === 'ko' ? '이전' : 'Prev'}
                </motion.button>

                {/* 음성 안내 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={speakGuide}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Volume2 className="w-6 h-6" />
                  <span className="text-lg font-medium">
                    {language === 'ko' ? '음성' : 'Voice'}
                  </span>
                </motion.button>

                {/* 타이머 */}
                {currentItem.duration > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="bg-background rounded-2xl px-5 py-2 border border-border">
                      <span className={cn(
                        'text-3xl lg:text-4xl font-mono font-bold',
                        timerSeconds <= 10 && timerSeconds > 0 ? 'text-red-500' : 'text-text-primary'
                      )}>
                        {formatTime(timerSeconds || currentItem.duration)}
                      </span>
                    </div>
                    {!isTimerRunning ? (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={startTimer}
                        className="p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors">
                        <Play className="w-6 h-6" />
                      </motion.button>
                    ) : (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={stopTimer}
                        className="p-3 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors">
                        <Pause className="w-6 h-6" />
                      </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.95 }} onClick={resetTimer}
                      className="p-3 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300">
                      <RotateCcw className="w-6 h-6" />
                    </motion.button>
                  </div>
                )}

                {/* 다음 / 완료 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={completeAndNext}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-medium transition-colors',
                    currentIndex >= activeItems.length - 1
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-primary text-white hover:bg-primary-hover'
                  )}
                >
                  {currentIndex >= activeItems.length - 1
                    ? (language === 'ko' ? '완료' : 'Complete')
                    : (language === 'ko' ? '다음' : 'Next')
                  }
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </div>

              {/* 진행률 바 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-lg text-text-secondary font-medium whitespace-nowrap">
                  {completedCount} / {totalCount} {language === 'ko' ? '항목 완료' : 'completed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── 미니 라인 차트 ───
function MiniChart({ data, color, domain }: { data: { value: number; date: string }[]; color: string; domain?: [number, number] }) {
  return (
    <div className="w-full flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          {domain && <YAxis domain={domain} hide />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#1F2937' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 변화 기록 없음 메시지 ───
function NoProgressMessage({ language, icon: Icon }: { language: string; icon: React.ElementType }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <Icon className="w-10 h-10 text-text-secondary/25 mb-1.5" />
      <span className="text-sm text-text-secondary">
        {language === 'ko' ? '아직 기록이 없어요' : 'No records yet'}
      </span>
      <span className="text-xs text-text-secondary/50 mt-0.5">
        {language === 'ko' ? '검사를 시작하면 변화를 확인할 수 있어요' : 'Start testing to track changes'}
      </span>
    </div>
  )
}

// ─── 나의 변화 탭 ───
function ProgressTab({ language }: { language: string }) {
  const { history: bbsHistory } = useBBSStore()
  const { sessions: romSessions } = useRomStore()
  const { history: handHistory } = useHandFunctionStore()
  const { history: facHistory } = useFACStore()
  const { history: mbiHistory } = useMBIStore()
  const { history: mmtHistory } = useMMTStore()

  // ─── 데모 데이터 (DEMO_MODE = false 로 변경하면 실제 스토어 데이터 사용) ───
  const DEMO_MODE = true

  const bbsHist = DEMO_MODE ? [
    { id: 'd4', timestamp: new Date('2026-02-04').getTime(), totalScore: 38, scores: {} as Record<number, number>, riskLevel: 'medium' as const },
    { id: 'd3', timestamp: new Date('2026-01-30').getTime(), totalScore: 31, scores: {} as Record<number, number>, riskLevel: 'medium' as const },
    { id: 'd2', timestamp: new Date('2026-01-20').getTime(), totalScore: 28, scores: {} as Record<number, number>, riskLevel: 'medium' as const },
    { id: 'd1', timestamp: new Date('2026-01-10').getTime(), totalScore: 21, scores: {} as Record<number, number>, riskLevel: 'high' as const },
  ] : bbsHistory

  const facHist = DEMO_MODE ? [
    { id: 'd3', timestamp: new Date('2026-02-04').getTime(), level: 2 },
    { id: 'd2', timestamp: new Date('2026-01-25').getTime(), level: 2 },
    { id: 'd1', timestamp: new Date('2026-01-10').getTime(), level: 1 },
  ] : facHistory

  const mbiHist = DEMO_MODE ? [
    { id: 'd3', timestamp: new Date('2026-02-04').getTime(), totalScore: 62, scores: {} as Record<string, number> },
    { id: 'd2', timestamp: new Date('2026-01-25').getTime(), totalScore: 55, scores: {} as Record<string, number> },
    { id: 'd1', timestamp: new Date('2026-01-10').getTime(), totalScore: 45, scores: {} as Record<string, number> },
  ] : mbiHistory

  // MMT, Hand, ROM은 실제 스토어 데이터 (데모 없음 → 빈 상태)
  const mmtHist = mmtHistory
  const handHist = handHistory
  const romSess = romSessions

  // 날짜 포맷 헬퍼
  const fmtDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  // 차트 색상 (보라색)
  const CHART_COLOR = '#8B5CF6'

  // 날짜 범위 계산
  const allTimestamps: number[] = [
    ...bbsHist.map(h => h.timestamp),
    ...facHist.map(h => h.timestamp),
    ...mbiHist.map(h => h.timestamp),
    ...mmtHist.map(h => h.timestamp),
    ...handHist.map(h => h.timestamp),
    ...romSess.map(s => new Date(s.timestamp).getTime()),
  ]
  const minTs = allTimestamps.length > 0 ? Math.min(...allTimestamps) : Date.now()
  const maxTs = allTimestamps.length > 0 ? Math.max(...allTimestamps) : Date.now()
  const minD = new Date(minTs)
  const maxD = new Date(maxTs)
  const dateRange = `${minD.getFullYear()}.${String(minD.getMonth() + 1).padStart(2, '0')} ~ ${maxD.getFullYear()}.${String(maxD.getMonth() + 1).padStart(2, '0')}`

  // ── BBS ──
  const bbsChrono = [...bbsHist].reverse()
  const bbsChartData = bbsChrono.map(h => ({ value: h.totalScore, date: fmtDate(h.timestamp) }))
  const bbsLatest = bbsHist[0]
  const bbsOldest = bbsChrono[0]
  const bbsChange = bbsHist.length >= 2 ? bbsLatest.totalScore - bbsOldest!.totalScore : null
  const bbsComment = (() => {
    if (!bbsLatest) return ''
    if (bbsChange !== null) {
      if (bbsChange > 10) return language === 'ko' ? '많이 좋아지고 있어요!' : 'Great improvement!'
      if (bbsChange > 0) return language === 'ko' ? '조금씩 나아지고 있어요!' : 'Getting better!'
      if (bbsChange === 0) return language === 'ko' ? '꾸준히 유지하고 있어요' : 'Maintaining well'
      return language === 'ko' ? '함께 다시 노력해봐요!' : "Let's try again!"
    }
    const s = bbsLatest.totalScore
    if (language === 'ko') return s >= 45 ? '균형 감각이 좋아요!' : s >= 21 ? '조금씩 나아지고 있어요!' : '함께 노력해봐요!'
    return s >= 45 ? 'Great balance!' : s >= 21 ? 'Getting better!' : "Let's keep trying!"
  })()

  // ── FAC ──
  const facChrono = [...facHist].reverse()
  const facChartData = facChrono.map(h => ({ value: h.level, date: fmtDate(h.timestamp) }))
  const facLatest = facHist[0]
  const facOldest = facChrono[0]
  const facChange = facHist.length >= 2 ? facLatest.level - facOldest!.level : null
  const facComment = (() => {
    if (!facLatest) return ''
    if (facChange !== null && facChange > 0) return language === 'ko' ? '보행이 좋아지고 있어요!' : 'Walking is improving!'
    if (facChange !== null && facChange === 0) return language === 'ko' ? '꾸준히 연습해요!' : 'Keep practicing!'
    return language === 'ko' ? '다시 연습해봐요!' : "Let's practice more!"
  })()

  // ── MBI ──
  const mbiChrono = [...mbiHist].reverse()
  const mbiChartData = mbiChrono.map(h => ({ value: h.totalScore, date: fmtDate(h.timestamp) }))
  const mbiLatest = mbiHist[0]
  const mbiOldest = mbiChrono[0]
  const mbiChange = mbiHist.length >= 2 ? mbiLatest.totalScore - mbiOldest!.totalScore : null
  const mbiComment = (() => {
    if (!mbiLatest) return ''
    if (mbiChange !== null && mbiChange > 0) return language === 'ko' ? '일상생활이 편해지고 있어요!' : 'Daily life is getting easier!'
    if (mbiChange !== null && mbiChange === 0) return language === 'ko' ? '꾸준히 유지하고 있어요' : 'Maintaining well'
    return language === 'ko' ? '다시 노력해봐요!' : "Let's try again!"
  })()

  // ── MMT ──
  const computeMMTPercent = (result: typeof mmtHist[0]) => {
    const scores = Object.values(result.scores)
    let total = 0, count = 0
    scores.forEach(s => {
      if (s.lt !== null) { total += s.lt; count++ }
      if (s.rt !== null) { total += s.rt; count++ }
    })
    return count > 0 ? Math.round((total / count / 5) * 100) : 0
  }
  const mmtChrono = [...mmtHist].reverse()
  const mmtChartData = mmtChrono.map(h => ({ value: computeMMTPercent(h), date: fmtDate(h.timestamp) }))
  const mmtLatest = mmtHist[0]
  const mmtOldest = mmtChrono[0]
  const mmtLatestPct = mmtLatest ? computeMMTPercent(mmtLatest) : 0
  const mmtOldestPct = mmtOldest ? computeMMTPercent(mmtOldest) : 0
  const mmtChange = mmtHist.length >= 2 ? mmtLatestPct - mmtOldestPct : null
  const mmtComment = (() => {
    if (!mmtLatest) return ''
    if (mmtChange !== null && mmtChange > 0) return language === 'ko' ? '근력이 좋아지고 있어요!' : 'Getting stronger!'
    return language === 'ko' ? '꾸준히 운동해요!' : 'Keep exercising!'
  })()

  // ── Hand Function ──
  const handChrono = [...handHist].reverse()
  const handChartData = handChrono.map(h => ({ value: Math.round(((h.leftTotalScore + h.rightTotalScore) / 64) * 100), date: fmtDate(h.timestamp) }))
  const handLatest = handHist[0]
  const handOldest = handChrono[0]
  const handLatestPct = handLatest ? Math.round(((handLatest.leftTotalScore + handLatest.rightTotalScore) / 64) * 100) : 0
  const handOldestPct = handOldest ? Math.round(((handOldest.leftTotalScore + handOldest.rightTotalScore) / 64) * 100) : 0
  const handChange = handHist.length >= 2 ? handLatestPct - handOldestPct : null
  const handComment = (() => {
    if (!handLatest) return ''
    if (handChange !== null && handChange > 0) return language === 'ko' ? '손 기능이 좋아지고 있어요!' : 'Hand function improving!'
    return language === 'ko' ? '꾸준히 연습해요!' : 'Keep practicing!'
  })()

  // ── ROM ──
  const romChrono = [...romSess].reverse()
  const romChartData = romChrono.map(s => ({ value: s.measurements.length, date: fmtDate(new Date(s.timestamp).getTime()) }))
  const romLatest = romSess[0]
  const romOldest = romChrono[0]
  const romChange = romSess.length >= 2 ? romLatest.measurements.length - romOldest!.measurements.length : null
  const romComment = (() => {
    if (!romLatest) return ''
    if (romChange !== null && romChange > 0) return language === 'ko' ? '관절 움직임이 좋아지고 있어요!' : 'Joint mobility improving!'
    return language === 'ko' ? '꾸준히 스트레칭해요!' : 'Keep stretching!'
  })()

  // 변화 색상 (텍스트)
  const getChangeColor = (c: number | null) => c === null || c === 0 ? 'text-yellow-500' : c > 0 ? 'text-green-500' : 'text-orange-500'

  // 변화 텍스트 헬퍼
  const fmtChangeText = (oldVal: number, newVal: number, unit: string, change: number) => {
    const sign = change > 0 ? '+' : ''
    const arrow = change > 0 ? ' ↑' : change < 0 ? ' ↓' : ' →'
    return `${oldVal}${unit} → ${newVal}${unit} (${sign}${change}${unit}${arrow})`
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0">
        {/* 날짜 범위 */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-text-secondary/60" />
          <span className="text-sm text-text-secondary">{dateRange}</span>
        </div>

        {/* 그리드 — 2열 3행 */}
        <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-3">

          {/* BBS 균형 능력 */}
          <AssessmentCard icon={Shield} title={language === 'ko' ? '균형 능력' : 'Balance'} toolName="BBS" hasData={bbsHist.length > 0} delay={0.05} accentColor="bg-purple-500">
            {bbsHist.length > 0 ? (
              <>
                <MiniChart data={bbsChartData} color={CHART_COLOR} domain={[0, 56]} />
                <p className={cn('text-sm font-semibold mt-1', getChangeColor(bbsChange))}>
                  {bbsHist.length >= 2
                    ? fmtChangeText(bbsOldest!.totalScore, bbsLatest.totalScore, language === 'ko' ? '점' : 'pts', bbsChange!)
                    : `${bbsLatest.totalScore}${language === 'ko' ? '점' : 'pts'} / 56`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{bbsComment}</p>
              </>
            ) : (
              <NoProgressMessage language={language} icon={Shield} />
            )}
          </AssessmentCard>

          {/* FAC 보행 능력 */}
          <AssessmentCard icon={PersonStanding} title={language === 'ko' ? '보행 능력' : 'Walking'} toolName="FAC" hasData={facHist.length > 0} delay={0.1} accentColor="bg-blue-500">
            {facHist.length > 0 ? (
              <>
                <MiniChart data={facChartData} color={CHART_COLOR} domain={[0, 5]} />
                <p className={cn('text-sm font-semibold mt-1', getChangeColor(facChange))}>
                  {facHist.length >= 2
                    ? `Lv.${facOldest!.level} → Lv.${facLatest.level} (${facChange! > 0 ? '+' : ''}${facChange}${facChange! > 0 ? ' ↑' : facChange! < 0 ? ' ↓' : ' →'})`
                    : `Lv.${facLatest.level} / 5`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{facComment}</p>
              </>
            ) : (
              <NoProgressMessage language={language} icon={PersonStanding} />
            )}
          </AssessmentCard>

          {/* MBI 일상생활 */}
          <AssessmentCard icon={HeartHandshake} title={language === 'ko' ? '일상생활' : 'Daily'} toolName="MBI" hasData={mbiHist.length > 0} delay={0.15}>
            {mbiHist.length > 0 ? (
              <>
                <MiniChart data={mbiChartData} color={CHART_COLOR} domain={[0, 100]} />
                <p className={cn('text-sm font-semibold mt-1', getChangeColor(mbiChange))}>
                  {mbiHist.length >= 2
                    ? fmtChangeText(mbiOldest!.totalScore, mbiLatest.totalScore, language === 'ko' ? '점' : 'pts', mbiChange!)
                    : `${mbiLatest.totalScore}${language === 'ko' ? '점' : 'pts'} / 100`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{mbiComment}</p>
              </>
            ) : (
              <NoProgressMessage language={language} icon={HeartHandshake} />
            )}
          </AssessmentCard>

          {/* MMT 근력 */}
          <AssessmentCard icon={Dumbbell} title={language === 'ko' ? '근력' : 'Strength'} toolName="MMT" hasData={mmtHist.length > 0} delay={0.2}>
            {mmtHist.length > 0 ? (
              <>
                <MiniChart data={mmtChartData} color={CHART_COLOR} domain={[0, 100]} />
                <p className={cn('text-sm font-semibold mt-1', getChangeColor(mmtChange))}>
                  {mmtHist.length >= 2
                    ? fmtChangeText(mmtOldestPct, mmtLatestPct, '%', mmtChange!)
                    : `${mmtLatestPct}%`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{mmtComment}</p>
              </>
            ) : (
              <NoProgressMessage language={language} icon={Dumbbell} />
            )}
          </AssessmentCard>

          {/* Hand 손 기능 */}
          <AssessmentCard icon={Hand} title={language === 'ko' ? '손 기능' : 'Hand'} toolName="Hand Function" hasData={handHist.length > 0} delay={0.25}>
            {handHist.length > 0 ? (
              <>
                <MiniChart data={handChartData} color={CHART_COLOR} domain={[0, 100]} />
                <p className={cn('text-sm font-semibold mt-1', getChangeColor(handChange))}>
                  {handHist.length >= 2
                    ? fmtChangeText(handOldestPct, handLatestPct, '%', handChange!)
                    : `${handLatestPct}%`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{handComment}</p>
              </>
            ) : (
              <NoProgressMessage language={language} icon={Hand} />
            )}
          </AssessmentCard>

          {/* ROM 관절 움직임 */}
          <AssessmentCard icon={Move} title={language === 'ko' ? '관절 움직임' : 'Joint'} toolName="ROM" hasData={romSess.length > 0} delay={0.3}>
            {romSess.length > 0 ? (
              <>
                <MiniChart data={romChartData} color={CHART_COLOR} />
                <p className={cn('text-sm font-semibold mt-1', getChangeColor(romChange))}>
                  {romSess.length >= 2
                    ? `${romOldest!.measurements.length}${language === 'ko' ? '개' : ''} → ${romLatest.measurements.length}${language === 'ko' ? '개 관절' : ' joints'} (${romChange! > 0 ? '+' : ''}${romChange}${romChange! > 0 ? ' ↑' : romChange! < 0 ? ' ↓' : ' →'})`
                    : `${romLatest.measurements.length}${language === 'ko' ? '개 관절 측정' : ' joints measured'}`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{romComment}</p>
              </>
            ) : (
              <NoProgressMessage language={language} icon={Move} />
            )}
          </AssessmentCard>

        </div>
      </div>
    </div>
  )
}

// ─── 메인 페이지 ───
export default function PatientPage() {
  const { language } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('status')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const tabs: { id: TabType; label: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'status', label: '내 현황', labelEn: 'My Status', icon: Activity },
    { id: 'guide', label: '검사 가이드', labelEn: 'Test Guide', icon: BookOpen },
    { id: 'progress', label: '나의 변화', labelEn: 'My Progress', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 상단 탭 바 */}
      <div className="bg-surface border-b border-border flex-shrink-0">
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-8 py-4 rounded-xl text-xl lg:text-2xl font-semibold transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                )}
              >
                <Icon className="w-7 h-7 lg:w-8 lg:h-8" />
                <span>{language === 'ko' ? tab.label : tab.labelEn}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {activeTab === 'status' && <StatusTab language={language} />}
          {activeTab === 'guide' && <GuideTab language={language} />}
          {activeTab === 'progress' && <ProgressTab language={language} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
