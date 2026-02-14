'use client'

import { useCallback } from 'react'
import { Wand2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSoapStore } from '@/stores/soap-store'
import { cn } from '@/lib/utils'

type SoapTab = 'subjective' | 'objective' | 'assessment' | 'plan'

const TAB_CONFIG: { key: SoapTab; label: string; short: string }[] = [
  { key: 'subjective', label: 'Subjective (주관적)', short: 'S' },
  { key: 'objective', label: 'Objective (객관적)', short: 'O' },
  { key: 'assessment', label: 'Assessment (평가)', short: 'A' },
  { key: 'plan', label: 'Plan (계획)', short: 'P' },
]

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <textarea
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <input
        type={type}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function SubjectiveTab() {
  const { subjective, updateSubjective } = useSoapStore()

  return (
    <div className="space-y-4">
      <LabeledTextarea
        label="주호소 (Chief Complaint)"
        value={subjective.chiefComplaint}
        onChange={(v) => updateSubjective({ chiefComplaint: v })}
        placeholder="환자가 호소하는 주된 증상을 기술하세요"
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">
          통증 척도 (Pain Scale): {subjective.painScale}/10
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">0</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={subjective.painScale}
            onChange={(e) => updateSubjective({ painScale: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-text-secondary">10</span>
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white',
              subjective.painScale <= 3 ? 'bg-emerald-500' :
              subjective.painScale <= 6 ? 'bg-amber-500' : 'bg-red-500'
            )}
          >
            {subjective.painScale}
          </span>
        </div>
      </div>

      <LabeledTextarea
        label="증상 설명 (Symptom Description)"
        value={subjective.symptomDescription}
        onChange={(v) => updateSubjective({ symptomDescription: v })}
        placeholder="증상의 양상, 빈도, 강도 등을 기술하세요"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabeledInput
          label="통증 부위 (Pain Location)"
          value={subjective.painLocation}
          onChange={(v) => updateSubjective({ painLocation: v })}
          placeholder="예: 왼쪽 어깨 전면부"
        />
        <LabeledInput
          label="발병 시기 (Onset)"
          value={subjective.onset}
          onChange={(v) => updateSubjective({ onset: v })}
          placeholder="예: 2주 전 갑자기"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabeledTextarea
          label="악화 요인 (Aggravating)"
          value={subjective.aggravating}
          onChange={(v) => updateSubjective({ aggravating: v })}
          rows={2}
          placeholder="통증을 악화시키는 동작이나 상황"
        />
        <LabeledTextarea
          label="완화 요인 (Relieving)"
          value={subjective.relieving}
          onChange={(v) => updateSubjective({ relieving: v })}
          rows={2}
          placeholder="통증을 완화시키는 동작이나 상황"
        />
      </div>
    </div>
  )
}

function ObjectiveTab() {
  const { objective, updateObjective } = useSoapStore()

  return (
    <div className="space-y-4">
      <LabeledTextarea
        label="자동 분석 소견 (Auto Findings)"
        value={objective.autoFindings}
        onChange={(v) => updateObjective({ autoFindings: v })}
        rows={5}
        placeholder="AI 분석 결과가 여기에 자동으로 채워집니다"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabeledTextarea
          label="ROM (관절가동범위)"
          value={objective.rom}
          onChange={(v) => updateObjective({ rom: v })}
          rows={2}
          placeholder="예: Lt. shoulder flexion 120/180"
        />
        <LabeledTextarea
          label="MMT (도수근력검사)"
          value={objective.mmt}
          onChange={(v) => updateObjective({ mmt: v })}
          rows={2}
          placeholder="예: Lt. deltoid 3+/5"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabeledTextarea
          label="특수검사 (Special Tests)"
          value={objective.specialTests}
          onChange={(v) => updateObjective({ specialTests: v })}
          rows={2}
          placeholder="예: Neer (+), Empty can (+)"
        />
        <LabeledTextarea
          label="촉진 (Palpation)"
          value={objective.palpation}
          onChange={(v) => updateObjective({ palpation: v })}
          rows={2}
          placeholder="예: 극상근 건 압통 (+)"
        />
      </div>

      <LabeledTextarea
        label="보행 분석 (Gait)"
        value={objective.gait}
        onChange={(v) => updateObjective({ gait: v })}
        rows={2}
        placeholder="예: 좌측 편위, 보행속도 0.6m/s"
      />

      <LabeledTextarea
        label="추가 소견 (Additional Findings)"
        value={objective.additionalFindings}
        onChange={(v) => updateObjective({ additionalFindings: v })}
        rows={2}
        placeholder="기타 관찰 소견"
      />
    </div>
  )
}

function AssessmentTab() {
  const { assessment, updateAssessment } = useSoapStore()

  return (
    <div className="space-y-4">
      <LabeledTextarea
        label="임상적 인상 (Clinical Impression)"
        value={assessment.clinicalImpression}
        onChange={(v) => updateAssessment({ clinicalImpression: v })}
        rows={4}
        placeholder="진단, 문제점, 임상적 해석을 기술하세요"
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">
          진행 수준 (Progress Level)
        </label>
        <select
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={assessment.progressLevel}
          onChange={(e) => updateAssessment({ progressLevel: e.target.value })}
        >
          <option value="initial">초기 (Initial)</option>
          <option value="improving">호전 (Improving)</option>
          <option value="plateau">정체 (Plateau)</option>
          <option value="worsening">악화 (Worsening)</option>
        </select>
      </div>

      <LabeledTextarea
        label="기능적 수준 (Functional Level)"
        value={assessment.functionalLevel}
        onChange={(v) => updateAssessment({ functionalLevel: v })}
        rows={2}
        placeholder="예: Modified Independence, FIM 95/126"
      />

      <LabeledTextarea
        label="목표 (Goals)"
        value={assessment.goals}
        onChange={(v) => updateAssessment({ goals: v })}
        rows={3}
        placeholder="단기 및 장기 치료 목표를 기술하세요"
      />
    </div>
  )
}

function PlanTab() {
  const { plan, updatePlan } = useSoapStore()

  return (
    <div className="space-y-4">
      <LabeledTextarea
        label="치료 계획 (Treatment)"
        value={plan.treatment}
        onChange={(v) => updatePlan({ treatment: v })}
        rows={3}
        placeholder="치료 방법과 절차를 기술하세요"
      />

      <LabeledTextarea
        label="가정 운동 프로그램 (HEP)"
        value={plan.hep}
        onChange={(v) => updatePlan({ hep: v })}
        rows={3}
        placeholder="환자에게 처방할 가정 운동을 기술하세요"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LabeledInput
          label="치료 빈도 (Frequency)"
          value={plan.frequency}
          onChange={(v) => updatePlan({ frequency: v })}
          placeholder="예: 주 3회"
        />
        <LabeledInput
          label="치료 기간 (Duration)"
          value={plan.duration}
          onChange={(v) => updatePlan({ duration: v })}
          placeholder="예: 6주"
        />
        <LabeledInput
          label="다음 방문 (Next Visit)"
          value={plan.nextVisit}
          onChange={(v) => updatePlan({ nextVisit: v })}
          placeholder="예: 2026-02-22"
        />
      </div>

      <LabeledTextarea
        label="주의사항 (Precautions)"
        value={plan.precautions}
        onChange={(v) => updatePlan({ precautions: v })}
        rows={2}
        placeholder="금기사항, 주의할 활동 등"
      />

      <LabeledTextarea
        label="의뢰 (Referral)"
        value={plan.referral}
        onChange={(v) => updatePlan({ referral: v })}
        rows={2}
        placeholder="타 진료과 의뢰 내용"
      />
    </div>
  )
}

export function SoapForm() {
  const { activeTab, setActiveTab, objective, assessment, plan, updateObjective, updateAssessment, updatePlan } = useSoapStore()

  const handleAutoFill = useCallback(() => {
    if (!objective.autoFindings) {
      updateObjective({ autoFindings: '자세 분석 결과: 전방두부자세(FHP) 관찰됨. 양측 어깨 높이 비대칭 (좌 > 우 1.2cm). 흉추 과후만 경향.' })
    }
    if (!objective.rom) {
      updateObjective({ rom: 'Cervical: Flexion 40/50, Extension 45/60, Rotation Lt 65/80, Rt 70/80' })
    }
    if (!objective.mmt) {
      updateObjective({ mmt: 'Cervical flexors 4/5, Scapular retractors 3+/5, Deep neck flexors 3/5' })
    }
    if (!assessment.clinicalImpression) {
      updateAssessment({ clinicalImpression: '상위교차증후군 소견. 경추부 근력 불균형 및 흉추 가동성 제한 관찰됨.' })
    }
    if (!assessment.functionalLevel) {
      updateAssessment({ functionalLevel: '일상생활 독립적. 장시간 좌식 시 경부 통증 호소.' })
    }
    if (!assessment.goals) {
      updateAssessment({ goals: '단기: 경부 ROM 정상화 (4주)\n장기: 자세 교정 및 통증 해소 (8주)' })
    }
    if (!plan.treatment) {
      updatePlan({ treatment: '경추 가동술, 흉추 가동술, 심부 경근 강화운동, 견갑골 안정화 운동' })
    }
    if (!plan.hep) {
      updatePlan({ hep: '턱 당기기 운동 10회x3세트, 흉추 폼롤러 스트레칭 5분, 견갑골 세팅 운동 10회x3세트' })
    }
    if (!plan.frequency) {
      updatePlan({ frequency: '주 3회' })
    }
    if (!plan.duration) {
      updatePlan({ duration: '8주' })
    }
  }, [objective, assessment, plan, updateObjective, updateAssessment, updatePlan])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">SOAP 기록</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAutoFill}>
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            자동채우기
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tab Buttons */}
        <div className="mb-4 flex gap-1 rounded-lg bg-background p-1">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
            >
              <span className="sm:hidden">{tab.short}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'subjective' && <SubjectiveTab />}
        {activeTab === 'objective' && <ObjectiveTab />}
        {activeTab === 'assessment' && <AssessmentTab />}
        {activeTab === 'plan' && <PlanTab />}
      </CardContent>
    </Card>
  )
}
