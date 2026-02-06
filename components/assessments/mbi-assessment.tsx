'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, CheckCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMBIStore } from '@/stores/mbi-store'
import { MBI_ITEMS } from '@/types/assessments'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'
import { useRouter } from 'next/navigation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'

export function MBIAssessment() {
  const router = useRouter()
  const { language } = useTranslation()
  const { currentScores, notes, setScore, setNotes, getTotalScore, saveResult, reset } = useMBIStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()

  const totalScore = getTotalScore()
  const completedCount = Object.keys(currentScores).length

  const handleSave = async () => {
    const result = saveResult()
    if (result) {
      setSaveSuccess(true)
      if (selectedPatientId && user?.id) {
        await saveAssessmentToSupabase({
          patientId: selectedPatientId,
          therapistId: user.id,
          assessmentType: 'MBI',
          score: result.totalScore,
          details: { scores: result.scores },
        })
      }
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const getDependencyLabel = (score: number) => {
    if (score >= 91) return { label: language === 'ko' ? '완전 독립' : 'Complete Independence', color: 'text-emerald-500' }
    if (score >= 75) return { label: language === 'ko' ? '약간 의존' : 'Slight Dependence', color: 'text-green-500' }
    if (score >= 50) return { label: language === 'ko' ? '중등도 의존' : 'Moderate Dependence', color: 'text-amber-500' }
    if (score >= 25) return { label: language === 'ko' ? '심한 의존' : 'Severe Dependence', color: 'text-orange-500' }
    return { label: language === 'ko' ? '완전 의존' : 'Total Dependence', color: 'text-red-500' }
  }

  const dep = getDependencyLabel(totalScore)

  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      {/* 범례 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="font-medium text-text-primary text-sm mb-1">
          Modified Barthel Index (MBI) — {totalScore}/100
          <span className={cn('ml-2 text-xs font-medium', dep.color)}>{dep.label}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>91-100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>75-90</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>50-74</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>25-49</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>0-24</span>
          </div>
        </div>
      </div>

      {/* 평가 테이블 */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left text-xs font-semibold text-text-primary px-3 py-2">
                {language === 'ko' ? '항목' : 'Item'}
              </th>
              <th className="text-center text-xs font-semibold text-text-secondary py-2 w-[50px]">
                Max
              </th>
              <th className="text-center text-xs font-semibold text-text-primary py-2 w-[200px]">
                {language === 'ko' ? '점수' : 'Score'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MBI_ITEMS.map((item) => (
              <tr key={item.id} className="hover:bg-background/50 transition-colors">
                <td className="px-3 py-1.5">
                  <div className="text-xs font-medium text-text-primary leading-tight">
                    {language === 'ko' ? item.name : item.nameEn}
                  </div>
                  <div className="text-[10px] text-text-secondary leading-tight">
                    {language === 'ko' ? item.nameEn : item.name}
                  </div>
                </td>
                <td className="text-center py-1.5">
                  <span className="text-[10px] text-text-secondary">{item.maxScore}</span>
                </td>
                <td className="py-1.5">
                  <div className="flex items-center justify-center gap-0.5">
                    {item.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setScore(item.id, option)}
                        className={cn(
                          'w-6 h-6 rounded text-[11px] font-bold transition-all',
                          currentScores[item.id] === option
                            ? 'bg-primary text-white shadow-sm scale-110'
                            : 'bg-background border border-border text-text-secondary hover:border-primary/50 hover:text-primary'
                        )}
                      >
                        {option}
                      </button>
                    ))}
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
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={language === 'ko' ? '추가 메모...' : 'Additional notes...'}
          className="w-full h-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* 진행 상황 */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-1">
        <span>{completedCount} / {MBI_ITEMS.length} {language === 'ko' ? '항목 완료' : 'completed'}</span>
        <div className="h-1.5 w-28 rounded-full bg-background overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / MBI_ITEMS.length) * 100}%` }}
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
        <Button variant="outline" onClick={reset} className="flex-1 h-9 text-sm">
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          {language === 'ko' ? '초기화' : 'Reset'}
        </Button>
        <Button onClick={handleSave} disabled={completedCount === 0} className="flex-1 h-9 text-sm">
          <Save className="mr-2 h-3.5 w-3.5" />
          {language === 'ko' ? '결과 저장' : 'Save Results'}
        </Button>
      </div>
    </div>
  )
}
