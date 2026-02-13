'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw, Save, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'

/* ── Types ── */

type ScoreValue = number | 'NT' | null
type SideScores = Record<string, ScoreValue>
type BilateralScores = { left: SideScores; right: SideScores }

/* ── Constants ── */

const MOTOR_UPPER = [
  { level: 'C5', en: 'Elbow flexors', ko: '팔꿈치 굴곡근' },
  { level: 'C6', en: 'Wrist extensors', ko: '손목 신전근' },
  { level: 'C7', en: 'Elbow extensors', ko: '팔꿈치 신전근' },
  { level: 'C8', en: 'Finger flexors', ko: '손가락 굴곡근' },
  { level: 'T1', en: 'Finger abductors (small finger)', ko: '새끼손가락 외전근' },
]

const MOTOR_LOWER = [
  { level: 'L2', en: 'Hip flexors', ko: '고관절 굴곡근' },
  { level: 'L3', en: 'Knee extensors', ko: '무릎 신전근' },
  { level: 'L4', en: 'Ankle dorsiflexors', ko: '발목 배측굴곡근' },
  { level: 'L5', en: 'Long toe extensors', ko: '엄지발가락 신전근' },
  { level: 'S1', en: 'Ankle plantar flexors', ko: '발목 저측굴곡근' },
]

const DERMATOMES = [
  'C2','C3','C4','C5','C6','C7','C8',
  'T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12',
  'L1','L2','L3','L4','L5',
  'S1','S2','S3','S4-5',
]

const SENSORY_REGIONS = [
  { label: 'Cervical', ko: '경추', levels: ['C2','C3','C4','C5','C6','C7','C8'] },
  { label: 'Thoracic', ko: '흉추', levels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'] },
  { label: 'Lumbar', ko: '요추', levels: ['L1','L2','L3','L4','L5'] },
  { label: 'Sacral', ko: '천추', levels: ['S1','S2','S3','S4-5'] },
]

const MOTOR_GRADES = [0, 1, 2, 3, 4, 5, 'NT'] as const
const SENSORY_GRADES = [0, 1, 2, 'NT'] as const

const STEP_LABELS = [
  { en: 'Upper Motor', ko: '상지 운동' },
  { en: 'Lower Motor', ko: '하지 운동' },
  { en: 'Light Touch', ko: '촉각' },
  { en: 'Pin Prick', ko: '통각' },
  { en: 'Anorectal', ko: '직장검사' },
  { en: 'Result', ko: '결과' },
]

const RESULT_STEP = 5

/* ── Helpers ── */

function sumScores(scores: SideScores): number {
  return Object.values(scores).reduce<number>((s, v) => s + (typeof v === 'number' ? v : 0), 0)
}

function countFilled(scores: SideScores): number {
  return Object.values(scores).filter(v => v != null).length
}

function classifyAIS(
  motorUpper: BilateralScores,
  motorLower: BilateralScores,
  lightTouch: BilateralScores,
  pinPrick: BilateralScores,
  dap: boolean | null,
  vac: boolean | null,
): string {
  // E: All normal
  const allMotorNormal = [...MOTOR_UPPER, ...MOTOR_LOWER].every(({ level }) => {
    const m = MOTOR_UPPER.some(k => k.level === level) ? motorUpper : motorLower
    return m.left[level] === 5 && m.right[level] === 5
  })
  const allSensoryNormal = DERMATOMES.every(d =>
    lightTouch.left[d] === 2 && lightTouch.right[d] === 2 &&
    pinPrick.left[d] === 2 && pinPrick.right[d] === 2
  )
  if (allMotorNormal && allSensoryNormal) return 'E'

  // S4-5 sensory preservation
  const s45Sensory = [
    lightTouch.left['S4-5'], lightTouch.right['S4-5'],
    pinPrick.left['S4-5'], pinPrick.right['S4-5'],
  ].some(v => typeof v === 'number' && v > 0)

  // A: Complete — no S4-5 sensory, no DAP, no VAC
  if (!s45Sensory && !dap && !vac) return 'A'

  // Find motor level (most caudal with grade 5 bilaterally, contiguous)
  const allMotorKeys = [...MOTOR_UPPER, ...MOTOR_LOWER]
  let motorLevelIdx = -1
  for (let i = 0; i < allMotorKeys.length; i++) {
    const { level } = allMotorKeys[i]
    const m = i < 5 ? motorUpper : motorLower
    if (m.left[level] === 5 && m.right[level] === 5) {
      motorLevelIdx = i
    } else {
      break
    }
  }

  // Motor scores below neurological level
  const belowScores: number[] = []
  for (let i = motorLevelIdx + 1; i < allMotorKeys.length; i++) {
    const { level } = allMotorKeys[i]
    const m = i < 5 ? motorUpper : motorLower
    const l = m.left[level]
    const r = m.right[level]
    if (typeof l === 'number') belowScores.push(l)
    if (typeof r === 'number') belowScores.push(r)
  }

  const hasMotorBelow = belowScores.some(s => s > 0) || vac === true

  // B: Sensory incomplete — sacral sparing but no motor below NLI
  if (!hasMotorBelow) return 'B'

  // C vs D: Motor incomplete
  if (belowScores.length > 0) {
    const geq3 = belowScores.filter(s => s >= 3).length
    if (geq3 >= belowScores.length / 2) return 'D'
  }
  return 'C'
}

/* ── Component ── */

export function ASIAAssessment() {
  const router = useRouter()
  const { language } = useTranslation()
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()
  const isKo = language === 'ko'

  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [motorUpper, setMotorUpper] = useState<BilateralScores>({ left: {}, right: {} })
  const [motorLower, setMotorLower] = useState<BilateralScores>({ left: {}, right: {} })
  const [lightTouch, setLightTouch] = useState<BilateralScores>({ left: {}, right: {} })
  const [pinPrick, setPinPrick] = useState<BilateralScores>({ left: {}, right: {} })
  const [dap, setDap] = useState<boolean | null>(null)
  const [vac, setVac] = useState<boolean | null>(null)

  // Computed
  const motorUpperLt = sumScores(motorUpper.left)
  const motorUpperRt = sumScores(motorUpper.right)
  const motorLowerLt = sumScores(motorLower.left)
  const motorLowerRt = sumScores(motorLower.right)
  const motorTotal = motorUpperLt + motorUpperRt + motorLowerLt + motorLowerRt
  const lightTouchTotal = sumScores(lightTouch.left) + sumScores(lightTouch.right)
  const pinPrickTotal = sumScores(pinPrick.left) + sumScores(pinPrick.right)

  const aisGrade = useMemo(
    () => classifyAIS(motorUpper, motorLower, lightTouch, pinPrick, dap, vac),
    [motorUpper, motorLower, lightTouch, pinPrick, dap, vac],
  )

  // Completion
  const stepCompletion = [
    countFilled(motorUpper.left) + countFilled(motorUpper.right) >= 10,
    countFilled(motorLower.left) + countFilled(motorLower.right) >= 10,
    countFilled(lightTouch.left) + countFilled(lightTouch.right) >= 56,
    countFilled(pinPrick.left) + countFilled(pinPrick.right) >= 56,
    dap !== null && vac !== null,
  ]
  const allComplete = stepCompletion.every(Boolean)

  // Navigation
  const goTo = useCallback((step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }, [currentStep])

  const goPrev = useCallback(() => { if (currentStep > 0) goTo(currentStep - 1) }, [currentStep, goTo])
  const goNext = useCallback(() => { if (currentStep <= RESULT_STEP) goTo(currentStep + 1) }, [currentStep, goTo])

  // Setters
  const setMotorScore = useCallback((
    type: 'upper' | 'lower', side: 'left' | 'right', level: string, value: ScoreValue,
  ) => {
    const setter = type === 'upper' ? setMotorUpper : setMotorLower
    setter(prev => ({ ...prev, [side]: { ...prev[side], [level]: value } }))
  }, [])

  const setSensoryScore = useCallback((
    type: 'lightTouch' | 'pinPrick', side: 'left' | 'right', level: string, value: ScoreValue,
  ) => {
    const setter = type === 'lightTouch' ? setLightTouch : setPinPrick
    setter(prev => ({ ...prev, [side]: { ...prev[side], [level]: value } }))
  }, [])

  const fillAllSensory = useCallback((type: 'lightTouch' | 'pinPrick', value: ScoreValue) => {
    const filled: SideScores = {}
    DERMATOMES.forEach(d => { filled[d] = value })
    const setter = type === 'lightTouch' ? setLightTouch : setPinPrick
    setter({ left: { ...filled }, right: { ...filled } })
  }, [])

  const handleReset = useCallback(() => {
    setMotorUpper({ left: {}, right: {} })
    setMotorLower({ left: {}, right: {} })
    setLightTouch({ left: {}, right: {} })
    setPinPrick({ left: {}, right: {} })
    setDap(null)
    setVac(null)
    setSaveSuccess(false)
    setCurrentStep(0)
    setDirection(-1)
  }, [])

  const handleSave = useCallback(async () => {
    if (!allComplete) return
    const details = {
      motorUpper: { left: motorUpper.left, right: motorUpper.right },
      motorLower: { left: motorLower.left, right: motorLower.right },
      lightTouch: { left: lightTouch.left, right: lightTouch.right },
      pinPrick: { left: pinPrick.left, right: pinPrick.right },
      dap, vac,
      motorTotal,
      motorUpperTotal: motorUpperLt + motorUpperRt,
      motorLowerTotal: motorLowerLt + motorLowerRt,
      lightTouchTotal,
      pinPrickTotal,
      aisGrade,
    }
    if (selectedPatientId && user?.id) {
      await saveAssessmentToSupabase({
        patientId: selectedPatientId,
        therapistId: user.id,
        assessmentType: 'ASIA',
        score: motorTotal,
        details,
      })
    }
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }, [allComplete, motorUpper, motorLower, lightTouch, pinPrick, dap, vac,
      motorTotal, motorUpperLt, motorUpperRt, motorLowerLt, motorLowerRt,
      lightTouchTotal, pinPrickTotal, aisGrade, selectedPatientId, user?.id])

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  const aisColor = aisGrade === 'A' ? 'text-red-500' :
    aisGrade === 'B' ? 'text-orange-500' :
    aisGrade === 'C' ? 'text-amber-500' :
    aisGrade === 'D' ? 'text-blue-500' : 'text-emerald-500'

  /* ── Render: Motor step ── */
  const renderMotorStep = (
    muscles: typeof MOTOR_UPPER,
    type: 'upper' | 'lower',
    scores: BilateralScores,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">
          {type === 'upper'
            ? isKo ? '상지 운동 (C5–T1)' : 'Upper Extremity Motor (C5–T1)'
            : isKo ? '하지 운동 (L2–S1)' : 'Lower Extremity Motor (L2–S1)'}
        </h3>
        <span className="text-xs font-bold text-primary">
          {sumScores(scores.left) + sumScores(scores.right)}/50
        </span>
      </div>

      {muscles.map(({ level, en, ko }) => (
        <div key={level} className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-primary/10 text-xs font-bold text-primary">
              {level}
            </span>
            <span className="text-xs text-text-secondary">{en}</span>
          </div>
          {(['left', 'right'] as const).map(side => (
            <div key={side} className="flex items-center gap-1.5">
              <span className="w-6 text-[10px] font-semibold text-text-secondary">
                {side === 'left' ? 'Lt' : 'Rt'}
              </span>
              <div className="flex gap-1">
                {MOTOR_GRADES.map(g => {
                  const selected = scores[side][level] === g
                  return (
                    <button
                      key={String(g)}
                      onClick={() => setMotorScore(type, side, level, selected ? null : g)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                        selected
                          ? g === 'NT' ? 'bg-blue-500 text-white'
                          : typeof g === 'number' && g >= 4 ? 'bg-emerald-500 text-white'
                          : typeof g === 'number' && g >= 3 ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                          : 'bg-background border border-border text-text-secondary hover:border-primary/30',
                      )}
                    >
                      {g === 'NT' ? 'N' : g}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  /* ── Render: Sensory step ── */
  const renderSensoryStep = (
    type: 'lightTouch' | 'pinPrick',
    scores: BilateralScores,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">
          {type === 'lightTouch'
            ? isKo ? '가벼운 촉각 (Light Touch)' : 'Light Touch'
            : isKo ? '통각 (Pin Prick)' : 'Pin Prick'}
        </h3>
        <span className="text-xs font-bold text-primary">
          {sumScores(scores.left) + sumScores(scores.right)}/112
        </span>
      </div>

      {/* Quick-fill buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fillAllSensory(type, 2)}
          className="flex-1 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
        >
          {isKo ? '모두 정상 (2)' : 'All Normal (2)'}
        </button>
        <button
          onClick={() => fillAllSensory(type, 0)}
          className="flex-1 py-1.5 rounded-lg border border-red-300 bg-red-50 dark:bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
        >
          {isKo ? '모두 없음 (0)' : 'All Absent (0)'}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center text-[10px] font-semibold text-text-secondary px-1">
        <div className="w-10" />
        <div className="flex-1 text-center">Lt</div>
        <div className="flex-1 text-center">Rt</div>
      </div>

      {/* Dermatome rows */}
      <div className="space-y-0.5 max-h-[50vh] overflow-y-auto pr-1">
        {SENSORY_REGIONS.map(region => (
          <div key={region.label}>
            <div className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mt-2 mb-1 px-1">
              {region.label}
            </div>
            {region.levels.map(level => (
              <div key={level} className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-background">
                <span className="w-9 text-xs font-semibold text-text-primary">{level}</span>
                {(['left', 'right'] as const).map(side => (
                  <div key={side} className="flex-1 flex justify-center gap-0.5">
                    {SENSORY_GRADES.map(g => {
                      const selected = scores[side][level] === g
                      return (
                        <button
                          key={String(g)}
                          onClick={() => setSensoryScore(type, side, level, selected ? null : g)}
                          className={cn(
                            'w-6 h-6 rounded text-[10px] font-bold transition-all',
                            selected
                              ? g === 'NT' ? 'bg-blue-500 text-white'
                              : g === 2 ? 'bg-emerald-500 text-white'
                              : g === 1 ? 'bg-amber-500 text-white'
                              : 'bg-red-500 text-white'
                              : 'bg-background border border-border text-text-secondary/60 hover:border-primary/30',
                          )}
                        >
                          {g === 'NT' ? 'N' : g}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  /* ── Render: Anorectal step ── */
  const renderAnorectalStep = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-primary">
        {isKo ? '직장검사 (Anorectal Examination)' : 'Anorectal Examination'}
      </h3>

      {/* DAP */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Deep Anal Pressure (DAP)</p>
          <p className="text-xs text-text-secondary">
            {isKo ? '심부 항문 압각' : 'Deep anal pressure sensation'}
          </p>
        </div>
        <div className="flex gap-3">
          {([true, false] as const).map(v => (
            <button
              key={String(v)}
              onClick={() => setDap(dap === v ? null : v)}
              className={cn(
                'flex-1 py-3 rounded-xl border text-sm font-semibold transition-all',
                dap === v
                  ? v ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                       : 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-border bg-background text-text-secondary hover:border-primary/30',
              )}
            >
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {/* VAC */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Voluntary Anal Contraction (VAC)</p>
          <p className="text-xs text-text-secondary">
            {isKo ? '수의적 항문 수축' : 'Voluntary anal contraction'}
          </p>
        </div>
        <div className="flex gap-3">
          {([true, false] as const).map(v => (
            <button
              key={String(v)}
              onClick={() => setVac(vac === v ? null : v)}
              className={cn(
                'flex-1 py-3 rounded-xl border text-sm font-semibold transition-all',
                vac === v
                  ? v ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                       : 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-border bg-background text-text-secondary hover:border-primary/30',
              )}
            >
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  /* ── Render: Result step ── */
  const renderResultStep = () => (
    <div className="space-y-5">
      {/* AIS Grade */}
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <Trophy className={cn('h-12 w-12 mx-auto mb-3', aisColor)} />
        </motion.div>
        <div className="text-lg text-text-secondary font-medium mb-1">AIS Grade</div>
        <div className={cn('text-5xl font-bold', aisColor)}>{aisGrade}</div>
        <p className="mt-1 text-sm text-text-secondary">
          {aisGrade === 'A' ? (isKo ? '완전손상 (Complete)' : 'Complete') :
           aisGrade === 'B' ? (isKo ? '감각 불완전 (Sensory Incomplete)' : 'Sensory Incomplete') :
           aisGrade === 'C' ? (isKo ? '운동 불완전 – MMT<3 우세' : 'Motor Incomplete – MMT<3 dominant') :
           aisGrade === 'D' ? (isKo ? '운동 불완전 – MMT≥3 우세' : 'Motor Incomplete – MMT≥3 dominant') :
           isKo ? '정상 (Normal)' : 'Normal'}
        </p>
      </div>

      {/* Score summary */}
      <div className="bg-surface border border-border rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-text-secondary">
          {isKo ? '점수 요약' : 'Score Summary'}
        </p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-background rounded-lg p-2">
            <div className="text-xs text-text-secondary">{isKo ? '운동 총점' : 'Motor Total'}</div>
            <div className="text-xl font-bold text-primary">
              {motorTotal}<span className="text-xs font-normal text-text-secondary">/100</span>
            </div>
          </div>
          <div className="bg-background rounded-lg p-2">
            <div className="text-xs text-text-secondary">{isKo ? '촉각' : 'Light Touch'}</div>
            <div className="text-xl font-bold text-primary">
              {lightTouchTotal}<span className="text-xs font-normal text-text-secondary">/112</span>
            </div>
          </div>
          <div className="bg-background rounded-lg p-2">
            <div className="text-xs text-text-secondary">{isKo ? '통각' : 'Pin Prick'}</div>
            <div className="text-xl font-bold text-primary">
              {pinPrickTotal}<span className="text-xs font-normal text-text-secondary">/112</span>
            </div>
          </div>
          <div className="bg-background rounded-lg p-2">
            <div className="text-xs text-text-secondary">{isKo ? '직장검사' : 'Anorectal'}</div>
            <div className="text-sm font-bold text-text-primary mt-1">
              DAP: <span className={dap ? 'text-emerald-500' : 'text-red-500'}>{dap ? 'Yes' : dap === false ? 'No' : '-'}</span>
              {' · '}
              VAC: <span className={vac ? 'text-emerald-500' : 'text-red-500'}>{vac ? 'Yes' : vac === false ? 'No' : '-'}</span>
            </div>
          </div>
        </div>

        {/* Motor breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between px-2 py-1 bg-background rounded">
            <span className="text-text-secondary">{isKo ? '상지 Lt' : 'UE Lt'}</span>
            <span className="font-bold">{motorUpperLt}/25</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-background rounded">
            <span className="text-text-secondary">{isKo ? '상지 Rt' : 'UE Rt'}</span>
            <span className="font-bold">{motorUpperRt}/25</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-background rounded">
            <span className="text-text-secondary">{isKo ? '하지 Lt' : 'LE Lt'}</span>
            <span className="font-bold">{motorLowerLt}/25</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-background rounded">
            <span className="text-text-secondary">{isKo ? '하지 Rt' : 'LE Rt'}</span>
            <span className="font-bold">{motorLowerRt}/25</span>
          </div>
        </div>
      </div>

      {/* Incomplete warning */}
      {!allComplete && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {isKo
              ? '일부 항목이 미완료입니다. 진행바를 눌러 이동하세요.'
              : 'Some items are incomplete. Tap progress bar to navigate.'}
          </p>
        </div>
      )}

      {/* Save success */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center"
          >
            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-emerald-500 font-medium text-sm">
              {isKo ? '결과가 저장되었습니다!' : 'Results saved!'}
            </div>
            <button
              onClick={() => router.push('/gait-analysis/history')}
              className="mt-1 text-xs text-emerald-600 underline hover:no-underline"
            >
              {isKo ? '기록 보기' : 'View History'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleReset} className="flex-1 h-10 text-sm">
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          {isKo ? '초기화' : 'Reset'}
        </Button>
        <Button onClick={handleSave} disabled={!allComplete} className="flex-1 h-10 text-sm">
          <Save className="mr-2 h-3.5 w-3.5" />
          {isKo ? '결과 저장' : 'Save Results'}
        </Button>
      </div>
    </div>
  )

  /* ── Main render ── */
  return (
    <div className="max-w-[560px] mx-auto flex flex-col" style={{ minHeight: 'calc(100dvh - 180px)' }}>
      {/* Progress bar */}
      <div className="flex-shrink-0 space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary">
            {currentStep < RESULT_STEP
              ? `${isKo ? STEP_LABELS[currentStep].ko : STEP_LABELS[currentStep].en} (${currentStep + 1}/${RESULT_STEP})`
              : isKo ? '결과' : 'Result'}
          </span>
          <span className="font-bold text-sm text-primary">
            Motor {motorTotal}/100
          </span>
        </div>
        <div className="flex gap-1">
          {STEP_LABELS.slice(0, RESULT_STEP).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-200',
                currentStep === i ? 'bg-primary scale-y-150'
                : stepCompletion[i] ? 'bg-emerald-500'
                : 'bg-border',
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {currentStep === 0 && renderMotorStep(MOTOR_UPPER, 'upper', motorUpper)}
            {currentStep === 1 && renderMotorStep(MOTOR_LOWER, 'lower', motorLower)}
            {currentStep === 2 && renderSensoryStep('lightTouch', lightTouch)}
            {currentStep === 3 && renderSensoryStep('pinPrick', pinPrick)}
            {currentStep === 4 && renderAnorectalStep()}
            {currentStep === RESULT_STEP && renderResultStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {currentStep < RESULT_STEP && (
        <div className="flex-shrink-0 flex items-center justify-between pt-4 mt-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentStep === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            {isKo ? '이전' : 'Prev'}
          </Button>
          <span className="text-xs text-text-secondary">
            {isKo ? STEP_LABELS[currentStep].ko : STEP_LABELS[currentStep].en}
          </span>
          <Button variant="ghost" size="sm" onClick={goNext} className="gap-1">
            {currentStep === RESULT_STEP - 1
              ? (isKo ? '결과 보기' : 'Results')
              : (isKo ? '다음' : 'Next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
