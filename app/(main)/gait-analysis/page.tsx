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
  Stethoscope,
  Briefcase,
  User,
  Users,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BBSAssessment } from '@/components/bbs'
import { MMTAssessment, ROMAssessment, FACAssessment } from '@/components/assessments'
import { MBIAssessment } from '@/components/assessments/mbi-assessment'
import { HandFunctionAssessment } from '@/components/assessments/hand-function-assessment'
import { useTranslation } from '@/hooks/use-translation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type TherapyCategory = 'physical' | 'occupational'
type PhysicalAssessment = 'mmt' | 'rom' | 'bbs' | 'fac'
type OccupationalAssessment = 'mbi' | 'handFunction'
type AssessmentType = PhysicalAssessment | OccupationalAssessment

const PHYSICAL_TABS = [
  { id: 'mmt' as const, label: 'MMT', icon: Dumbbell, desc: '도수근력', descEn: 'Muscle' },
  { id: 'rom' as const, label: 'ROM', icon: Ruler, desc: '관절가동', descEn: 'Range' },
  { id: 'bbs' as const, label: 'BBS', icon: Scale, desc: '균형척도', descEn: 'Balance' },
  { id: 'fac' as const, label: 'FAC', icon: PersonStanding, desc: '보행분류', descEn: 'Gait' },
]

const OCCUPATIONAL_TABS = [
  { id: 'mbi' as const, label: 'MBI', icon: ClipboardList, desc: '일상생활', descEn: 'ADL' },
  { id: 'handFunction' as const, label: 'Hand', icon: Hand, desc: '손기능', descEn: 'Hand' },
]

export default function AssessmentToolsPage() {
  const { language } = useTranslation()
  const router = useRouter()
  const { selectedPatientId, selectedPatientName } = usePatientContextStore()
  const [category, setCategory] = useState<TherapyCategory>('physical')
  const [physicalAssessment, setPhysicalAssessment] = useState<PhysicalAssessment>('mmt')
  const [occupationalAssessment, setOccupationalAssessment] = useState<OccupationalAssessment>('mbi')

  const currentAssessment: AssessmentType = category === 'physical' ? physicalAssessment : occupationalAssessment

  // 환자 미선택 시 안내
  if (!selectedPatientId) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-6xl p-4 lg:p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-text-secondary/30 mb-4" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {language === 'ko' ? '환자를 먼저 선택해주세요' : 'Please Select a Patient First'}
              </h2>
              <p className="text-sm text-text-secondary mb-6 text-center">
                {language === 'ko'
                  ? '환자 목록에서 환자를 선택한 후 평가를 진행할 수 있습니다'
                  : 'Select a patient from the list before starting an assessment'}
              </p>
              <Button onClick={() => router.push('/patients')}>
                <Users className="mr-2 h-4 w-4" />
                {language === 'ko' ? '환자 목록으로' : 'Go to Patients'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
        {/* 선택된 환자 정보 배너 */}
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{selectedPatientName}</p>
            <p className="text-xs text-text-secondary">
              {language === 'ko' ? '평가 결과가 이 환자에게 저장됩니다' : 'Assessment results will be saved for this patient'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/patients/${selectedPatientId}`)}>
            {language === 'ko' ? '상세' : 'Detail'}
          </Button>
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-2xl font-bold">
              {language === 'ko' ? '평가 도구' : 'Assessment Tools'}
            </h1>
            <p className="text-text-secondary text-sm">
              {language === 'ko'
                ? '물리치료 및 작업치료 평가'
                : 'Physical & Occupational Therapy Assessments'}
            </p>
          </div>

          <Link href="/gait-analysis/history">
            <Button variant="outline" size="sm">
              <History className="mr-1.5 h-4 w-4" />
              {language === 'ko' ? '기록' : 'History'}
            </Button>
          </Link>
        </div>

        {/* 치료 카테고리 탭 (물리치료 / 작업치료) */}
        <div className="bg-surface rounded-xl border border-border p-1.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCategory('physical')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all',
                category === 'physical'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              <Stethoscope className="h-5 w-5" />
              <div>
                <div className="text-sm font-semibold">
                  {language === 'ko' ? '물리치료' : 'Physical Therapy'}
                </div>
                <div className={cn('text-xs', category === 'physical' ? 'text-white/70' : 'text-text-secondary')}>
                  MMT, ROM, BBS, FAC
                </div>
              </div>
            </button>
            <button
              onClick={() => setCategory('occupational')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all',
                category === 'occupational'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              <Briefcase className="h-5 w-5" />
              <div>
                <div className="text-sm font-semibold">
                  {language === 'ko' ? '작업치료' : 'Occupational Therapy'}
                </div>
                <div className={cn('text-xs', category === 'occupational' ? 'text-white/70' : 'text-text-secondary')}>
                  MBI, Hand Function
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 하위 평가 도구 탭 */}
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border border-border p-1.5"
        >
          {category === 'physical' ? (
            <div className="grid grid-cols-4 gap-1">
              {PHYSICAL_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = physicalAssessment === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPhysicalAssessment(tab.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 font-medium transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-xs font-semibold">{tab.label}</div>
                    <div className={cn('text-[10px]', isActive ? 'text-white/80' : 'text-text-secondary')}>
                      {language === 'ko' ? tab.desc : tab.descEn}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {OCCUPATIONAL_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = occupationalAssessment === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOccupationalAssessment(tab.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-3 font-medium transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-xs font-semibold">{tab.label}</div>
                    <div className={cn('text-[10px]', isActive ? 'text-white/80' : 'text-text-secondary')}>
                      {language === 'ko' ? tab.desc : tab.descEn}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* 평가 콘텐츠 */}
        <motion.div
          key={currentAssessment}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 물리치료 평가 */}
          {currentAssessment === 'mmt' && <MMTAssessment />}
          {currentAssessment === 'rom' && <ROMAssessment />}
          {currentAssessment === 'bbs' && <BBSAssessment />}
          {currentAssessment === 'fac' && <FACAssessment />}

          {/* 작업치료 평가 */}
          {currentAssessment === 'mbi' && <MBIAssessment />}
          {currentAssessment === 'handFunction' && <HandFunctionAssessment />}
        </motion.div>
      </div>
    </MainLayout>
  )
}
