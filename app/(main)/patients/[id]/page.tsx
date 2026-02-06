'use client'

import { useState, useEffect, useMemo } from 'react'
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
    isLoading,
    latestScores,
    trendData,
    clinicalComments,
    assessmentList,
  } = usePatientAssessments(patientId)

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
          setSelectedPatient(p.id, p.name)
        }
      })
  }, [patientId, setSelectedPatient])

  const recentAssessments = useMemo(() => assessmentList.slice(0, 7), [assessmentList])

  const daysInHospital = patient
    ? Math.floor((Date.now() - new Date(patient.admission_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'assessments', label: language === 'ko' ? '평가 기록' : 'Assessments', icon: ClipboardCheck },
    { value: 'rehab', label: language === 'ko' ? '운동/재활' : 'Rehab', icon: Dumbbell },
    { value: 'changes', label: language === 'ko' ? '나의 변화' : 'My Changes', icon: Sparkles },
  ]

  const commentColorMap: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', icon: 'text-blue-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: 'text-emerald-500' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/30', icon: 'text-violet-500' },
  }

  const handleGoToAssessment = () => {
    if (patient) {
      setSelectedPatient(patient.id, patient.name)
    }
    router.push('/gait-analysis')
  }

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
            {/* 최신 점수 요약 카드 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { type: 'BBS', label: 'BBS', max: 56, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { type: 'FAC', label: 'FAC', max: 5, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { type: 'MBI', label: 'MBI', max: 100, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { type: 'MMT', label: 'MMT', max: null, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
              ].map((item) => {
                const data = latestScores[item.type]
                return (
                  <Card key={item.type}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn('text-xs font-bold', item.color)}>{item.label}</span>
                        {data && (
                          <span className="text-[10px] text-text-secondary">
                            {new Date(data.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-text-primary">
                        {data?.score !== null && data?.score !== undefined
                          ? item.type === 'FAC'
                            ? `Lv.${data.score}`
                            : data.score
                          : '-'}
                        {data?.score !== null && data?.score !== undefined && item.max && (
                          <span className="text-sm font-normal text-text-secondary">/{item.max}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* 추이 그래프 */}
            {trendData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {language === 'ko' ? '평가 점수 추이' : 'Assessment Score Trend'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis
                        yAxisId="left"
                        className="text-[10px]"
                        tick={{ fill: 'hsl(var(--text-secondary))' }}
                        domain={[0, 100]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-[10px]"
                        tick={{ fill: 'hsl(var(--text-secondary))' }}
                        domain={[0, 5]}
                        ticks={[0, 1, 2, 3, 4, 5]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--surface))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'FAC') return [`Lv.${value}`, name]
                          if (name === 'BBS') return [`${value}/56`, name]
                          if (name === 'MBI') return [`${value}/100`, name]
                          return [value, name]
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="BBS" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      <Line yAxisId="left" type="monotone" dataKey="MBI" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      <Line yAxisId="right" type="monotone" dataKey="FAC" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* 새 평가 버튼 */}
            <Button onClick={handleGoToAssessment} className="w-full">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {language === 'ko' ? '새 평가 시작' : 'Start New Assessment'}
            </Button>

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

                {/* 점수 변화 하이라이트 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      {language === 'ko' ? '점수 변화 하이라이트' : 'Score Change Highlights'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(latestScores).map(([type, data]) => {
                        if (!data.score) return null
                        return (
                          <div key={type} className="flex items-center justify-between rounded-lg bg-background p-3">
                            <span className="text-sm font-medium text-text-primary">{type}</span>
                            <span className="text-lg font-bold text-primary">
                              {type === 'FAC' ? `Lv.${data.score}` : data.score}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

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
