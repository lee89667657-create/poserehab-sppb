'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useROMAssessmentStore } from '@/stores/rom-assessment-store'
import { ROM_ITEMS } from '@/types/assessments'
import type { ROMSideScore } from '@/types/assessments'
import { cn } from '@/lib/utils'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useAuth } from '@/hooks/use-auth'
import { saveAssessmentToSupabase } from '@/lib/supabase-save'

// 구조화된 값 → 화면 표시 문자열
const valuesToDisplay = (side: ROMSideScore, valueKeys: string[]): string => {
  const vals = valueKeys.map((k) => side[k])
  if (vals.every((v) => v === null || v === undefined)) return ''
  return vals.map((v) => (v !== null && v !== undefined ? v : '')).join('/')
}

// 입력 문자열 → 구조화된 값
const parseInputToValues = (input: string, valueKeys: string[]): ROMSideScore => {
  const parts = input.split('/').map((s) => s.trim())
  return Object.fromEntries(
    valueKeys.map((k, i) => {
      const raw = parts[i]
      const num = raw !== undefined && raw !== '' ? Number(raw) : null
      return [k, num !== null && !isNaN(num) ? num : null]
    })
  )
}

// 구조화된 값으로 정상/제한 판정
const getStatus = (side: ROMSideScore, placeholder: string, valueKeys: string[]): 'normal' | 'limited' | null => {
  const maxes = placeholder.split('/').map(Number)
  const vals = valueKeys.map((k) => side[k])
  if (vals.every((v) => v === null || v === undefined)) return null
  return vals.every((v, i) => v !== null && v !== undefined && v >= maxes[i]) ? 'normal' : 'limited'
}

export function ROMAssessment() {
  const router = useRouter()
  const { language } = useTranslation()
  const { currentScores, setScore, resetCurrentSession, saveResult } = useROMAssessmentStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { selectedPatientId } = usePatientContextStore()
  const { user } = useAuth()

  const completedCount = Object.values(currentScores).filter(
    (s) =>
      Object.values(s.lt).some((v) => v !== null) ||
      Object.values(s.rt).some((v) => v !== null)
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
          assessmentType: 'ROM',
          score: null,
          details: { scores: result.scores },
        })
      }
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }, [saveResult, selectedPatientId, user?.id])

  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      {/* 범례 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="font-medium text-text-primary text-sm mb-1">Range of Motion (ROM)</div>
        <div className="flex gap-4 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{language === 'ko' ? '정상 범위' : 'Normal range'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{language === 'ko' ? '제한' : 'Limited'}</span>
          </div>
        </div>
      </div>

      {/* 평가 테이블 */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left text-xs font-semibold text-text-primary px-3 py-2">
                Joint Motion
              </th>
              <th className="text-center text-xs font-semibold text-text-secondary py-2 w-[90px]">
                {language === 'ko' ? '범위' : 'Range'}
              </th>
              <th className="text-center text-xs font-semibold text-text-primary py-2 w-[80px]">
                Lt.
              </th>
              <th className="text-center text-xs font-semibold text-text-primary py-2 w-[80px]">
                Rt.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROM_ITEMS.map((item) => {
              const score = currentScores[item.id] || { lt: {}, rt: {} }
              const ltDisplay = valuesToDisplay(score.lt, item.valueKeys)
              const rtDisplay = valuesToDisplay(score.rt, item.valueKeys)
              const ltStatus = getStatus(score.lt, item.placeholder, item.valueKeys)
              const rtStatus = getStatus(score.rt, item.placeholder, item.valueKeys)

              const emptyValues = Object.fromEntries(item.valueKeys.map((k) => [k, null]))

              return (
                <tr key={item.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-3 py-1.5">
                    <div className="text-xs font-medium text-text-primary leading-tight">{item.name}</div>
                  </td>
                  <td className="py-1.5 text-center">
                    <span className="text-[10px] text-text-secondary">
                      {item.normalRange}{item.unit}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <div className="flex justify-center">
                      <ROMInput
                        value={ltDisplay}
                        onCommit={(v) => setScore(item.id, 'lt', v ? parseInputToValues(v, item.valueKeys) : emptyValues)}
                        status={ltStatus}
                        placeholder={item.placeholder}
                      />
                    </div>
                  </td>
                  <td className="py-1.5">
                    <div className="flex justify-center">
                      <ROMInput
                        value={rtDisplay}
                        onCommit={(v) => setScore(item.id, 'rt', v ? parseInputToValues(v, item.valueKeys) : emptyValues)}
                        status={rtStatus}
                        placeholder={item.placeholder}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 진행 상황 */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-1">
        <span>{completedCount} / {ROM_ITEMS.length} {language === 'ko' ? '항목 완료' : 'completed'}</span>
        <div className="h-1.5 w-28 rounded-full bg-background overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / ROM_ITEMS.length) * 100}%` }}
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
    </div>
  )
}

function ROMInput({
  value,
  onCommit,
  status,
  placeholder,
}: {
  value: string
  onCommit: (v: string | null) => void
  status: 'normal' | 'limited' | null
  placeholder: string
}) {
  const isCombo = placeholder.includes('/')
  const [localValue, setLocalValue] = useState(value)

  // 외부에서 값이 바뀔 때 동기화 (초기화 등)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const commitValue = (v: string) => {
    // 빈칸이면 placeholder(정상범위)를 자동 채움
    const finalValue = v === '' ? placeholder : v
    setLocalValue(finalValue)
    onCommit(finalValue)
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => commitValue(localValue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commitValue(localValue)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      placeholder={placeholder}
      className={cn(
        'h-7 rounded border text-center text-xs font-medium',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        'placeholder:text-text-secondary/40',
        isCombo ? 'w-[68px]' : 'w-[54px]',
        status === null
          ? 'bg-background border-border text-text-secondary'
          : status === 'normal'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
      )}
    />
  )
}
