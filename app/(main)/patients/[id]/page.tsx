'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Heart,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  Dumbbell,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  FileDown,
  Loader2,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { usePatientAssessments } from '@/hooks/use-patient-assessments'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useTranslation } from '@/hooks/use-translation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Patient } from '@/types/database'
import { generatePatientReportPdf } from '@/lib/report/patient-report-pdf'
import { downloadPdf } from '@/lib/report/pdf-generator'
import Link from 'next/link'

type TabType = 'assessments' | 'rehab' | 'changes'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const { user } = useAuth()
  const { language } = useTranslation()
  const { setSelectedPatient } = usePatientContextStore()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('assessments')

  const {
    assessments,
    isLoading,
    latestScores,
    trendData,
    clinicalComments,
    assessmentList,
    byType,
  } = usePatientAssessments(patientId)

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // 환자 정보 가져오기
  useEffect(() => {
    if (!patientId) return
    supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()
      .then(({ data }) => {
        const p = data as Patient | null
        if (p) {
          setPatient(p)
          setSelectedPatient(p.id, p.name, { age: p.age, gender: p.gender, diagnosis: p.diagnosis })
        }
      })
  }, [patientId, setSelectedPatient])

  const recentAssessments = useMemo(() => assessmentList.slice(0, 7), [assessmentList])

  const hasAnyAssessment = assessmentList.length > 0
  const hasBBSorHF = trendData.some(d => d.BBS != null || d.HF != null)
  const hasFAC = trendData.some(d => d.FAC != null)

  const mmtGradeLabel = (grade: number | null | undefined): string => {
    if (grade == null) return '-'
    return ['Zero', 'Trace', 'Poor', 'Fair', 'Good', 'Normal'][grade] || `${grade}`
  }

  const latestHF = useMemo(() => {
    const items = byType['HandFunction']
    if (!items?.length) return null
    const d = items[0].details as Record<string, unknown> | null
    return {
      date: items[0].assessed_at,
      leftTotal: (d?.leftTotalScore as number) ?? null,
      rightTotal: (d?.rightTotalScore as number) ?? null,
    }
  }, [byType])

  const latestMMT = useMemo(() => {
    const items = byType['MMT']
    if (!items?.length) return null
    const d = items[0].details as Record<string, unknown> | null
    const scores = d?.scores as Record<string, { lt: number | null; rt: number | null }> | undefined
    const sLt = scores?.shoulder_flexor?.lt
    const hLt = scores?.hip_flexor?.lt
    return {
      date: items[0].assessed_at,
      summary: `UE ${mmtGradeLabel(sLt)} / LE ${mmtGradeLabel(hLt)}`,
    }
  }, [byType])

  const latestROM = useMemo(() => {
    const items = byType['ROM']
    if (!items?.length) return null
    const d = items[0].details as Record<string, unknown> | null
    const scores = d?.scores as Record<string, unknown> | undefined
    if (!scores || Object.keys(scores).length === 0) return null
    const cnt = Object.keys(scores).length
    return { date: items[0].assessed_at, summary: `${cnt} joints` }
  }, [byType])

  const mmtChange = useMemo(() => {
    const items = byType['MMT']
    if (!items?.length) return null
    const latest = items[0]
    const oldest = items.length >= 2 ? items[items.length - 1] : null
    return {
      latestDate: latest.assessed_at,
      oldestDate: oldest?.assessed_at ?? null,
      latestScores: (latest.details as Record<string, unknown>)?.scores as Record<string, { lt: number | null; rt: number | null }> | undefined,
      oldestScores: oldest ? (oldest.details as Record<string, unknown>)?.scores as Record<string, { lt: number | null; rt: number | null }> | undefined : null,
      hasChange: items.length >= 2,
    }
  }, [byType])

  const romChange = useMemo(() => {
    const items = byType['ROM']
    if (!items?.length) return null
    const latest = items[0]
    const oldest = items.length >= 2 ? items[items.length - 1] : null
    return {
      latestDate: latest.assessed_at,
      oldestDate: oldest?.assessed_at ?? null,
      latestScores: (latest.details as Record<string, unknown>)?.scores as Record<string, Record<string, Record<string, number | null>>> | undefined,
      oldestScores: oldest ? (oldest.details as Record<string, unknown>)?.scores as Record<string, Record<string, Record<string, number | null>>> | undefined : null,
      hasChange: items.length >= 2,
    }
  }, [byType])

  const mmtMuscleGroups = [
    { key: 'shoulder_flexor', label: 'Shoulder Flexors' },
    { key: 'elbow_flexor_extensor', label: 'Elbow Flexors/Extensors' },
    { key: 'hip_flexor', label: 'Hip Flexors' },
    { key: 'knee_extensor', label: 'Knee Extensors' },
    { key: 'ankle_dorsiflexor', label: 'Ankle Dorsiflexors' },
  ]

  const romKeyJoints = [
    { key: 'shoulder_flex_ext', valueKey: 'flexion', label: 'Shoulder Flexion' },
    { key: 'hip_flex_abd', valueKey: 'flexion', label: 'Hip Flexion' },
    { key: 'knee_flexion', valueKey: 'flexion', label: 'Knee Flexion' },
    { key: 'ankle_df_pf', valueKey: 'dorsiflexion', label: 'Ankle Dorsiflexion' },
  ]

  const daysInHospital = patient
    ? Math.floor((Date.now() - new Date(patient.admission_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'assessments', label: language === 'ko' ? '평가 기록' : 'Assessments', icon: ClipboardCheck },
    { value: 'rehab', label: language === 'ko' ? '운동/재활' : 'Rehab', icon: Dumbbell },
    { value: 'changes', label: language === 'ko' ? '재활 경과' : 'Rehab Progress', icon: Sparkles },
  ]

  const commentColorMap: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', icon: 'text-blue-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: 'text-emerald-500' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/30', icon: 'text-violet-500' },
  }

  const handleGoToAssessment = () => {
    if (patient) {
      setSelectedPatient(patient.id, patient.name, { age: patient.age, gender: patient.gender, diagnosis: patient.diagnosis })
    }
    router.push('/gait-analysis')
  }

  const handleGenerateReport = useCallback(async () => {
    if (!patient || assessments.length === 0) return
    setIsGeneratingPdf(true)
    try {
      const blob = await generatePatientReportPdf({
        patient: {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          diagnosis: patient.diagnosis,
          admissionDate: patient.admission_date,
          onsetDate: patient.onset_date,
        },
        assessments,
        language: language as 'ko' | 'en',
      })
      downloadPdf(blob, `${patient.name}_report_${new Date().toISOString().split('T')[0]}.pdf`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [patient, assessments, language])

  if (!patient && !isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary">
            {language === 'ko' ? '환자를 찾을 수 없습니다' : 'Patient not found'}
          </p>
          <Button variant="outline" onClick={() => router.push('/patients')} className="mt-4">
            {language === 'ko' ? '환자 목록으로' : 'Back to Patients'}
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={patient?.name || ''}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push('/patients')}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === 'ko' ? '환자 목록' : 'Patient List'}
        </button>

        {/* 환자 정보 카드 */}
        {patient && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-text-primary">{patient.name}</h2>
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                      {patient.age}세 / {patient.gender}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-red-400" />
                      {patient.diagnosis}
                    </span>
                    {patient.onset_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {language === 'ko' ? '온셋: ' : 'Onset: '}
                        {new Date(patient.onset_date).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {language === 'ko' ? '입원일: ' : 'Admitted: '}
                      {new Date(patient.admission_date).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-xs text-text-secondary/70">
                      ({language === 'ko' ? `재원 ${daysInHospital}일` : `Day ${daysInHospital}`})
                    </span>
                  </div>
                  {patient.history && (
                    <p className="mt-1 text-xs text-text-secondary/70">{patient.history}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 탭 */}
        <div className="flex rounded-lg border border-border bg-surface p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭1: 평가 기록 */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            {/* 상단 요약 카드 5개 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {/* BBS */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600">BBS</span>
                    {latestScores['BBS'] && (
                      <span className="text-[10px] text-text-secondary">
                        {new Date(latestScores['BBS'].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {latestScores['BBS']?.score != null ? latestScores['BBS'].score : '-'}
                    {latestScores['BBS']?.score != null && <span className="text-sm font-normal text-text-secondary">/56</span>}
                  </div>
                </CardContent>
              </Card>

              {/* FAC */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-600">FAC</span>
                    {latestScores['FAC'] && (
                      <span className="text-[10px] text-text-secondary">
                        {new Date(latestScores['FAC'].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {latestScores['FAC']?.score != null ? `Lv.${latestScores['FAC'].score}` : '-'}
                  </div>
                </CardContent>
              </Card>

              {/* Hand Function */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-violet-600">{language === 'ko' ? '상지기능' : 'Hand Func.'}</span>
                    {latestHF && (
                      <span className="text-[10px] text-text-secondary">
                        {new Date(latestHF.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-text-primary">
                    {latestHF ? (
                      <>
                        <span className="text-[10px] font-normal text-text-secondary">Lt </span>{latestHF.leftTotal ?? '-'}
                        <span className="text-[10px] font-normal text-text-secondary"> Rt </span>{latestHF.rightTotal ?? '-'}
                        <span className="text-xs font-normal text-text-secondary">/32</span>
                      </>
                    ) : '-'}
                  </div>
                </CardContent>
              </Card>

              {/* MMT */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600">MMT</span>
                    {latestMMT && (
                      <span className="text-[10px] text-text-secondary">
                        {new Date(latestMMT.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-text-primary">
                    {latestMMT ? latestMMT.summary : '-'}
                  </div>
                </CardContent>
              </Card>

              {/* ROM */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-600">ROM</span>
                    {latestROM && (
                      <span className="text-[10px] text-text-secondary">
                        {new Date(latestROM.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-text-primary">
                    {latestROM ? latestROM.summary : '-'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 점수 추이 그래프 (BBS + Hand Function) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {language === 'ko' ? '점수 추이 (BBS · 상지기능)' : 'Score Trend (BBS · Hand Function)'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {hasBBSorHF ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis
                        yAxisId="left"
                        className="text-[10px]"
                        tick={{ fill: 'hsl(var(--text-secondary))' }}
                        domain={[0, 56]}
                        label={{ value: 'BBS', position: 'insideTopLeft', style: { fontSize: 10, fill: '#2563EB' } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-[10px]"
                        tick={{ fill: 'hsl(var(--text-secondary))' }}
                        domain={[0, 32]}
                        label={{ value: 'HF', position: 'insideTopRight', style: { fontSize: 10, fill: '#7C3AED' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--surface))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'BBS') return [`${value}/56`, 'BBS']
                          if (name === '상지기능') return [`${value}/32`, 'Hand Function']
                          return [value, name]
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="BBS" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, fill: '#2563EB' }} connectNulls />
                      <Line yAxisId="right" type="monotone" dataKey="HF" name="상지기능" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, fill: '#7C3AED' }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                    <TrendingUp className="h-10 w-10 text-text-secondary/20 mb-2" />
                    <p className="text-sm">{language === 'ko' ? '아직 평가 기록이 없습니다' : 'No assessment data yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 등급 추이 그래프 (FAC) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {language === 'ko' ? '보행능력 추이 (FAC)' : 'Ambulation Trend (FAC)'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {hasFAC ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--surface))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`Lv.${value}`, 'FAC']}
                      />
                      <Line type="monotone" dataKey="FAC" stroke="#D97706" strokeWidth={2.5} dot={{ r: 5, fill: '#D97706' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
                    <TrendingUp className="h-10 w-10 text-text-secondary/20 mb-2" />
                    <p className="text-sm">{language === 'ko' ? '아직 평가 기록이 없습니다' : 'No assessment data yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MMT 변화 카드 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === 'ko' ? 'MMT 변화' : 'MMT Changes'}
                  </CardTitle>
                  {mmtChange && (
                    <span className="text-[10px] text-text-secondary">
                      {mmtChange.oldestDate
                        ? `${new Date(mmtChange.oldestDate).toLocaleDateString('ko-KR')} → ${new Date(mmtChange.latestDate).toLocaleDateString('ko-KR')}`
                        : new Date(mmtChange.latestDate).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {mmtChange?.latestScores ? (
                  <div className="space-y-2">
                    {mmtMuscleGroups.map(({ key, label }) => {
                      const latest = mmtChange.latestScores?.[key]
                      const oldest = mmtChange.oldestScores?.[key]
                      if (!latest || latest.lt == null) return null
                      return (
                        <div key={key} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                          <span className="text-xs text-text-secondary">{label}</span>
                          <span className="text-xs font-medium text-text-primary">
                            {mmtChange.hasChange && oldest?.lt != null ? (
                              <>{mmtGradeLabel(oldest.lt)} → <span className="text-primary font-bold">{mmtGradeLabel(latest.lt)}</span></>
                            ) : (
                              <span className="font-bold">{mmtGradeLabel(latest.lt)}</span>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary text-center py-4">
                    {language === 'ko' ? '평가 데이터 없음' : 'No assessment data'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ROM 변화 카드 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === 'ko' ? 'ROM 변화 (주요 관절)' : 'ROM Changes (Key Joints)'}
                  </CardTitle>
                  {romChange && (
                    <span className="text-[10px] text-text-secondary">
                      {romChange.oldestDate
                        ? `${new Date(romChange.oldestDate).toLocaleDateString('ko-KR')} → ${new Date(romChange.latestDate).toLocaleDateString('ko-KR')}`
                        : new Date(romChange.latestDate).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {romChange?.latestScores ? (
                  <div className="space-y-2">
                    {romKeyJoints.map(({ key, valueKey, label }) => {
                      const latestJoint = romChange.latestScores?.[key]
                      const oldestJoint = romChange.oldestScores?.[key]
                      // 좌측 우선, 없으면 우측 값 사용
                      const latestVal = latestJoint?.lt?.[valueKey] ?? latestJoint?.rt?.[valueKey]
                      const oldestVal = oldestJoint?.lt?.[valueKey] ?? oldestJoint?.rt?.[valueKey]
                      const side = latestJoint?.lt?.[valueKey] != null ? 'Lt' : latestJoint?.rt?.[valueKey] != null ? 'Rt' : null
                      if (latestVal == null) return null
                      return (
                        <div key={`${key}-${valueKey}`} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                          <span className="text-xs text-text-secondary">{label}{side === 'Rt' ? ' (Rt)' : ''}</span>
                          <span className="text-xs font-medium text-text-primary">
                            {romChange.hasChange && oldestVal != null ? (
                              <>{oldestVal}° → <span className="text-primary font-bold">{latestVal}°</span></>
                            ) : (
                              <span className="font-bold">{latestVal}°</span>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary text-center py-4">
                    {language === 'ko' ? '평가 데이터 없음' : 'No assessment data'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 새 평가 + 리포트 출력 버튼 */}
            <div className="flex gap-3">
              <Button onClick={handleGoToAssessment} className="flex-1">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {language === 'ko' ? '새 평가 시작' : 'Start New Assessment'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateReport}
                disabled={isGeneratingPdf || assessments.length === 0}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                {language === 'ko' ? '리포트 출력' : 'Export Report'}
              </Button>
            </div>

            {/* 최근 평가 테이블 */}
            {recentAssessments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {language === 'ko' ? '최근 평가 기록' : 'Recent Assessments'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-background">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">
                            {language === 'ko' ? '날짜' : 'Date'}
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">
                            {language === 'ko' ? '평가 유형' : 'Type'}
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">
                            {language === 'ko' ? '결과' : 'Result'}
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary">
                            {language === 'ko' ? '시간' : 'Time'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentAssessments.map((assessment) => {
                          const date = new Date(assessment.timestamp)
                          return (
                            <tr key={assessment.id} className="transition-colors hover:bg-background/50">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                                  <span className="text-xs text-text-primary">
                                    {date.toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  assessment.type === 'BBS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                  assessment.type === 'MMT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                  assessment.type === 'FAC' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                )}>
                                  {assessment.type}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-xs font-medium text-text-primary">{assessment.label}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span className="text-[11px] text-text-secondary">
                                  {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 탭2: 운동/재활 기록 */}
        {activeTab === 'rehab' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="h-12 w-12 text-text-secondary/30 mb-3" />
                <p className="text-sm text-text-secondary mb-4">
                  {language === 'ko'
                    ? '운동 및 재활 기록은 각 도구에서 확인하세요'
                    : 'View exercise and rehab records in each tool'}
                </p>
                <div className="flex gap-3">
                  <Link href="/exercise/list">
                    <Button variant="outline" size="sm">
                      {language === 'ko' ? '운동 목록' : 'Exercises'}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/exercise/games">
                    <Button variant="outline" size="sm">
                      {language === 'ko' ? '재활 게임' : 'Games'}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 탭3: 나의 변화 */}
        {activeTab === 'changes' && (
          <div className="space-y-6">
            {clinicalComments.length > 0 ? (
              <>
                {/* 임상 코멘트 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {language === 'ko' ? '재활 진행 요약' : 'Rehab Progress Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {clinicalComments.map((comment) => {
                        const colors = commentColorMap[comment.color] || commentColorMap.blue
                        return (
                          <div
                            key={comment.type}
                            className={cn('rounded-lg border p-3.5', colors.bg, colors.border)}
                          >
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className={cn('h-4 w-4', colors.icon)} />
                              <span className="text-sm font-semibold text-text-primary">{comment.title}</span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                              {comment.detail}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 점수 변화 하이라이트 - 선 그래프 */}
                {trendData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        {language === 'ko' ? '점수 변화 하이라이트' : 'Score Change Highlights'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* BBS 선 그래프 */}
                        {trendData.some(d => d.BBS != null) && (
                          <div>
                            <p className="text-xs font-semibold text-blue-600 mb-2">BBS (Berg Balance Scale)</p>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                                <YAxis className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} domain={[0, 56]} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                  formatter={(value: number) => [`${value}/56`, 'BBS']}
                                />
                                <Line type="monotone" dataKey="BBS" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 5, fill: '#2563EB' }} activeDot={{ r: 7 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* FAC 선 그래프 */}
                        {trendData.some(d => d.FAC != null) && (
                          <div>
                            <p className="text-xs font-semibold text-amber-600 mb-2">FAC (Functional Ambulation Classification)</p>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                                <YAxis className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                  formatter={(value: number) => [`Lv.${value}`, 'FAC']}
                                />
                                <Line type="monotone" dataKey="FAC" stroke="#D97706" strokeWidth={2.5} dot={{ r: 5, fill: '#D97706' }} activeDot={{ r: 7 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 격려 메시지 */}
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-5 text-center">
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-text-primary">
                      {language === 'ko'
                        ? '꾸준한 재활 노력이 좋은 결과를 만들고 있습니다!'
                        : 'Your consistent rehab efforts are showing great results!'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {language === 'ko'
                        ? '계속 이 페이스를 유지해 주세요 💪'
                        : 'Keep up the great pace!'}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-12 w-12 text-text-secondary/30 mb-3" />
                  <p className="text-sm text-text-secondary">
                    {language === 'ko'
                      ? '평가 기록이 2회 이상 쌓이면 변화를 분석해드립니다'
                      : 'We will analyze changes once 2+ assessments are recorded'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
