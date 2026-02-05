'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  Dumbbell,
  Users,
  TrendingUp,
  ChevronRight,
  Calendar,
  FileText,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/hooks/use-translation'
import { useExerciseStore } from '@/stores/exercise-store'
import { useBBSStore } from '@/stores/bbs-store'
import { useMMTStore } from '@/stores/mmt-store'
import { useFACStore } from '@/stores/fac-store'
import { useMBIStore } from '@/stores/mbi-store'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { t, language } = useTranslation()
  const { exerciseRecords } = useExerciseStore()
  const bbsStore = useBBSStore()
  const mmtStore = useMMTStore()
  const facStore = useFACStore()
  const mbiStore = useMBIStore()

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0]

  // 모든 평가 기록 통합
  const allAssessments = useMemo(() => {
    const items: { id: string; type: string; timestamp: number; score?: number; label: string }[] = []

    bbsStore.history.forEach((r) => {
      items.push({ id: r.id, type: 'BBS', timestamp: r.timestamp, score: r.totalScore, label: `BBS ${r.totalScore}/56` })
    })
    mmtStore.history.forEach((r) => {
      items.push({ id: r.id, type: 'MMT', timestamp: r.timestamp, label: 'MMT' })
    })
    facStore.history.forEach((r: { id: string; timestamp: number; level: number }) => {
      items.push({ id: r.id, type: 'FAC', timestamp: r.timestamp, score: r.level, label: `FAC ${r.level}` })
    })
    mbiStore.history.forEach((r: { id: string; timestamp: number; totalScore: number }) => {
      items.push({ id: r.id, type: 'MBI', timestamp: r.timestamp, score: r.totalScore, label: `MBI ${r.totalScore}/100` })
    })

    return items.sort((a, b) => b.timestamp - a.timestamp)
  }, [bbsStore.history, mmtStore.history, facStore.history, mbiStore.history])

  // 오늘 평가 수
  const todayAssessmentCount = allAssessments.filter((a) => {
    const d = new Date(a.timestamp).toISOString().split('T')[0]
    return d === today
  }).length

  // 오늘 운동 세션 수
  const todayExerciseCount = exerciseRecords.filter((r) => r.date === today).length

  // 환자 수 (고정값 - 실제 DB 연동 전 mock)
  const totalPatients = 12

  // 재활이행률 계산 (이번 주 운동 일수 / 7일)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weeklyRecords = exerciseRecords.filter((r) => new Date(r.date) >= weekStart)
  const weeklyDays = new Set(weeklyRecords.map((r) => r.date)).size
  const complianceRate = Math.round((weeklyDays / 7) * 100)

  const complianceData = [
    { name: language === 'ko' ? '이행' : 'Done', value: complianceRate },
    { name: language === 'ko' ? '미이행' : 'Remaining', value: 100 - complianceRate },
  ]
  const COMPLIANCE_COLORS = ['hsl(var(--primary))', 'hsl(var(--border))']

  // 평가 점수 추이 (BBS 기준, 최근 8개)
  const scoreTrendData = useMemo(() => {
    return bbsStore.history
      .slice(0, 8)
      .reverse()
      .map((r) => ({
        date: new Date(r.timestamp).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        BBS: r.totalScore,
      }))
  }, [bbsStore.history, language])

  // MBI 점수 추이
  const mbiTrendData = useMemo(() => {
    return mbiStore.history
      .slice(0, 8)
      .reverse()
      .map((r: { timestamp: number; totalScore: number }) => ({
        date: new Date(r.timestamp).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        MBI: r.totalScore,
      }))
  }, [mbiStore.history, language])

  // 통합 추이 데이터
  const trendData = useMemo(() => {
    const dateMap = new Map<string, { date: string; BBS?: number; MBI?: number }>()

    scoreTrendData.forEach((d) => {
      const existing = dateMap.get(d.date) || { date: d.date }
      existing.BBS = d.BBS
      dateMap.set(d.date, existing)
    })
    mbiTrendData.forEach((d) => {
      const existing = dateMap.get(d.date) || { date: d.date }
      existing.MBI = d.MBI
      dateMap.set(d.date, existing)
    })

    return Array.from(dateMap.values())
  }, [scoreTrendData, mbiTrendData])

  // 최근 평가 5개
  const recentAssessments = allAssessments.slice(0, 5)

  const statCards = [
    {
      title: t('dashboard.todayAssessments'),
      value: todayAssessmentCount,
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      title: t('dashboard.exerciseSessions'),
      value: todayExerciseCount,
      icon: Dumbbell,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      title: t('dashboard.totalPatients'),
      value: totalPatients,
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
    },
  ]

  return (
    <MainLayout title={t('dashboard.title')}>
      <div className="mx-auto max-w-6xl space-y-6">
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
                <CardTitle className="text-base">{t('dashboard.rehabCompliance')}</CardTitle>
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
                      {weeklyDays}/7 {language === 'ko' ? '일' : 'days'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-center text-sm text-text-secondary">
                  {language === 'ko' ? '이번 주 운동 이행률' : 'Weekly exercise compliance'}
                </p>
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
                  <CardTitle className="text-base">{t('dashboard.scoreTrend')}</CardTitle>
                  <Link href="/data-records">
                    <span className="flex items-center gap-1 text-xs text-primary hover:underline">
                      {language === 'ko' ? '상세보기' : 'Details'}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis className="text-[10px]" tick={{ fill: 'hsl(var(--text-secondary))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--surface))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="BBS" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="MBI" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[220px] flex-col items-center justify-center text-text-secondary">
                    <TrendingUp className="mb-2 h-10 w-10 opacity-30" />
                    <p className="text-sm">{t('dashboard.noAssessments')}</p>
                    <Link href="/gait-analysis" className="mt-2 text-xs text-primary hover:underline">
                      {language === 'ko' ? '평가 시작하기' : 'Start Assessment'}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 하단: 최근 평가 리스트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('dashboard.recentAssessments')}</CardTitle>
                <Link href="/data-records">
                  <span className="flex items-center gap-1 text-xs text-primary hover:underline">
                    {language === 'ko' ? '전체보기' : 'View All'}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentAssessments.length > 0 ? (
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
                                  {date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}
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
                                {date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-text-secondary">
                  <FileText className="mb-2 h-10 w-10 opacity-30" />
                  <p className="text-sm">{t('dashboard.noAssessments')}</p>
                  <Link href="/gait-analysis" className="mt-2 text-xs text-primary hover:underline">
                    {language === 'ko' ? '첫 평가 시작하기' : 'Start First Assessment'}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
