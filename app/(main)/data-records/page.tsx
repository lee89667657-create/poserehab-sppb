'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
  ReferenceArea, LabelList,
} from 'recharts'
import {
  FileDown,
  TrendingUp,
  Minus,
  Calendar,
  ClipboardList,
  Activity,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useExerciseStore } from '@/stores/exercise-store'
import { useBBSStore } from '@/stores/bbs-store'
import { useMMTStore } from '@/stores/mmt-store'
import { useFACStore } from '@/stores/fac-store'
import { useMBIStore } from '@/stores/mbi-store'
import { useROMAssessmentStore } from '@/stores/rom-assessment-store'
import { useHandFunctionStore } from '@/stores/hand-function-store'
import { cn, formatTime } from '@/lib/utils'
import { generateComparisonPdfReport, downloadPdf } from '@/lib/report/pdf-generator'

type TabType = 'overview' | 'assessments' | 'exercise' | 'compliance'
type AssessmentFilter = 'all' | 'BBS' | 'MMT' | 'ROM' | 'FAC' | 'MBI' | 'Hand'

export default function DataRecordsPage() {
  const { language } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [assessmentFilter, setAssessmentFilter] = useState<AssessmentFilter>('all')

  const { exerciseRecords, getTotalStats } = useExerciseStore()
  const bbsStore = useBBSStore()
  const mmtStore = useMMTStore()
  const facStore = useFACStore()
  const mbiStore = useMBIStore()
  const romStore = useROMAssessmentStore()
  const handStore = useHandFunctionStore()

  const isKo = language === 'ko'
  const stats = getTotalStats()

  // 모든 평가 기록 통합
  const allAssessments = useMemo(() => {
    const items: { id: string; type: AssessmentFilter; timestamp: number; score?: number; label: string; detail?: string }[] = []

    bbsStore.history.forEach((r) => {
      const risk = r.totalScore <= 20 ? (isKo ? '높은 위험' : 'High') : r.totalScore <= 40 ? (isKo ? '중간 위험' : 'Medium') : (isKo ? '낮은 위험' : 'Low')
      items.push({ id: r.id, type: 'BBS', timestamp: r.timestamp, score: r.totalScore, label: `${r.totalScore}/56`, detail: risk })
    })
    mmtStore.history.forEach((r) => {
      const count = Object.keys(r.scores).length
      items.push({ id: r.id, type: 'MMT', timestamp: r.timestamp, label: `${count} items`, detail: isKo ? `${count}개 근육군` : `${count} muscle groups` })
    })
    romStore.history.forEach((r) => {
      const count = Object.keys(r.scores).length
      items.push({ id: r.id, type: 'ROM', timestamp: r.timestamp, label: `${count} joints`, detail: isKo ? `${count}개 관절` : `${count} joints` })
    })
    facStore.history.forEach((r: { id: string; timestamp: number; level: number }) => {
      items.push({ id: r.id, type: 'FAC', timestamp: r.timestamp, score: r.level, label: `Level ${r.level}`, detail: isKo ? `보행수준 ${r.level}` : `Ambulation Level ${r.level}` })
    })
    mbiStore.history.forEach((r: { id: string; timestamp: number; totalScore: number }) => {
      const dep = r.totalScore >= 91 ? (isKo ? '독립' : 'Independent') : r.totalScore >= 50 ? (isKo ? '부분의존' : 'Partial') : (isKo ? '의존' : 'Dependent')
      items.push({ id: r.id, type: 'MBI', timestamp: r.timestamp, score: r.totalScore, label: `${r.totalScore}/100`, detail: dep })
    })
    handStore.history.forEach((r) => {
      items.push({ id: r.id, type: 'Hand', timestamp: r.timestamp, label: `Lt.${r.leftTotalScore} / Rt.${r.rightTotalScore}`, detail: isKo ? '손기능' : 'Hand Function' })
    })

    return items.sort((a, b) => b.timestamp - a.timestamp)
  }, [bbsStore.history, mmtStore.history, romStore.history, facStore.history, mbiStore.history, handStore.history, isKo])

  const filteredAssessments = assessmentFilter === 'all'
    ? allAssessments
    : allAssessments.filter((a) => a.type === assessmentFilter)

  // 날짜별 그룹핑 (최신순, 같은 날 안에서는 시간순)
  const groupedByDate = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; items: typeof filteredAssessments }[] = []
    const map = new Map<string, typeof filteredAssessments>()

    filteredAssessments.forEach((a) => {
      const d = new Date(a.timestamp)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(a)
    })

    const dayNames = isKo
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // dateKey 내림차순 (최신순)
    const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a))
    sortedKeys.forEach((dateKey) => {
      const items = map.get(dateKey)!
      // 같은 날 안에서는 시간 오름차순
      items.sort((a, b) => a.timestamp - b.timestamp)
      const d = new Date(items[0].timestamp)
      const dateLabel = isKo
        ? `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`
        : d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
      groups.push({ dateKey, dateLabel, items })
    })

    return groups
  }, [filteredAssessments, isKo])

  // 변화량 계산 헬퍼
  const getChange = (history: { score: number }[]) => {
    if (history.length < 2) return null
    const latest = history[history.length - 1].score
    const previous = history[history.length - 2].score
    return { prev: previous, curr: latest, diff: latest - previous }
  }

  // BBS 전후 비교 데이터
  const bbsCompareData = useMemo(() => {
    return bbsStore.history
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        score: r.totalScore,
      }))
  }, [bbsStore.history, isKo])

  // MBI 전후 비교 데이터
  const mbiCompareData = useMemo(() => {
    return mbiStore.history
      .slice(0, 10)
      .reverse()
      .map((r: { timestamp: number; totalScore: number }, i: number) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        score: r.totalScore,
      }))
  }, [mbiStore.history, isKo])

  // FAC 전후 비교 데이터
  const facCompareData = useMemo(() => {
    return facStore.history
      .slice(0, 10)
      .reverse()
      .map((r: { timestamp: number; level: number }, i: number) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        score: r.level,
      }))
  }, [facStore.history, isKo])

  // MMT 전후 비교 데이터
  const mmtCompareData = useMemo(() => {
    return mmtStore.history
      .slice(0, 10)
      .reverse()
      .map((r, i) => {
        const vals = Object.values(r.scores).flatMap(s => [s.lt, s.rt]).filter((v): v is number => v !== null)
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        return {
          name: `#${i + 1}`,
          date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(avg * 10) / 10,
        }
      })
  }, [mmtStore.history, isKo])

  // Hand Function 전후 비교 데이터
  const handCompareData = useMemo(() => {
    return handStore.history
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        left: r.leftTotalScore,
        right: r.rightTotalScore,
      }))
  }, [handStore.history, isKo])

  // 재활이행률 주간 데이터
  const complianceData = useMemo(() => {
    const weeks: { week: string; rate: number }[] = []
    for (let w = 3; w >= 0; w--) {
      const start = new Date()
      start.setDate(start.getDate() - start.getDay() - w * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)

      const weekRecords = exerciseRecords.filter((r) => {
        const d = new Date(r.date)
        return d >= start && d <= end
      })
      const days = new Set(weekRecords.map((r) => r.date)).size
      const weekLabel = start.toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })
      weeks.push({ week: weekLabel, rate: Math.round((days / 7) * 100) })
    }
    return weeks
  }, [exerciseRecords, isKo])

  // 평가 유형별 분포
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    allAssessments.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [allAssessments])

  const DIST_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      totalAssessments: allAssessments.length,
      totalExerciseSessions: stats.totalSessions,
      totalExerciseTime: stats.totalTime,
      bbs: bbsStore.history.slice(0, 5),
      mbi: mbiStore.history.slice(0, 5),
      compliance: complianceData,
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rehab-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleComparisonReport = async () => {
    const blob = await generateComparisonPdfReport({
      language: language as 'ko' | 'en',
      bbs: { history: bbsStore.history },
      fac: { history: facStore.history },
      mbi: { history: mbiStore.history },
      mmt: { history: mmtStore.history },
      rom: { history: romStore.history },
      hand: { history: handStore.history },
    })
    downloadPdf(blob, `comparison-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const tabs = [
    { id: 'overview' as const, label: isKo ? '종합 요약' : 'Overview', icon: Activity },
    { id: 'assessments' as const, label: isKo ? '평가 기록' : 'Assessments', icon: ClipboardList },
    { id: 'exercise' as const, label: isKo ? '전후 비교' : 'Comparison', icon: TrendingUp },
    { id: 'compliance' as const, label: isKo ? '이행률' : 'Compliance', icon: Users },
  ]

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{isKo ? '데이터 / 기록' : 'Data / Records'}</h1>
            <p className="text-sm text-text-secondary">
              {isKo ? '환자 평가 기록 및 재활 통계' : 'Patient assessment records & rehab statistics'}
            </p>
          </div>
          <Button onClick={handleExportReport} size="sm">
            <FileDown className="mr-1.5 h-4 w-4" />
            {isKo ? '레포트 출력' : 'Export Report'}
          </Button>
        </div>

        {/* 탭 */}
        <div className="bg-surface rounded-xl border border-border p-1.5">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* === 종합 요약 === */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 요약 카드 */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{allAssessments.length}</p>
                    <p className="text-xs text-text-secondary">{isKo ? '총 평가 수' : 'Total Assessments'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{stats.totalSessions}</p>
                    <p className="text-xs text-text-secondary">{isKo ? '운동 세션' : 'Exercise Sessions'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-violet-600">{formatTime(stats.totalTime)}</p>
                    <p className="text-xs text-text-secondary">{isKo ? '총 운동 시간' : 'Total Time'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {complianceData.length > 0 ? complianceData[complianceData.length - 1].rate : 0}%
                    </p>
                    <p className="text-xs text-text-secondary">{isKo ? '이번 주 이행률' : 'This Week'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* 평가 유형 분포 + 최근 기록 */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{isKo ? '평가 유형 분포' : 'Assessment Distribution'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={typeDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {typeDistribution.map((_, i) => (
                              <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center text-sm text-text-secondary">
                        {isKo ? '데이터 없음' : 'No data'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{isKo ? '최근 평가 기록' : 'Recent Records'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {allAssessments.slice(0, 6).map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              a.type === 'BBS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                              a.type === 'MMT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                              a.type === 'FAC' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                              a.type === 'MBI' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              a.type === 'ROM' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' :
                              'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
                            )}>
                              {a.type}
                            </span>
                            <div>
                              <span className="text-xs font-medium text-text-primary">{a.label}</span>
                              {a.detail && <span className="ml-2 text-[10px] text-text-secondary">{a.detail}</span>}
                            </div>
                          </div>
                          <span className="text-[11px] text-text-secondary">
                            {new Date(a.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')}
                          </span>
                        </div>
                      ))}
                      {allAssessments.length === 0 && (
                        <div className="py-8 text-center text-sm text-text-secondary">
                          {isKo ? '아직 기록이 없습니다' : 'No records yet'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* === 평가 기록 === */}
          {activeTab === 'assessments' && (
            <div className="space-y-4">
              {/* 필터 */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'BBS', 'MMT', 'ROM', 'FAC', 'MBI', 'Hand'] as AssessmentFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAssessmentFilter(filter)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      assessmentFilter === filter
                        ? 'bg-primary text-white'
                        : 'bg-background border border-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {filter === 'all' ? (isKo ? '전체' : 'All') : filter}
                    {filter !== 'all' && (
                      <span className="ml-1 opacity-70">
                        ({allAssessments.filter((a) => a.type === filter).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 날짜별 그룹 카드 */}
              {groupedByDate.length > 0 ? (
                <div className="space-y-6">
                  {groupedByDate.map((group) => (
                    <div key={group.dateKey}>
                      {/* 날짜 헤더 */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-text-primary">{group.dateLabel}</h3>
                        <span className="text-[11px] text-text-secondary">({group.items.length})</span>
                      </div>

                      {/* 해당 날짜 평가 카드들 */}
                      <div className="space-y-1.5">
                        {group.items.map((a) => {
                          const time = new Date(a.timestamp).toLocaleTimeString(isKo ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                          return (
                            <div
                              key={a.id}
                              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 transition-colors hover:bg-background/50"
                            >
                              {/* 배지 */}
                              <span className={cn(
                                'inline-flex w-[46px] items-center justify-center rounded-md px-1.5 py-1 text-[11px] font-bold shrink-0',
                                a.type === 'BBS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                a.type === 'MMT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                a.type === 'FAC' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                a.type === 'MBI' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                a.type === 'ROM' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' :
                                'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
                              )}>
                                {a.type}
                              </span>

                              {/* 결과 + 상세 */}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-text-primary">{a.label}</span>
                                {a.detail && (
                                  <span className="ml-2 text-[11px] text-text-secondary">{a.detail}</span>
                                )}
                              </div>

                              {/* 시간 */}
                              <span className="text-[11px] text-text-secondary shrink-0">{time}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-text-secondary">
                  {isKo ? '해당 유형의 기록이 없습니다' : 'No records for this type'}
                </div>
              )}
            </div>
          )}

          {/* === 전후 비교 === */}
          {activeTab === 'exercise' && (
            <div className="space-y-6">
              {/* 비교 탭 헤더 */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {isKo ? '각 평가 도구별 전후 비교를 확인하세요.' : 'Compare before and after for each assessment tool.'}
                </p>
                <Button onClick={handleComparisonReport} size="sm" variant="outline">
                  <FileDown className="mr-1.5 h-4 w-4" />
                  {isKo ? '비교 리포트' : 'Comparison Report'}
                </Button>
              </div>

              {/* ── BBS 비교 카드 ── */}
              {bbsStore.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">BBS (Berg Balance Scale)</CardTitle>
                      <span className="text-xs text-text-secondary">0 - 56</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bbsCompareData.length >= 2 ? (() => {
                      const change = getChange(bbsCompareData)!
                      const prevDate = bbsCompareData[bbsCompareData.length - 2].date
                      const currDate = bbsCompareData[bbsCompareData.length - 1].date
                      const getRisk = (s: number) => s <= 20 ? (isKo ? '높은위험' : 'High') : s <= 40 ? (isKo ? '중간위험' : 'Medium') : (isKo ? '낮은위험' : 'Low')
                      const getRiskColor = (s: number) => s <= 20 ? 'text-red-500' : s <= 40 ? 'text-amber-500' : 'text-emerald-500'
                      return (
                        <div className="space-y-4">
                          {/* 비교 박스 */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{prevDate}</p>
                              <p className="text-lg font-bold text-text-primary">{change.prev}/56</p>
                              <p className={cn('text-[11px] font-medium', getRiskColor(change.prev))}>{getRisk(change.prev)}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              {change.diff > 0 ? <ArrowUp className="h-5 w-5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-text-secondary" />}
                              <p className={cn('text-sm font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                {change.diff > 0 ? `+${change.diff}` : change.diff}
                              </p>
                              <p className="text-[10px] text-text-secondary">{change.diff > 0 ? (isKo ? '향상' : 'Improved') : change.diff < 0 ? (isKo ? '저하' : 'Declined') : (isKo ? '유지' : 'Same')}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{currDate}</p>
                              <p className="text-lg font-bold text-text-primary">{change.curr}/56</p>
                              <p className={cn('text-[11px] font-medium', getRiskColor(change.curr))}>{getRisk(change.curr)}</p>
                            </div>
                          </div>
                          {/* BBS 그래프 (위험구간 배경색) */}
                          <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={bbsCompareData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                              <ReferenceArea y1={0} y2={20} fill="#FEE2E2" fillOpacity={0.5} />
                              <ReferenceArea y1={20} y2={40} fill="#FEF3C7" fillOpacity={0.5} />
                              <ReferenceArea y1={40} y2={56} fill="#D1FAE5" fillOpacity={0.5} />
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <YAxis domain={[0, 56]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} dot={{ r: 5, fill: '#6366F1' }} name="BBS">
                                <LabelList dataKey="score" position="top" style={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} />
                              </Line>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )
                    })() : (
                      <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
                        {isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── FAC 비교 카드 ── */}
              {facStore.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">FAC (Functional Ambulation)</CardTitle>
                      <span className="text-xs text-text-secondary">Level 0 - 5</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {facCompareData.length >= 2 ? (() => {
                      const change = getChange(facCompareData)!
                      const prevDate = facCompareData[facCompareData.length - 2].date
                      const currDate = facCompareData[facCompareData.length - 1].date
                      const getDesc = (l: number) => l <= 1 ? (isKo ? '보조필요' : 'Assisted') : l <= 3 ? (isKo ? '감독필요' : 'Supervised') : (isKo ? '독립보행' : 'Independent')
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{prevDate}</p>
                              <p className="text-lg font-bold text-text-primary">Level {change.prev}</p>
                              <p className="text-[11px] text-text-secondary">{getDesc(change.prev)}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              {change.diff > 0 ? <ArrowUp className="h-5 w-5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-text-secondary" />}
                              <p className={cn('text-sm font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                {change.diff > 0 ? `+${change.diff}` : change.diff}
                              </p>
                              <p className="text-[10px] text-text-secondary">{change.diff > 0 ? (isKo ? '향상' : 'Improved') : change.diff < 0 ? (isKo ? '저하' : 'Declined') : (isKo ? '유지' : 'Same')}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{currDate}</p>
                              <p className="text-lg font-bold text-text-primary">Level {change.curr}</p>
                              <p className="text-[11px] text-text-secondary">{getDesc(change.curr)}</p>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={facCompareData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                              <Bar dataKey="score" fill="#F59E0B" radius={[4, 4, 0, 0]} name="FAC">
                                <LabelList dataKey="score" position="top" style={{ fontSize: 10, fill: '#F59E0B', fontWeight: 600 }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )
                    })() : (
                      <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
                        {isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── MBI 비교 카드 ── */}
              {mbiStore.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">MBI (Modified Barthel Index)</CardTitle>
                      <span className="text-xs text-text-secondary">0 - 100</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mbiCompareData.length >= 2 ? (() => {
                      const change = getChange(mbiCompareData)!
                      const prevDate = mbiCompareData[mbiCompareData.length - 2].date
                      const currDate = mbiCompareData[mbiCompareData.length - 1].date
                      const getDep = (s: number) => s >= 91 ? (isKo ? '독립' : 'Independent') : s >= 50 ? (isKo ? '부분의존' : 'Partial') : (isKo ? '의존' : 'Dependent')
                      const getDepColor = (s: number) => s >= 91 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-red-500'
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{prevDate}</p>
                              <p className="text-lg font-bold text-text-primary">{change.prev}/100</p>
                              <p className={cn('text-[11px] font-medium', getDepColor(change.prev))}>{getDep(change.prev)}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              {change.diff > 0 ? <ArrowUp className="h-5 w-5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-text-secondary" />}
                              <p className={cn('text-sm font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                {change.diff > 0 ? `+${change.diff}` : change.diff}
                              </p>
                              <p className="text-[10px] text-text-secondary">{change.diff > 0 ? (isKo ? '향상' : 'Improved') : change.diff < 0 ? (isKo ? '저하' : 'Declined') : (isKo ? '유지' : 'Same')}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{currDate}</p>
                              <p className="text-lg font-bold text-text-primary">{change.curr}/100</p>
                              <p className={cn('text-[11px] font-medium', getDepColor(change.curr))}>{getDep(change.curr)}</p>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={mbiCompareData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={{ r: 5, fill: '#10B981' }} name="MBI">
                                <LabelList dataKey="score" position="top" style={{ fontSize: 10, fill: '#10B981', fontWeight: 600 }} />
                              </Line>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )
                    })() : (
                      <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
                        {isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── MMT 비교 카드 ── */}
              {mmtStore.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">MMT (Manual Muscle Testing)</CardTitle>
                      <span className="text-xs text-text-secondary">Grade 0 - 5</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mmtCompareData.length >= 2 ? (() => {
                      const change = getChange(mmtCompareData)!
                      const prevDate = mmtCompareData[mmtCompareData.length - 2].date
                      const currDate = mmtCompareData[mmtCompareData.length - 1].date
                      const prevCount = Object.keys(mmtStore.history[mmtStore.history.length - 1]?.scores || {}).length
                      const currCount = Object.keys(mmtStore.history[0]?.scores || {}).length
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{prevDate}</p>
                              <p className="text-lg font-bold text-text-primary">{change.prev}</p>
                              <p className="text-[11px] text-text-secondary">{isKo ? '평균 등급' : 'Avg Grade'}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              {change.diff > 0 ? <ArrowUp className="h-5 w-5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-text-secondary" />}
                              <p className={cn('text-sm font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                {change.diff > 0 ? `+${change.diff}` : change.diff}
                              </p>
                              <p className="text-[10px] text-text-secondary">{change.diff > 0 ? (isKo ? '향상' : 'Improved') : change.diff < 0 ? (isKo ? '저하' : 'Declined') : (isKo ? '유지' : 'Same')}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{currDate}</p>
                              <p className="text-lg font-bold text-text-primary">{change.curr}</p>
                              <p className="text-[11px] text-text-secondary">{isKo ? '평균 등급' : 'Avg Grade'}</p>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={mmtCompareData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 5, fill: '#8B5CF6' }} name="MMT">
                                <LabelList dataKey="score" position="top" style={{ fontSize: 10, fill: '#8B5CF6', fontWeight: 600 }} />
                              </Line>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )
                    })() : (
                      <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
                        {isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── Hand Function 비교 카드 ── */}
              {handStore.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{isKo ? '손기능 검사' : 'Hand Function'}</CardTitle>
                      <span className="text-xs text-text-secondary">Lt. / Rt.</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {handCompareData.length >= 2 ? (() => {
                      const prev = handCompareData[handCompareData.length - 2]
                      const curr = handCompareData[handCompareData.length - 1]
                      const leftDiff = curr.left - prev.left
                      const rightDiff = curr.right - prev.right
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{prev.date}</p>
                              <p className="text-lg font-bold text-text-primary">Lt.{prev.left} / Rt.{prev.right}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-text-secondary">Lt.</span>
                                <span className={cn('text-xs font-bold', leftDiff > 0 ? 'text-emerald-500' : leftDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                  {leftDiff > 0 ? `+${leftDiff}` : leftDiff}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-text-secondary">Rt.</span>
                                <span className={cn('text-xs font-bold', rightDiff > 0 ? 'text-emerald-500' : rightDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                  {rightDiff > 0 ? `+${rightDiff}` : rightDiff}
                                </span>
                              </div>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3 text-center">
                              <p className="text-[10px] text-text-secondary">{curr.date}</p>
                              <p className="text-lg font-bold text-text-primary">Lt.{curr.left} / Rt.{curr.right}</p>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={handCompareData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="left" stroke="#EC4899" strokeWidth={2} dot={{ r: 4, fill: '#EC4899' }} name={isKo ? '좌측' : 'Left'}>
                                <LabelList dataKey="left" position="top" style={{ fontSize: 9, fill: '#EC4899', fontWeight: 600 }} />
                              </Line>
                              <Line type="monotone" dataKey="right" stroke="#6366F1" strokeWidth={2} dot={{ r: 4, fill: '#6366F1' }} name={isKo ? '우측' : 'Right'}>
                                <LabelList dataKey="right" position="bottom" style={{ fontSize: 9, fill: '#6366F1', fontWeight: 600 }} />
                              </Line>
                              <Legend />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )
                    })() : (
                      <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
                        {isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── ROM 비교 카드 ── */}
              {romStore.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">ROM (Range of Motion)</CardTitle>
                      <span className="text-xs text-text-secondary">{isKo ? '관절 가동 범위' : 'Joint Range'}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {romStore.history.length >= 2 ? (() => {
                      const sorted = [...romStore.history].sort((a, b) => a.timestamp - b.timestamp)
                      const prev = sorted[sorted.length - 2]
                      const curr = sorted[sorted.length - 1]
                      const prevDate = new Date(prev.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })
                      const currDate = new Date(curr.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })
                      const prevCount = Object.keys(prev.scores).length
                      const currCount = Object.keys(curr.scores).length
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg border border-border bg-background p-3 text-center">
                            <p className="text-[10px] text-text-secondary">{prevDate}</p>
                            <p className="text-lg font-bold text-text-primary">{prevCount}</p>
                            <p className="text-[11px] text-text-secondary">{isKo ? '관절 측정' : 'joints'}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-cyan-500" />
                            <p className="text-[10px] text-text-secondary mt-1">{isKo ? '측정 비교' : 'Compared'}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background p-3 text-center">
                            <p className="text-[10px] text-text-secondary">{currDate}</p>
                            <p className="text-lg font-bold text-text-primary">{currCount}</p>
                            <p className="text-[11px] text-text-secondary">{isKo ? '관절 측정' : 'joints'}</p>
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="flex h-24 items-center justify-center text-sm text-text-secondary">
                        {isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 모든 평가 기록이 0개면 안내 */}
              {bbsStore.history.length === 0 && facStore.history.length === 0 && mbiStore.history.length === 0 && mmtStore.history.length === 0 && handStore.history.length === 0 && romStore.history.length === 0 && (
                <div className="py-16 text-center text-sm text-text-secondary">
                  {isKo ? '아직 평가 기록이 없습니다. 평가를 먼저 진행해주세요.' : 'No assessment records yet. Please complete an assessment first.'}
                </div>
              )}
            </div>
          )}

          {/* === 재활이행률 === */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              {/* 주간 이행률 바 차트 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isKo ? '주간 재활이행률 추이' : 'Weekly Compliance Trend'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={complianceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} unit="%" />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, isKo ? '이행률' : 'Compliance']}
                        contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name={isKo ? '이행률' : 'Rate'} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 운동 통계 카드 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-text-secondary">{isKo ? '총 운동 세션' : 'Total Sessions'}</p>
                    <p className="mt-1 text-3xl font-bold text-text-primary">{stats.totalSessions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-text-secondary">{isKo ? '총 운동 시간' : 'Total Time'}</p>
                    <p className="mt-1 text-3xl font-bold text-text-primary">{formatTime(stats.totalTime)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-text-secondary">{isKo ? '평균 정확도' : 'Avg Accuracy'}</p>
                    <p className="mt-1 text-3xl font-bold text-text-primary">{stats.averageAccuracy.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  )
}
