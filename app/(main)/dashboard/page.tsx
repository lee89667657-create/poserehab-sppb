'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  Dumbbell,
  TrendingUp,
  ChevronRight,
  Calendar,
  Activity,
  User,
  Heart,
  ArrowUpRight,
  Users,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { usePatientAssessments } from '@/hooks/use-patient-assessments'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import type { Patient } from '@/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const { language } = useTranslation()
  const { selectedPatientId, selectedPatientName } = usePatientContextStore()

  const [patient, setPatient] = useState<Patient | null>(null)
  const { trendData, clinicalComments, assessmentList, isLoading } = usePatientAssessments(selectedPatientId || undefined)

  // 환자 정보 가져오기
  useEffect(() => {
    if (!selectedPatientId) return
    supabase
      .from('patients')
      .select('*')
      .eq('id', selectedPatientId)
      .single()
      .then(({ data }) => {
        if (data) setPatient(data as Patient)
      })
  }, [selectedPatientId])

  const recentAssessments = useMemo(() => assessmentList.slice(0, 7), [assessmentList])

  // 통계 데이터
  const todayStr = new Date().toDateString()
  const todayAssessments = assessmentList.filter(
    (a) => new Date(a.timestamp).toDateString() === todayStr
  ).length
  const complianceRate = 78 // 간단 기본값

  const commentColorMap: Record<string, { bg: string; border: string; icon: string }> = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', icon: 'text-blue-500' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: 'text-emerald-500' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/30', icon: 'text-violet-500' },
  }

  // 환자 미선택 시 안내
  if (!selectedPatientId) {
    return (
      <MainLayout title={language === 'ko' ? '환자 대시보드' : 'Patient Dashboard'}>
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-text-secondary/30 mb-4" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {language === 'ko' ? '환자를 선택해주세요' : 'Select a Patient'}
              </h2>
              <p className="text-sm text-text-secondary mb-6 text-center">
                {language === 'ko'
                  ? '환자 목록에서 환자를 선택하면 대시보드가 표시됩니다'
                  : 'Select a patient from the list to view their dashboard'}
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

  const statCards = [
    {
      title: language === 'ko' ? '오늘 평가' : 'Today',
      value: `${todayAssessments}${language === 'ko' ? '건' : ''}`,
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      title: language === 'ko' ? '총 평가' : 'Total',
      value: `${assessmentList.length}${language === 'ko' ? '건' : ''}`,
      icon: Dumbbell,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      title: language === 'ko' ? '재활이행률' : 'Compliance',
      value: `${complianceRate}%`,
      icon: Activity,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
    },
  ]

  // 재활이행률 도넛 차트 데이터
  const complianceData = [
    { name: '이행', value: complianceRate },
    { name: '미이행', value: 100 - complianceRate },
  ]
  const COMPLIANCE_COLORS = ['hsl(var(--primary))', 'hsl(var(--border))']

  return (
    <MainLayout title={language === 'ko' ? '환자 대시보드' : 'Patient Dashboard'}>
      <div className="mx-auto max-w-6xl space-y-6">

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
                      ({language === 'ko' ? '재원 ' : 'Day '}
                      {Math.floor((Date.now() - new Date(patient.admission_date).getTime()) / (1000 * 60 * 60 * 24))}
                      {language === 'ko' ? '일' : ''})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 상단: 숫자 카드 3개 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', card.bgColor)}>
                    <card.icon className={cn('h-6 w-6', card.color)} />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">{card.title}</p>
                    <p className="text-3xl font-bold text-text-primary">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 중앙: 원형 그래프 + 선 그래프 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* 좌측: 재활이행률 원형 그래프 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {language === 'ko' ? '재활이행률' : 'Compliance Rate'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pb-6">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {complianceData.map((_, i) => (
                          <Cell key={i} fill={COMPLIANCE_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-text-primary">{complianceRate}%</span>
                    <span className="text-xs text-text-secondary">
                      {language === 'ko' ? '이번 주' : 'This week'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 우측: 평가 점수 추이 선 그래프 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === 'ko' ? '평가 점수 추이' : 'Score Trend'}
                  </CardTitle>
                  <Link href="/data-records">
                    <span className="flex items-center gap-1 text-xs text-primary hover:underline">
                      {language === 'ko' ? '상세보기' : 'View Details'}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
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
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-sm text-text-secondary">
                    {language === 'ko' ? '아직 평가 데이터가 없습니다' : 'No assessment data yet'}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 임상 코멘트 */}
        {clinicalComments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
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
          </motion.div>
        )}

        {/* 하단: 최근 평가 리스트 */}
        {recentAssessments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === 'ko' ? '최근 평가 기록' : 'Recent Assessments'}
                  </CardTitle>
                  <Link href="/data-records">
                    <span className="flex items-center gap-1 text-xs text-primary hover:underline">
                      {language === 'ko' ? '전체보기' : 'View All'}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
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
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
