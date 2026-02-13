'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  History,
  Scale,
  Dumbbell,
  Ruler,
  PersonStanding,
  ClipboardList,
  Hand,
  Users,
  Activity,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BBSAssessment } from '@/components/bbs'
import { MMTAssessment, ROMAssessment, FACAssessment, ASIAAssessment } from '@/components/assessments'
import { MBIAssessment } from '@/components/assessments/mbi-assessment'
import { HandFunctionAssessment } from '@/components/assessments/hand-function-assessment'
import { useTranslation } from '@/hooks/use-translation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type TherapyCategory = 'physical' | 'occupational'
type PhysicalAssessment = 'mmt' | 'rom' | 'bbs' | 'fac' | 'asia'
type OccupationalAssessment = 'mbi' | 'handFunction'
type AssessmentType = PhysicalAssessment | OccupationalAssessment

const PHYSICAL_TABS = [
  { id: 'mmt' as const, label: 'MMT', icon: Dumbbell },
  { id: 'rom' as const, label: 'ROM', icon: Ruler },
  { id: 'bbs' as const, label: 'BBS', icon: Scale },
  { id: 'fac' as const, label: 'FAC', icon: PersonStanding },
  { id: 'asia' as const, label: 'ASIA', icon: Activity },
]

const OCCUPATIONAL_TABS = [
  { id: 'mbi' as const, label: 'MBI', icon: ClipboardList },
  { id: 'handFunction' as const, label: 'Hand', icon: Hand },
]

export default function AssessmentToolsPage() {
  const { language } = useTranslation()
  const router = useRouter()
  const {
    selectedPatientId, selectedPatientName,
    selectedPatientAge, selectedPatientGender, selectedPatientDiagnosis,
  } = usePatientContextStore()
  const [category, setCategory] = useState<TherapyCategory>('physical')
  const [physicalAssessment, setPhysicalAssessment] = useState<PhysicalAssessment>('mmt')
  const [occupationalAssessment, setOccupationalAssessment] = useState<OccupationalAssessment>('mbi')

  const currentAssessment: AssessmentType = category === 'physical' ? physicalAssessment : occupationalAssessment
  const isKo = language === 'ko'

  // 환자 미선택 시 안내
  if (!selectedPatientId) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-6xl p-4 lg:p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-text-secondary/30 mb-4" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {isKo ? '환자를 먼저 선택해주세요' : 'Please Select a Patient First'}
              </h2>
              <p className="text-sm text-text-secondary mb-6 text-center">
                {isKo
                  ? '환자 목록에서 환자를 선택한 후 평가를 진행할 수 있습니다'
                  : 'Select a patient from the list before starting an assessment'}
              </p>
              <Button onClick={() => router.push('/patients')}>
                <Users className="mr-2 h-4 w-4" />
                {isKo ? '환자 목록으로' : 'Go to Patients'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // 환자 정보 한 줄 텍스트
  const patientSummary = [
    selectedPatientName,
    selectedPatientAge != null ? `${selectedPatientAge}${isKo ? '세' : 'y'}${selectedPatientGender ? `/${selectedPatientGender}` : ''}` : null,
    selectedPatientDiagnosis,
  ].filter(Boolean).join(' · ')

  const currentTabs = category === 'physical' ? PHYSICAL_TABS : OCCUPATIONAL_TABS
  const currentTabId = category === 'physical' ? physicalAssessment : occupationalAssessment
  const setCurrentTab = (id: string) => {
    if (category === 'physical') setPhysicalAssessment(id as PhysicalAssessment)
    else setOccupationalAssessment(id as OccupationalAssessment)
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        {/* ── 컴팩트 상단 바: 환자정보 + 카테고리 + 평가도구 탭 ── */}
        <div className="sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 bg-background/95 backdrop-blur-sm border-b border-border pb-2 pt-3 space-y-2">
          {/* Row 1: 환자정보 + 기록 버튼 */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => router.push(`/patients/${selectedPatientId}`)}
              className="flex items-center gap-1.5 min-w-0 text-left hover:text-primary transition-colors"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">P</span>
              </div>
              <span className="text-xs font-medium text-text-primary truncate">
                {patientSummary}
              </span>
            </button>
            <Link href="/gait-analysis/history" className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                <History className="h-3 w-3" />
                {isKo ? '기록' : 'History'}
              </Button>
            </Link>
          </div>

          {/* Row 2: 카테고리 + 평가도구 탭 (한 줄) */}
          <div className="flex items-center gap-1.5">
            {/* 카테고리 토글 */}
            <div className="flex rounded-md border border-border bg-surface p-0.5 flex-shrink-0">
              <button
                onClick={() => setCategory('physical')}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-semibold transition-colors',
                  category === 'physical'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {isKo ? 'PT' : 'PT'}
              </button>
              <button
                onClick={() => setCategory('occupational')}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-semibold transition-colors',
                  category === 'occupational'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {isKo ? 'OT' : 'OT'}
              </button>
            </div>

            {/* 구분선 */}
            <div className="w-px h-4 bg-border flex-shrink-0" />

            {/* 평가도구 탭 */}
            <div className="flex gap-0.5 overflow-x-auto">
              {currentTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentTabId === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── 평가 콘텐츠 ── */}
        <motion.div
          key={currentAssessment}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="pt-4 pb-6"
        >
          {currentAssessment === 'mmt' && <MMTAssessment />}
          {currentAssessment === 'rom' && <ROMAssessment />}
          {currentAssessment === 'bbs' && <BBSAssessment />}
          {currentAssessment === 'fac' && <FACAssessment />}
          {currentAssessment === 'asia' && <ASIAAssessment />}
          {currentAssessment === 'mbi' && <MBIAssessment />}
          {currentAssessment === 'handFunction' && <HandFunctionAssessment />}
        </motion.div>
      </div>
    </MainLayout>
  )
}
