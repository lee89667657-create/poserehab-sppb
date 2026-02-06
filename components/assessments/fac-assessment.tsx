'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useFACStore } from '@/stores/fac-store'
import { FAC_LEVELS } from '@/types/assessments'
import { cn } from '@/lib/utils'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'

export function FACAssessment() {
  const router = useRouter()
  const { language } = useTranslation()
  const { currentLevel, currentNotes, setLevel, setNotes, resetCurrentSession, saveResult } = useFACStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()

  const handleReset = useCallback(() => {
    resetCurrentSession()
    setSaveSuccess(false)
  }, [resetCurrentSession])

  const handleSave = useCallback(async () => {
    const result = saveResult()
    if (result) {
      setSaveSuccess(true)
      if (selectedPatientId && user?.id) {
        await saveAssessmentToSupabase({
          patientId: selectedPatientId,
          therapistId: user.id,
          assessmentType: 'FAC',
          score: result.level,
          details: { notes: result.notes },
        })
      }
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }, [saveResult, selectedPatientId, user?.id])

  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      {/* 범례 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="font-medium text-text-primary text-sm mb-1">
          Functional Ambulation Classification (FAC)
          {currentLevel !== null && (
            <span className={cn(
              'ml-2 text-xs font-medium',
              currentLevel >= 4 ? 'text-emerald-500' : currentLevel >= 2 ? 'text-amber-500' : 'text-red-500'
            )}>
              — FAC {currentLevel}
            </span>
          )}
        </div>
        <div className="flex gap-4 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>0-1: {language === 'ko' ? '보행 불가/의존' : 'Non-functional'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>2-3: {language === 'ko' ? '보조 필요' : 'Assisted'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>4-5: {language === 'ko' ? '독립 보행' : 'Independent'}</span>
          </div>
        </div>
      </div>

      {/* 평가 테이블 */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-center text-xs font-semibold text-text-secondary py-2 w-[50px]">
                {language === 'ko' ? '등급' : 'Level'}
              </th>
              <th className="text-left text-xs font-semibold text-text-primary px-3 py-2">
                {language === 'ko' ? '설명' : 'Description'}
              </th>
              <th className="text-center text-xs font-semibold text-text-primary py-2 w-[60px]">
                {language === 'ko' ? '선택' : 'Select'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FAC_LEVELS.map((level) => (
              <tr
                key={level.value}
                onClick={() => setLevel(level.value)}
                className={cn(
                  'cursor-pointer transition-colors',
                  currentLevel === level.value ? 'bg-primary/5' : 'hover:bg-background/50'
                )}
              >
                <td className="text-center py-1.5">
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold',
                    currentLevel === level.value
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-text-secondary'
                  )}>
                    {level.value}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="text-xs font-medium text-text-primary leading-tight">
                    {language === 'ko' ? level.description : level.descriptionEn}
                  </div>
                </td>
                <td className="text-center py-1.5">
                  <div className="flex justify-center">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 transition-all',
                      currentLevel === level.value
                        ? 'border-primary bg-primary'
                        : 'border-border bg-background'
                    )}>
                      {currentLevel === level.value && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 메모 */}
      <div className="bg-surface rounded-lg border border-border p-3">
        <label className="block text-xs font-medium text-text-primary mb-1.5">
          {language === 'ko' ? '메모 (선택)' : 'Notes (optional)'}
        </label>
        <textarea
          value={currentNotes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={language === 'ko' ? '추가 관찰 사항...' : 'Additional observations...'}
          className="w-full h-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
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
        <Button onClick={handleSave} disabled={currentLevel === null} className="flex-1 h-9 text-sm">
          <Save className="mr-2 h-3.5 w-3.5" />
          {language === 'ko' ? '결과 저장' : 'Save Results'}
        </Button>
      </div>
    </div>
  )
}
