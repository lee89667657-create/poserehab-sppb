'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw, Save, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useBBSStore } from '@/stores/bbs-store'
import { usePatientGuideStore } from '@/stores/patient-guide-store'
import { BBS_ITEMS, interpretBBSScore } from '@/types/bbs'
import { cn } from '@/lib/utils'

interface BBSAssessmentProps {
  onSave?: (result: { scores: Record<number, number>; totalScore: number; riskLevel: 'high' | 'medium' | 'low' }) => void
}

export function BBSAssessment({ onSave }: BBSAssessmentProps) {
  const router = useRouter()
  const { language } = useTranslation()
  const { currentScores, setScore, resetCurrentSession, saveResult } = useBBSStore()
  const { setBBSGuide, clearGuide } = usePatientGuideStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [guideEnabled, setGuideEnabled] = useState(false)

  useEffect(() => {
    if (!guideEnabled) clearGuide()
  }, [guideEnabled, clearGuide])

  useEffect(() => { return () => { clearGuide() } }, [clearGuide])

  const handleItemClick = useCallback((itemId: number) => {
    if (guideEnabled) {
      const item = BBS_ITEMS.find(i => i.id === itemId)
      if (item) setBBSGuide(item.id, item.title, item.titleEn)
    }
  }, [guideEnabled, setBBSGuide])

  const totalScore = Object.values(currentScores).reduce((sum, score) => sum + score, 0)
  const completedCount = Object.keys(currentScores).length
  const interpretation = interpretBBSScore(totalScore)

  const handleReset = useCallback(() => {
    resetCurrentSession()
    setSaveSuccess(false)
  }, [resetCurrentSession])

  const handleSave = useCallback(() => {
    if (completedCount < 14) return
    const result = saveResult()
    if (result) {
      setSaveSuccess(true)
      onSave?.({ scores: result.scores, totalScore: result.totalScore, riskLevel: result.riskLevel })
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }, [completedCount, saveResult, onSave])

  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      {/* 범례 + 총점 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-text-primary text-sm">Berg Balance Scale (BBS)</div>
            <div className="flex gap-4 text-[11px] text-text-secondary mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>0-20</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>21-40</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>41-56</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              'text-2xl font-bold',
              interpretation.riskLevel === 'high' ? 'text-red-500' :
              interpretation.riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'
            )}>
              {totalScore}<span className="text-sm text-text-secondary font-normal"> / 56</span>
            </div>
            <div className={cn(
              'text-[11px] font-medium',
              interpretation.riskLevel === 'high' ? 'text-red-500' :
              interpretation.riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'
            )}>
              {interpretation.riskLevel === 'high'
                ? language === 'ko' ? '높은 낙상 위험' : 'High fall risk'
                : interpretation.riskLevel === 'medium'
                ? language === 'ko' ? '중간 낙상 위험' : 'Medium fall risk'
                : language === 'ko' ? '낮은 낙상 위험' : 'Low fall risk'}
            </div>
          </div>
        </div>
      </div>

      {/* 환자 가이드 연동 */}
      <div className="bg-surface rounded-lg border border-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-text-primary">
            {language === 'ko' ? '환자 가이드 연동' : 'Patient Guide'}
          </span>
          {guideEnabled && (
            <a href="/patient-guide" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline">
              ({language === 'ko' ? '새 창 열기' : 'Open'})
            </a>
          )}
        </div>
        <button
          onClick={() => setGuideEnabled(!guideEnabled)}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            guideEnabled ? 'bg-primary' : 'bg-gray-300'
          )}
        >
          <span className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
            guideEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
          )} />
        </button>
      </div>

      {/* 14개 항목 - 실제 평가지 형태 */}
      <div className="space-y-3">
        {BBS_ITEMS.map((item) => {
          const score = currentScores[item.id]
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                'bg-surface rounded-lg border overflow-hidden',
                score !== undefined ? 'border-emerald-500/30' : 'border-border',
                guideEnabled && 'cursor-pointer'
              )}
            >
              {/* 항목 헤더 */}
              <div className="bg-background px-3 py-1.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold',
                    score !== undefined
                      ? 'bg-emerald-500 text-white'
                      : 'bg-border text-text-secondary'
                  )}>
                    {item.id}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{item.titleEn}</span>
                  <span className="text-[10px] text-text-secondary">({item.title})</span>
                </div>
                {score !== undefined && (
                  <span className="text-xs font-bold text-emerald-500">{score}점</span>
                )}
              </div>

              {/* 지시문 */}
              {item.instruction && (
                <div className="px-3 py-1 bg-primary/5 border-b border-border">
                  <span className="text-[10px] text-primary font-medium">
                    {language === 'ko' ? '지시: ' : 'Instruction: '}{item.instruction}
                  </span>
                </div>
              )}

              {/* 점수 옵션 - 모두 펼쳐서 보이기 */}
              <div className="divide-y divide-border/50">
                {item.scores.map((option) => (
                  <button
                    key={option.score}
                    onClick={(e) => {
                      e.stopPropagation()
                      setScore(item.id, score === option.score ? undefined as unknown as number : option.score)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors',
                      score === option.score
                        ? 'bg-primary/10'
                        : 'hover:bg-background/50'
                    )}
                  >
                    <span className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold flex-shrink-0',
                      score === option.score
                        ? 'bg-primary text-white'
                        : 'bg-background border border-border text-text-secondary'
                    )}>
                      {option.score}
                    </span>
                    <span className={cn(
                      'text-[11px] leading-tight',
                      score === option.score ? 'text-primary font-medium' : 'text-text-primary'
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 진행 상황 */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-1">
        <span>{completedCount} / 14 {language === 'ko' ? '항목 완료' : 'completed'}</span>
        <div className="h-1.5 w-28 rounded-full bg-background overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / 14) * 100}%` }}
          />
        </div>
      </div>

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

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleReset} className="flex-1 h-9 text-sm">
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          {language === 'ko' ? '초기화' : 'Reset'}
        </Button>
        <Button onClick={handleSave} disabled={completedCount < 14} className="flex-1 h-9 text-sm">
          <Save className="mr-2 h-3.5 w-3.5" />
          {language === 'ko' ? '결과 저장' : 'Save Results'}
        </Button>
      </div>
    </div>
  )
}
