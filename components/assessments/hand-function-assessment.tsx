'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, CheckCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHandFunctionStore } from '@/stores/hand-function-store'
import { HAND_FUNCTION_ITEMS } from '@/types/assessments'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'
import { useRouter } from 'next/navigation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'

export function HandFunctionAssessment() {
  const router = useRouter()
  const { language } = useTranslation()
  const {
    currentScores, notes, setScore, setNotes,
    getLeftTotalScore, getRightTotalScore, saveResult, reset,
  } = useHandFunctionStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()

  const leftTotal = getLeftTotalScore()
  const rightTotal = getRightTotalScore()
  const completedCount = Object.keys(currentScores).length

  const handleSave = async () => {
    const result = saveResult()
    if (result) {
      setSaveSuccess(true)
      if (selectedPatientId && user?.id) {
        await saveAssessmentToSupabase({
          patientId: selectedPatientId,
          therapistId: user.id,
          assessmentType: 'HandFunction',
          score: null,
          details: { scores: result.scores, leftTotalScore: result.leftTotalScore, rightTotalScore: result.rightTotalScore },
        })
      }
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const strengthItems = HAND_FUNCTION_ITEMS.filter(item => item.category === 'strength')
  const selectItems = HAND_FUNCTION_ITEMS.filter(item => item.type === 'select')

  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      {/* 범례 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="font-medium text-text-primary text-sm mb-1">
          Hand Function Test
          <span className="ml-2 text-xs text-blue-600">Lt. {leftTotal}/32</span>
          <span className="ml-2 text-xs text-rose-600">Rt. {rightTotal}/32</span>
        </div>
        <div className="text-[11px] text-text-secondary">
          {language === 'ko' ? '상지 기능 평가 (좌/우 구분)' : 'Upper Limb Function (Left/Right)'}
        </div>
      </div>

      {/* Strength 측정값 테이블 */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="bg-background border-b border-border px-3 py-1.5">
          <span className="text-xs font-semibold text-text-primary">
            {language === 'ko' ? 'Strength (측정값)' : 'Strength (Measurements)'}
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="text-left text-xs font-semibold text-text-primary px-3 py-2">
                {language === 'ko' ? '항목' : 'Item'}
              </th>
              <th className="text-center text-xs font-semibold text-blue-600 py-2 w-[80px]">Lt.</th>
              <th className="text-center text-xs font-semibold text-rose-600 py-2 w-[80px]">Rt.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {strengthItems.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-background/50"
              >
                <td className="px-3 py-1.5">
                  <div className="text-xs font-medium text-text-primary leading-tight">{item.nameEn}</div>
                  <div className="text-[10px] text-text-secondary leading-tight">({item.unit})</div>
                </td>
                <td className="py-1.5">
                  <div className="flex justify-center">
                    <input
                      type="number"
                      step="0.1"
                      value={currentScores[item.id]?.left ?? ''}
                      onChange={(e) => setScore(item.id, 'left', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="-"
                      className="w-[54px] h-7 rounded border border-border bg-background text-center text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </td>
                <td className="py-1.5">
                  <div className="flex justify-center">
                    <input
                      type="number"
                      step="0.1"
                      value={currentScores[item.id]?.right ?? ''}
                      onChange={(e) => setScore(item.id, 'right', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="-"
                      className="w-[54px] h-7 rounded border border-border bg-background text-center text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Motor / Grasp / Dexterity 테이블 */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="bg-background border-b border-border px-3 py-1.5">
          <span className="text-xs font-semibold text-text-primary">
            {language === 'ko' ? 'Motor / Grasp / Dexterity (점수)' : 'Motor / Grasp / Dexterity (Scores)'}
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="text-left text-xs font-semibold text-text-primary px-3 py-2">
                {language === 'ko' ? '항목' : 'Item'}
              </th>
              <th className="text-center text-xs font-semibold text-blue-600 py-2 w-[150px]">Lt.</th>
              <th className="text-center text-xs font-semibold text-rose-600 py-2 w-[150px]">Rt.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {selectItems.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-background/50"
              >
                <td className="px-3 py-1.5">
                  <div className="text-xs font-medium text-text-primary leading-tight">{item.nameEn}</div>
                  <div className="text-[10px] text-text-secondary leading-tight">{item.name}</div>
                </td>
                <td className="py-1.5">
                  <div className="flex items-center justify-center gap-0.5">
                    {item.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={(e) => { e.stopPropagation(); setScore(item.id, 'left', opt) }}
                        className={cn(
                          'w-6 h-6 rounded text-[11px] font-bold transition-all',
                          currentScores[item.id]?.left === opt
                            ? 'bg-blue-500 text-white shadow-sm scale-110'
                            : 'bg-background border border-border text-text-secondary hover:border-blue-400 hover:text-blue-500'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-1.5">
                  <div className="flex items-center justify-center gap-0.5">
                    {item.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={(e) => { e.stopPropagation(); setScore(item.id, 'right', opt) }}
                        className={cn(
                          'w-6 h-6 rounded text-[11px] font-bold transition-all',
                          currentScores[item.id]?.right === opt
                            ? 'bg-rose-500 text-white shadow-sm scale-110'
                            : 'bg-background border border-border text-text-secondary hover:border-rose-400 hover:text-rose-500'
                        )}
                      >
                        {opt}
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
        <span>{completedCount} / {HAND_FUNCTION_ITEMS.length} {language === 'ko' ? '항목 완료' : 'completed'}</span>
        <div className="h-1.5 w-28 rounded-full bg-background overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / HAND_FUNCTION_ITEMS.length) * 100}%` }}
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
