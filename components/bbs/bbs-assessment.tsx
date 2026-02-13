'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw, Save, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useBBSStore } from '@/stores/bbs-store'
import { BBS_ITEMS, interpretBBSScore } from '@/types/bbs'
import { cn } from '@/lib/utils'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'

interface BBSAssessmentProps {
  onSave?: (result: { scores: Record<number, number>; totalScore: number; riskLevel: 'high' | 'medium' | 'low' }) => void
}

// 스텝 = 0~13: 문항, 14: 결과 화면
const RESULT_STEP = 14

export function BBSAssessment({ onSave }: BBSAssessmentProps) {
  const router = useRouter()
  const { language } = useTranslation()
  const { currentScores, setScore, resetCurrentSession, saveResult } = useBBSStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1) // 1: forward, -1: backward
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalScore = Object.values(currentScores).reduce((sum, s) => sum + s, 0)
  const completedCount = Object.keys(currentScores).length
  const interpretation = interpretBBSScore(totalScore)

  const goTo = useCallback((step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }, [currentStep])

  const goPrev = useCallback(() => {
    if (currentStep > 0) goTo(currentStep - 1)
  }, [currentStep, goTo])

  const goNext = useCallback(() => {
    if (currentStep < RESULT_STEP) goTo(currentStep + 1)
  }, [currentStep, goTo])

  const handleScoreSelect = useCallback((itemId: number, score: number) => {
    const prev = currentScores[itemId]
    // 같은 점수 다시 누르면 해제
    if (prev === score) {
      setScore(itemId, undefined as unknown as number)
      return
    }
    setScore(itemId, score)
    // 자동 다음 문항 (마지막 문항이면 결과 화면으로)
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    autoAdvanceTimer.current = setTimeout(() => {
      if (currentStep < RESULT_STEP) {
        setDirection(1)
        setCurrentStep((s) => s + 1)
      }
    }, 400)
  }, [currentScores, setScore, currentStep])

  const handleReset = useCallback(() => {
    resetCurrentSession()
    setSaveSuccess(false)
    setCurrentStep(0)
    setDirection(-1)
  }, [resetCurrentSession])

  const handleSave = useCallback(async () => {
    if (completedCount < 14) return
    const result = saveResult()
    if (result) {
      setSaveSuccess(true)
      onSave?.({ scores: result.scores, totalScore: result.totalScore, riskLevel: result.riskLevel })
      if (selectedPatientId && user?.id) {
        await saveAssessmentToSupabase({
          patientId: selectedPatientId,
          therapistId: user.id,
          assessmentType: 'BBS',
          score: result.totalScore,
          details: { scores: result.scores, riskLevel: result.riskLevel },
        })
      }
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }, [completedCount, saveResult, onSave, selectedPatientId, user?.id])

  const riskColor = interpretation.riskLevel === 'high' ? 'text-red-500' :
    interpretation.riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  const currentItem = currentStep < RESULT_STEP ? BBS_ITEMS[currentStep] : null

  return (
    <div className="max-w-[560px] mx-auto flex flex-col" style={{ minHeight: 'calc(100dvh - 180px)' }}>
      {/* ── 상단 바: 진행률 + 총점 ── */}
      <div className="flex-shrink-0 space-y-2 mb-4">
        {/* 진행 인디케이터 */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary">
            {currentStep < RESULT_STEP
              ? `${currentStep + 1} / 14`
              : language === 'ko' ? '결과' : 'Result'}
          </span>
          <span className={cn('font-bold text-lg', riskColor)}>
            {totalScore}<span className="text-xs font-normal text-text-secondary"> / 56</span>
          </span>
        </div>

        {/* 진행 바 (클릭으로 이동 가능) */}
        <div className="flex gap-0.5">
          {BBS_ITEMS.map((item, i) => {
            const answered = currentScores[item.id] !== undefined
            const isCurrent = currentStep === i
            return (
              <button
                key={item.id}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-200',
                  isCurrent ? 'bg-primary scale-y-150' :
                  answered ? 'bg-emerald-500' : 'bg-border',
                )}
              />
            )
          })}
        </div>
      </div>

      {/* ── 중앙: 문항 카드 or 결과 화면 ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep < RESULT_STEP && currentItem ? (
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-4"
            >
              {/* 문항 헤더 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold',
                    currentScores[currentItem.id] !== undefined
                      ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'
                  )}>
                    {currentItem.id}
                  </span>
                  <h2 className="text-base font-bold text-text-primary">{currentItem.titleEn}</h2>
                </div>
                <p className="text-sm text-text-secondary">{currentItem.title}</p>
                {currentItem.instruction && (
                  <p className="mt-1.5 text-xs text-primary bg-primary/5 rounded-md px-2.5 py-1.5">
                    {language === 'ko' ? '지시: ' : 'Instruction: '}{currentItem.instruction}
                  </p>
                )}
              </div>

              {/* 점수 선택 */}
              <div className="space-y-2">
                {currentItem.scores.map((option) => {
                  const selected = currentScores[currentItem.id] === option.score
                  return (
                    <button
                      key={option.score}
                      onClick={() => handleScoreSelect(currentItem.id, option.score)}
                      className={cn(
                        'w-full flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-surface hover:border-primary/30 hover:bg-primary/[0.02]',
                      )}
                    >
                      <span className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold flex-shrink-0 mt-0.5',
                        selected
                          ? 'bg-primary text-white'
                          : 'bg-background border border-border text-text-secondary'
                      )}>
                        {option.score}
                      </span>
                      <span className={cn(
                        'text-sm leading-relaxed pt-0.5',
                        selected ? 'text-primary font-medium' : 'text-text-primary'
                      )}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : currentStep === RESULT_STEP ? (
            <motion.div
              key="result"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-5"
            >
              {/* 결과 요약 */}
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                >
                  <Trophy className={cn('h-12 w-12 mx-auto mb-3', riskColor)} />
                </motion.div>
                <div className={cn('text-5xl font-bold', riskColor)}>
                  {totalScore}<span className="text-xl font-normal text-text-secondary"> / 56</span>
                </div>
                <p className={cn('mt-1 text-sm font-semibold', riskColor)}>
                  {interpretation.riskLevel === 'high'
                    ? language === 'ko' ? '높은 낙상 위험' : 'High fall risk'
                    : interpretation.riskLevel === 'medium'
                    ? language === 'ko' ? '중간 낙상 위험' : 'Medium fall risk'
                    : language === 'ko' ? '낮은 낙상 위험' : 'Low fall risk'}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {language === 'ko'
                    ? interpretation.description
                    : interpretation.descriptionEn}
                </p>
              </div>

              {/* 문항별 점수 미니 요약 */}
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-xs font-semibold text-text-secondary mb-2">
                  {language === 'ko' ? '문항별 점수' : 'Item Scores'}
                </p>
                <div className="grid grid-cols-7 gap-1.5">
                  {BBS_ITEMS.map((item) => {
                    const s = currentScores[item.id]
                    return (
                      <button
                        key={item.id}
                        onClick={() => goTo(item.id - 1)}
                        className={cn(
                          'flex flex-col items-center rounded-lg py-1.5 transition-colors hover:bg-background',
                          s === undefined && 'opacity-40',
                        )}
                      >
                        <span className="text-[10px] text-text-secondary">{item.id}</span>
                        <span className={cn(
                          'text-sm font-bold',
                          s === undefined ? 'text-text-secondary' :
                          s >= 3 ? 'text-emerald-500' : s >= 1 ? 'text-amber-500' : 'text-red-500'
                        )}>
                          {s ?? '-'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 미완료 경고 */}
              {completedCount < 14 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {language === 'ko'
                      ? `${14 - completedCount}개 항목이 미완료입니다. 항목을 눌러 이동하세요.`
                      : `${14 - completedCount} items remaining. Tap an item to go back.`}
                  </p>
                </div>
              )}

              {/* 저장 성공 메시지 */}
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
                      {language === 'ko' ? '결과가 저장되었습니다!' : 'Results saved!'}
                    </div>
                    <button
                      onClick={() => router.push('/gait-analysis/history')}
                      className="mt-1 text-xs text-emerald-600 underline hover:no-underline"
                    >
                      {language === 'ko' ? '기록 보기' : 'View History'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 저장/초기화 버튼 */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1 h-10 text-sm">
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  {language === 'ko' ? '초기화' : 'Reset'}
                </Button>
                <Button onClick={handleSave} disabled={completedCount < 14} className="flex-1 h-10 text-sm">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  {language === 'ko' ? '결과 저장' : 'Save Results'}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── 하단: 이전/다음 버튼 ── */}
      {currentStep < RESULT_STEP && (
        <div className="flex-shrink-0 flex items-center justify-between pt-4 mt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {language === 'ko' ? '이전' : 'Prev'}
          </Button>

          <span className="text-xs text-text-secondary">
            {completedCount} / 14 {language === 'ko' ? '완료' : 'done'}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            className="gap-1"
          >
            {currentStep === 13
              ? (language === 'ko' ? '결과 보기' : 'Results')
              : (language === 'ko' ? '다음' : 'Next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
