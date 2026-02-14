'use client'

import { useState, useMemo, Suspense } from 'react'
import { usePatientAssessments } from '@/hooks/use-patient-assessments'
import { buildSummaryFromDB } from '@/hooks/use-assessment-summary'
import { useSearchParams, useRouter } from 'next/navigation'
import { ClipboardList, TrendingUp, Send, ArrowLeft, User } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useSoapStore } from '@/stores/soap-store'
import { useAssessmentSummary } from '@/hooks/use-assessment-summary'
import { AssessmentReport } from '@/components/reports/assessment-report'
import { ProgressReport } from '@/components/reports/progress-report'
import { ReferralReport } from '@/components/reports/referral-report'
import type { Severity, SoapNotes } from '@/types/anatomy'
import { cn } from '@/lib/utils'

type ReportType = 'assessment' | 'progress' | 'referral'

// Default mock data (used when no patient context)
const defaultSoap: SoapNotes = {
  subjective: {
    chiefComplaint: '왼쪽 어깨 통증 및 거상 제한',
    painScale: 6,
    symptomDescription: '3주 전부터 왼쪽 어깨 전방부 통증 호소.',
    painLocation: '왼쪽 어깨 전면부',
    onset: '3주 전 점진적 발생',
    aggravating: '오버헤드 동작, 측와위 수면',
    relieving: '안정 시, 온찜질 후',
  },
  objective: {
    autoFindings: '좌측 어깨 ROM 제한: Flexion 140/180, Abduction 130/180.',
    rom: 'Lt. shoulder Flexion 140/180, Abduction 130/180, ER 55/90',
    mmt: 'Lt. supraspinatus 3+/5, Lt. infraspinatus 4-/5',
    specialTests: 'Neer (+), Hawkins (+), Empty can (+/-)',
    palpation: '극상근 건 압통 (+)',
    gait: '정상',
    additionalFindings: '상위교차증후군 패턴 관찰',
  },
  assessment: {
    clinicalImpression: '좌측 견관절 충돌 증후군 의심.',
    progressLevel: 'initial',
    functionalLevel: '일상생활 독립적이나 오버헤드 활동 제한',
    goals: '단기: 통증 VAS 3 이하 (4주)\n장기: 정상 ROM 회복 (8주)',
  },
  plan: {
    treatment: '견관절 가동술, 회전근개 강화운동',
    hep: '코드만 진자운동 10min, 외회전 밴드운동 15rep x 3set',
    frequency: '주 3회',
    duration: '8주',
    nextVisit: '',
    precautions: '오버헤드 활동 제한',
    referral: '',
  },
}

const defaultRegions: { regionKey: string; regionName: string; severity: Severity; reason: string }[] = [
  { regionKey: 'shoulder_l', regionName: '왼쪽 어깨', severity: 'moderate', reason: 'ROM 제한, 회전근개 약화' },
  { regionKey: 'neck_l', regionName: '목 (좌)', severity: 'mild', reason: '경추 측굴 제한' },
  { regionKey: 'upper_back_l', regionName: '상부 등 (좌)', severity: 'mild', reason: '능형근 약화' },
  { regionKey: 'chest_l', regionName: '가슴 (좌)', severity: 'mild', reason: '소흉근 단축' },
  { regionKey: 'shoulder_r', regionName: '오른쪽 어깨', severity: 'normal', reason: '' },
  { regionKey: 'lower_back_l', regionName: '허리 (좌)', severity: 'normal', reason: '' },
]

const defaultSnapshots = [
  {
    date: '2026-01-15',
    regions: [
      { regionKey: 'shoulder_l', regionName: '왼쪽 어깨', severity: 'severe' as Severity },
      { regionKey: 'neck_l', regionName: '목 (좌)', severity: 'moderate' as Severity },
    ],
  },
  {
    date: '2026-01-29',
    regions: [
      { regionKey: 'shoulder_l', regionName: '왼쪽 어깨', severity: 'moderate' as Severity },
      { regionKey: 'neck_l', regionName: '목 (좌)', severity: 'mild' as Severity },
    ],
  },
  {
    date: '2026-02-12',
    regions: [
      { regionKey: 'shoulder_l', regionName: '왼쪽 어깨', severity: 'moderate' as Severity },
      { regionKey: 'neck_l', regionName: '목 (좌)', severity: 'mild' as Severity },
    ],
  },
]

function ReportsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useTranslation()
  const [selected, setSelected] = useState<ReportType>('assessment')

  const {
    selectedPatientId,
    selectedPatientName,
    selectedPatientAge,
    selectedPatientGender,
    selectedPatientDiagnosis,
  } = usePatientContextStore()

  const { subjective, objective, assessment, plan } = useSoapStore()
  const localSummary = useAssessmentSummary()

  const patientIdParam = searchParams.get('patient')
  const hasPatientContext = patientIdParam && selectedPatientId === patientIdParam && selectedPatientName

  // Fetch Supabase assessments when patient is selected
  const { assessments: dbAssessments } = usePatientAssessments(
    hasPatientContext ? patientIdParam! : undefined
  )
  const dbSummary = useMemo(
    () => (dbAssessments.length > 0 ? buildSummaryFromDB(dbAssessments) : null),
    [dbAssessments]
  )

  // Supabase data takes priority, localStorage as fallback
  const scoreCards = dbSummary?.scoreCards ?? localSummary.scoreCards
  const trendData = dbSummary?.trendData ?? localSummary.trendData
  const mmtSummary = dbSummary?.mmtSummary ?? localSummary.mmtSummary
  const romSummary = dbSummary?.romSummary ?? localSummary.romSummary

  // Use SOAP store data if available, otherwise default
  const soapHasContent = subjective.chiefComplaint || objective.autoFindings || assessment.clinicalImpression
  const soapData: SoapNotes = soapHasContent
    ? { subjective, objective, assessment, plan }
    : defaultSoap

  const patientName = hasPatientContext ? selectedPatientName! : '김철수'
  const patientDiagnosis = hasPatientContext && selectedPatientDiagnosis ? selectedPatientDiagnosis : '좌측 견관절 충돌 증후군'
  const today = new Date().toISOString().split('T')[0]

  const reportTypes: { key: ReportType; label: string; description: string; icon: typeof ClipboardList }[] = [
    {
      key: 'assessment',
      label: language === 'ko' ? '평가 보고서' : 'Assessment Report',
      description: language === 'ko' ? '현재 평가 결과 및 SOAP 요약' : 'Current assessment & SOAP summary',
      icon: ClipboardList,
    },
    {
      key: 'progress',
      label: language === 'ko' ? '경과 보고서' : 'Progress Report',
      description: language === 'ko' ? '중증도 변화 추이 및 비교' : 'Severity trends & comparison',
      icon: TrendingUp,
    },
    {
      key: 'referral',
      label: language === 'ko' ? '의뢰서' : 'Referral',
      description: language === 'ko' ? '타 진료과 의뢰 문서' : 'Referral document',
      icon: Send,
    },
  ]

  return (
    <MainLayout title={language === 'ko' ? '보고서' : 'Reports'}>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Patient Context Banner */}
        {hasPatientContext && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{selectedPatientName}</span>
                  <span className="text-xs text-text-secondary">
                    {selectedPatientAge}세 / {selectedPatientGender}
                  </span>
                </div>
                {selectedPatientDiagnosis && (
                  <p className="text-xs text-text-secondary">{selectedPatientDiagnosis}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/patients/${selectedPatientId}`)}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {language === 'ko' ? '환자 상세' : 'Patient Detail'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {reportTypes.map((rt) => (
            <button
              key={rt.key}
              onClick={() => setSelected(rt.key)}
              className="text-left"
            >
              <Card
                className={cn(
                  'transition-all hover:shadow-md cursor-pointer',
                  selected === rt.key && 'border-primary/50 bg-primary/5'
                )}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      selected === rt.key ? 'bg-primary/20' : 'bg-background'
                    )}
                  >
                    <rt.icon
                      className={cn(
                        'h-5 w-5',
                        selected === rt.key ? 'text-primary' : 'text-text-secondary'
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        selected === rt.key ? 'text-primary' : 'text-text-primary'
                      )}
                    >
                      {rt.label}
                    </p>
                    <p className="text-xs text-text-secondary">{rt.description}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        {selected === 'assessment' && (
          <AssessmentReport
            assessmentData={{
              patientName,
              date: today,
              diagnosis: patientDiagnosis,
              regions: defaultRegions,
              soap: soapData,
            }}
            scoreCards={scoreCards}
            trendData={trendData}
            mmtSummary={mmtSummary}
            romSummary={romSummary}
          />
        )}

        {selected === 'progress' && (
          <ProgressReport
            patientName={patientName}
            periodStart="2026-01-15"
            periodEnd={today}
            snapshots={defaultSnapshots}
            assessmentTrend={trendData}
          />
        )}

        {selected === 'referral' && (
          <ReferralReport
            patientName={patientName}
            date={today}
            diagnosis={patientDiagnosis}
            regions={defaultRegions}
            summaryText={
              soapHasContent && assessment.clinicalImpression
                ? assessment.clinicalImpression
                : `${patientDiagnosis}으로 치료 중. 정밀 검사 및 전문의 평가 필요.`
            }
            scoreCards={scoreCards}
            mmtSummary={mmtSummary}
            romSummary={romSummary}
          />
        )}

        {/* Back to patient button */}
        {hasPatientContext && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => router.push(`/patients/${selectedPatientId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === 'ko' ? '환자 상세로 돌아가기' : 'Back to Patient'}
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <ReportsContent />
    </Suspense>
  )
}
