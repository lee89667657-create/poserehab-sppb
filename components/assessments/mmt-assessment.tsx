'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useMMTStore } from '@/stores/mmt-store'
import { MMT_ITEMS, MMT_GRADES } from '@/types/assessments'
import { cn } from '@/lib/utils'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'
import { ReportLinkButton } from '@/components/assessments/report-link-button'

const GRADE_VALUES = [0, 1, 2, 3, 4, 5]

export function MMTAssessment() {
  const router = useRouter()
  const { language } = useTranslation()
  const { currentScores, setScore, resetCurrentSession, saveResult } = useMMTStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()

  const completedCount = Object.values(currentScores).filter(
    (s) => s.lt !== null || s.rt !== null
  ).length

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
          assessmentType: 'MMT',
          score: null,
          details: { scores: result.scores },
        })
      }
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }, [saveResult, selectedPatientId, user?.id])

  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      {/* MMT Grading Scale 범례 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="font-medium text-text-primary text-sm mb-2">MMT Grading Scale</div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
          {MMT_GRADES.map((grade) => (
            <div key={grade.value} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-primary/10 text-primary font-bold text-[10px] flex-shrink-0">
                {grade.value}
              </span>
              <span className="text-primary font-medium w-10 text-[11px]">{grade.grade}</span>
              <span className="truncate">{grade.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 평가 테이블 */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left text-xs font-semibold text-text-primary px-3 py-2">
                Muscle Group
              </th>
              <th className="text-center text-xs font-semibold text-text-primary py-2 w-[170px]">
                Lt.
              </th>
              <th className="text-center text-xs font-semibold text-text-primary py-2 w-[170px]">
                Rt.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MMT_ITEMS.map((item) => {
              const score = currentScores[item.id] || { lt: null, rt: null }
              return (
                <tr key={item.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-3 py-1.5">
                    <div className="text-xs font-medium text-text-primary leading-tight">{item.name}</div>
                  </td>
                  <td className="py-1.5">
                    <GradeButtons
                      value={score.lt}
                      onChange={(v) => setScore(item.id, 'lt', v)}
                    />
                  </td>
                  <td className="py-1.5">
                    <GradeButtons
                      value={score.rt}
                      onChange={(v) => setScore(item.id, 'rt', v)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 진행 상황 */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-1">
        <span>{completedCount} / {MMT_ITEMS.length} {language === 'ko' ? '항목 완료' : 'completed'}</span>
        <div className="h-1.5 w-28 rounded-full bg-background overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / MMT_ITEMS.length) * 100}%` }}
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
        <Button onClick={handleSave} disabled={completedCount === 0} className="flex-1 h-9 text-sm">
          <Save className="mr-2 h-3.5 w-3.5" />
          {language === 'ko' ? '결과 저장' : 'Save Results'}
        </Button>
      </div>
      <ReportLinkButton show={saveSuccess} />
    </div>
  )
}

/** 버튼식 등급 선택 [0][1][2][3][4][5] */
function GradeButtons({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {GRADE_VALUES.map((grade) => (
        <button
          key={grade}
          onClick={() => onChange(value === grade ? null : grade)}
          className={cn(
            'w-6 h-6 rounded text-[11px] font-bold transition-all',
            value === grade
              ? 'bg-primary text-white shadow-sm scale-110'
              : 'bg-background border border-border text-text-secondary hover:border-primary/50 hover:text-primary'
          )}
        >
          {grade}
        </button>
      ))}
    </div>
  )
}
