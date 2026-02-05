'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
  ReferenceArea, LabelList,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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
        const vals = Object.values(r.scores).flatMap(s => [s.lt, s.rt]).filter((v): v is number => v !== null && !isNaN(v))
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        return {
          name: `#${i + 1}`,
          date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(avg * 10) / 10,
        }
      })
  }, [mmtStore.history, isKo])

  // MMT 레이더 차트 데이터 (근육군별 이전 vs 최근)
  const mmtRadarData = useMemo(() => {
    const sorted = [...mmtStore.history].sort((a, b) => a.timestamp - b.timestamp)
    if (sorted.length === 0) return []
    const curr = sorted[sorted.length - 1]
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null

    const muscleLabels: Record<string, string> = {
      shoulder_flexor: isKo ? '어깨굴곡' : 'Shoulder',
      elbow_flexor_extensor: isKo ? '팔꿈치' : 'Elbow',
      finger_flexor_extensor: isKo ? '손가락' : 'Finger',
      hip_flexor: isKo ? '고관절' : 'Hip',
      knee_extensor: isKo ? '무릎' : 'Knee',
      ankle_dorsiflexor: isKo ? '발목' : 'Ankle',
    }

    return Object.entries(curr.scores).map(([key, s]) => {
      const ltVal = (s.lt !== null && !isNaN(s.lt)) ? s.lt : 0
      const rtVal = (s.rt !== null && !isNaN(s.rt)) ? s.rt : 0
      const currAvg = (ltVal + rtVal) / 2

      let prevAvg = 0
      if (prev && prev.scores[key]) {
        const pLt = (prev.scores[key].lt !== null && !isNaN(prev.scores[key].lt!)) ? prev.scores[key].lt! : 0
        const pRt = (prev.scores[key].rt !== null && !isNaN(prev.scores[key].rt!)) ? prev.scores[key].rt! : 0
        prevAvg = (pLt + pRt) / 2
      }

      return {
        muscle: muscleLabels[key] || key,
        current: Math.round(currAvg * 10) / 10,
        previous: prev ? Math.round(prevAvg * 10) / 10 : 0,
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
          {activeTab === 'overview' && (() => {
            const usedTools = new Set<string>()
            if (bbsStore.history.length > 0) usedTools.add('BBS')
            if (facStore.history.length > 0) usedTools.add('FAC')
            if (mbiStore.history.length > 0) usedTools.add('MBI')
            if (mmtStore.history.length > 0) usedTools.add('MMT')
            if (handStore.history.length > 0) usedTools.add('Hand')
            if (romStore.history.length > 0) usedTools.add('ROM')
            const latestTimestamp = allAssessments.length > 0 ? allAssessments[0].timestamp : null
            const latestDateStr = latestTimestamp
              ? new Date(latestTimestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
              : '-'
            const completedTypes = usedTools.size
            const totalTypes = 6
            return (
            <div className="space-y-6">
              {/* 요약 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{allAssessments.length}</p>
                    <p className="text-xs text-text-secondary">{isKo ? '총 평가 수' : 'Total Assessments'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-violet-600">{usedTools.size}<span className="text-sm font-medium text-text-secondary">/{totalTypes}</span></p>
                    <p className="text-xs text-text-secondary">{isKo ? '평가 도구' : 'Tools Used'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold text-emerald-600">{latestDateStr}</p>
                    <p className="text-xs text-text-secondary">{isKo ? '최근 평가일' : 'Last Assessment'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* 최근 평가 점수 요약 + 최근 기록 */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{isKo ? '최근 평가 점수' : 'Latest Scores'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {/* BBS */}
                      {bbsStore.history.length > 0 ? (() => {
                        const latest = [...bbsStore.history].sort((a, b) => b.timestamp - a.timestamp)[0]
                        const risk = latest.totalScore <= 20 ? (isKo ? '높은 위험' : 'High Risk') : latest.totalScore <= 40 ? (isKo ? '중간 위험' : 'Med Risk') : (isKo ? '낮은 위험' : 'Low Risk')
                        const riskColor = latest.totalScore <= 20 ? 'text-red-500' : latest.totalScore <= 40 ? 'text-amber-500' : 'text-emerald-500'
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">BBS</span>
                            <span className="text-xs font-bold text-text-primary">{latest.totalScore}/56</span>
                            <span className={cn('text-[10px] font-medium', riskColor)}>{risk}</span>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 opacity-40">
                          <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-gray-800">BBS</span>
                          <span className="text-[10px] text-text-secondary">-</span>
                          <span className="text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</span>
                        </div>
                      )}

                      {/* FAC */}
                      {facStore.history.length > 0 ? (() => {
                        const latest = [...facStore.history].sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)[0] as { level: number }
                        const desc = latest.level <= 1 ? (isKo ? '보조 필요' : 'Assisted') : latest.level <= 3 ? (isKo ? '감독 필요' : 'Supervised') : (isKo ? '독립 보행' : 'Independent')
                        const descColor = latest.level <= 1 ? 'text-red-500' : latest.level <= 3 ? 'text-amber-500' : 'text-emerald-500'
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">FAC</span>
                            <span className="text-xs font-bold text-text-primary">Level {latest.level}</span>
                            <span className={cn('text-[10px] font-medium', descColor)}>{desc}</span>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 opacity-40">
                          <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-gray-800">FAC</span>
                          <span className="text-[10px] text-text-secondary">-</span>
                          <span className="text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</span>
                        </div>
                      )}

                      {/* MBI */}
                      {mbiStore.history.length > 0 ? (() => {
                        const latest = [...mbiStore.history].sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)[0] as { totalScore: number }
                        const dep = latest.totalScore >= 91 ? (isKo ? '독립' : 'Independent') : latest.totalScore >= 50 ? (isKo ? '부분의존' : 'Partial') : (isKo ? '의존' : 'Dependent')
                        const depColor = latest.totalScore >= 91 ? 'text-emerald-500' : latest.totalScore >= 50 ? 'text-amber-500' : 'text-red-500'
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">MBI</span>
                            <span className="text-xs font-bold text-text-primary">{latest.totalScore}/100</span>
                            <span className={cn('text-[10px] font-medium', depColor)}>{dep}</span>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 opacity-40">
                          <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-gray-800">MBI</span>
                          <span className="text-[10px] text-text-secondary">-</span>
                          <span className="text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</span>
                        </div>
                      )}

                      {/* MMT */}
                      {mmtStore.history.length > 0 ? (() => {
                        const latest = [...mmtStore.history].sort((a, b) => b.timestamp - a.timestamp)[0]
                        const vals = Object.values(latest.scores).flatMap(s => [s.lt, s.rt]).filter((v): v is number => v !== null && !isNaN(v))
                        const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">MMT</span>
                            <span className="text-xs font-bold text-text-primary">{isKo ? '평균' : 'Avg'} {avg}</span>
                            <span className="text-[10px] text-text-secondary">/ 5</span>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 opacity-40">
                          <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-gray-800">MMT</span>
                          <span className="text-[10px] text-text-secondary">-</span>
                          <span className="text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</span>
                        </div>
                      )}

                      {/* Hand */}
                      {handStore.history.length > 0 ? (() => {
                        const latest = [...handStore.history].sort((a, b) => b.timestamp - a.timestamp)[0]
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-700 dark:bg-pink-500/20 dark:text-pink-400">Hand</span>
                            <span className="text-xs font-bold text-text-primary">Lt.{latest.leftTotalScore} / Rt.{latest.rightTotalScore}</span>
                            <span className="text-[10px] text-text-secondary">{isKo ? '손기능' : 'Function'}</span>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 opacity-40">
                          <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-gray-800">Hand</span>
                          <span className="text-[10px] text-text-secondary">-</span>
                          <span className="text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</span>
                        </div>
                      )}

                      {/* ROM */}
                      {romStore.history.length > 0 ? (() => {
                        const latest = [...romStore.history].sort((a, b) => b.timestamp - a.timestamp)[0]
                        const count = Object.keys(latest.scores).length
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400">ROM</span>
                            <span className="text-xs font-bold text-text-primary">{count}{isKo ? '개 관절' : ' joints'}</span>
                            <span className="text-[10px] text-text-secondary">{isKo ? '측정됨' : 'measured'}</span>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 opacity-40">
                          <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-gray-800">ROM</span>
                          <span className="text-[10px] text-text-secondary">-</span>
                          <span className="text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</span>
                        </div>
                      )}

                      {/* 평가 완료율 바 */}
                      <div className="mt-1 pt-2 border-t border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-secondary">{isKo ? '평가 완료율' : 'Completion'}</span>
                          <span className="text-[10px] font-bold text-primary">{completedTypes}/{totalTypes}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all" style={{ width: `${(completedTypes / totalTypes) * 100}%` }} />
                        </div>
                      </div>
                    </div>
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
            )
          })()}

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
            <div className="space-y-4">
              {/* 비교 탭 헤더 */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  {isKo ? '각 평가 도구별 전후 비교' : 'Before & after comparison'}
                </p>
                <Button onClick={handleComparisonReport} size="sm" variant="outline">
                  <FileDown className="mr-1.5 h-4 w-4" />
                  {isKo ? '비교 리포트' : 'Report'}
                </Button>
              </div>

              {/* 2열 그리드 (모바일 1열) */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* ── BBS: Area Chart 그라데이션 + 위험구간 ── */}
                {bbsStore.history.length > 0 && (
                  <Card className="min-h-[300px] flex flex-col">
                    <CardHeader className="px-4 py-2.5 pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold">BBS</CardTitle>
                        <span className="text-[10px] text-text-secondary">0-56</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1 flex-1">
                      {bbsCompareData.length >= 2 ? (() => {
                        const change = getChange(bbsCompareData)!
                        const getRisk = (s: number) => s <= 20 ? (isKo ? '높은위험' : 'High') : s <= 40 ? (isKo ? '중간위험' : 'Med') : (isKo ? '낮은위험' : 'Low')
                        const getRiskColor = (s: number) => s <= 20 ? 'text-red-500' : s <= 40 ? 'text-amber-500' : 'text-emerald-500'
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
                              <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{change.prev}/56</p>
                                <p className={cn('text-[9px] font-medium', getRiskColor(change.prev))}>{getRisk(change.prev)}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {change.diff > 0 ? <ArrowUp className="h-3.5 w-3.5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5 text-text-secondary" />}
                                <span className={cn('text-xs font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                  {change.diff > 0 ? `+${change.diff}` : change.diff}
                                </span>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{change.curr}/56</p>
                                <p className={cn('text-[9px] font-medium', getRiskColor(change.curr))}>{getRisk(change.curr)}</p>
                              </div>
                            </div>
                            <ResponsiveContainer width="100%" height={150}>
                              <AreaChart data={bbsCompareData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="bbsGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#EC4899" />
                                  </linearGradient>
                                  <linearGradient id="bbsFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#EC4899" stopOpacity={0.05} />
                                  </linearGradient>
                                </defs>
                                <ReferenceArea y1={0} y2={20} fill="#FEE2E2" fillOpacity={0.25} />
                                <ReferenceArea y1={20} y2={40} fill="#FEF3C7" fillOpacity={0.2} />
                                <ReferenceArea y1={40} y2={56} fill="#D1FAE5" fillOpacity={0.2} />
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                <YAxis domain={[0, 56]} tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                <Area type="monotone" dataKey="score" stroke="url(#bbsGrad)" strokeWidth={3} fill="url(#bbsFill)" dot={{ r: 8, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 10, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} name="BBS">
                                  <LabelList dataKey="score" position="top" offset={12} style={{ fontSize: 13, fill: '#7C3AED', fontWeight: 800 }} />
                                </Area>
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )
                      })() : (
                        <p className="py-6 text-center text-xs text-text-secondary">{isKo ? '다음 평가 후 비교 가능' : 'Need 2+ records'}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ── FAC: 프로그레스 바 비교 ── */}
                {facStore.history.length > 0 && (
                  <Card className="min-h-[300px] flex flex-col">
                    <CardHeader className="px-4 py-2.5 pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold">FAC</CardTitle>
                        <span className="text-[10px] text-text-secondary">Level 0-5</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1 flex-1">
                      {(() => {
                        const sorted = [...facStore.history].sort((a, b) => a.timestamp - b.timestamp)
                        const curr = sorted[sorted.length - 1]
                        const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null
                        const getDesc = (l: number) => l <= 1 ? (isKo ? '보조필요' : 'Assisted') : l <= 3 ? (isKo ? '감독필요' : 'Supervised') : (isKo ? '독립보행' : 'Independent')
                        return (
                          <div className="space-y-3">
                            {/* 비교 행 */}
                            {prev && (
                              <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
                                <div className="text-center">
                                  <p className="text-sm font-bold text-text-primary">Lv.{prev.level}</p>
                                  <p className="text-[9px] text-text-secondary">{getDesc(prev.level)}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {curr.level > prev.level ? <ArrowUp className="h-3.5 w-3.5 text-emerald-500" /> : curr.level < prev.level ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5 text-text-secondary" />}
                                  <span className={cn('text-xs font-bold', curr.level > prev.level ? 'text-emerald-500' : curr.level < prev.level ? 'text-red-500' : 'text-text-secondary')}>
                                    {curr.level - prev.level > 0 ? `+${curr.level - prev.level}` : curr.level - prev.level}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-text-primary">Lv.{curr.level}</p>
                                  <p className="text-[9px] text-text-secondary">{getDesc(curr.level)}</p>
                                </div>
                              </div>
                            )}
                            {/* 게이지 바 */}
                            <div className="space-y-2 pt-1">
                              {prev && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] text-text-secondary">{isKo ? '이전' : 'Prev'}</span>
                                    <span className="text-[9px] font-medium text-text-secondary">Lv.{prev.level}/5</span>
                                  </div>
                                  <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    <div className="h-full rounded-full bg-gray-300 dark:bg-gray-600 transition-all" style={{ width: `${(prev.level / 5) * 100}%` }} />
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] text-text-secondary">{isKo ? '현재' : 'Current'}</span>
                                  <span className="text-[9px] font-bold text-pink-500">Lv.{curr.level}/5</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all" style={{ width: `${(curr.level / 5) * 100}%` }} />
                                </div>
                              </div>
                              {/* 레벨 눈금 */}
                              <div className="flex justify-between px-0.5">
                                {[0, 1, 2, 3, 4, 5].map((lv) => (
                                  <span key={lv} className={cn('text-[8px]', lv === curr.level ? 'font-bold text-pink-500' : 'text-text-secondary')}>{lv}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* ── MBI: 도넛 또는 라인 ── */}
                {mbiStore.history.length > 0 && (
                  <Card className="min-h-[300px] flex flex-col">
                    <CardHeader className="px-4 py-2.5 pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold">MBI</CardTitle>
                        <span className="text-[10px] text-text-secondary">0-100</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1 flex-1">
                      {mbiCompareData.length >= 2 ? (() => {
                        const change = getChange(mbiCompareData)!
                        const getDep = (s: number) => s >= 91 ? (isKo ? '독립' : 'Indep') : s >= 50 ? (isKo ? '부분' : 'Partial') : (isKo ? '의존' : 'Dep')
                        const getDepColor = (s: number) => s >= 91 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-red-500'
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
                              <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{change.prev}/100</p>
                                <p className={cn('text-[9px] font-medium', getDepColor(change.prev))}>{getDep(change.prev)}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {change.diff > 0 ? <ArrowUp className="h-3.5 w-3.5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5 text-text-secondary" />}
                                <span className={cn('text-xs font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                  {change.diff > 0 ? `+${change.diff}` : change.diff}
                                </span>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{change.curr}/100</p>
                                <p className={cn('text-[9px] font-medium', getDepColor(change.curr))}>{getDep(change.curr)}</p>
                              </div>
                            </div>
                            <ResponsiveContainer width="100%" height={150}>
                              <AreaChart data={mbiCompareData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="mbiFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fill="url(#mbiFill)" dot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} name="MBI">
                                  <LabelList dataKey="score" position="top" style={{ fontSize: 10, fill: '#059669', fontWeight: 700 }} />
                                </Area>
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )
                      })() : (() => {
                        // 1개: 도넛 차트로 현재 점수 표시
                        const latest = mbiStore.history[0]
                        const score = latest.totalScore
                        const getDep = (s: number) => s >= 91 ? (isKo ? '독립' : 'Independent') : s >= 50 ? (isKo ? '부분의존' : 'Partial') : (isKo ? '의존' : 'Dependent')
                        const donutData = [{ name: 'score', value: score }, { name: 'rest', value: 100 - score }]
                        return (
                          <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={130}>
                              <PieChart>
                                <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                  <Cell fill="#10B981" />
                                  <Cell fill="#E5E7EB" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="-mt-[85px] text-center mb-6">
                              <p className="text-lg font-bold text-text-primary">{score}</p>
                              <p className="text-[9px] text-text-secondary">/100</p>
                            </div>
                            <p className="text-[10px] text-emerald-600 font-medium">{getDep(score)}</p>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* ── MMT: 레이더 차트 ── */}
                {mmtStore.history.length > 0 && (
                  <Card className="min-h-[300px] flex flex-col">
                    <CardHeader className="px-4 py-2.5 pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold">MMT</CardTitle>
                        <span className="text-[10px] text-text-secondary">Grade 0-5</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1 flex-1">
                      {mmtRadarData.length > 0 ? (() => {
                        const hasPrev = mmtStore.history.length >= 2
                        const change = mmtCompareData.length >= 2 ? getChange(mmtCompareData) : null
                        const currentAvg = mmtCompareData.length > 0 ? mmtCompareData[mmtCompareData.length - 1].score : 0
                        return (
                          <div className="space-y-2">
                            {change ? (
                              <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
                                <div className="text-center">
                                  <p className="text-sm font-bold text-text-primary">{change.prev}</p>
                                  <p className="text-[9px] text-text-secondary">{isKo ? '이전' : 'Prev'}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {change.diff > 0 ? <ArrowUp className="h-3.5 w-3.5 text-emerald-500" /> : change.diff < 0 ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5 text-text-secondary" />}
                                  <span className={cn('text-xs font-bold', change.diff > 0 ? 'text-emerald-500' : change.diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                    {change.diff > 0 ? `+${change.diff}` : change.diff}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-text-primary">{change.curr}</p>
                                  <p className="text-[9px] text-text-secondary">{isKo ? '현재' : 'Current'}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center rounded-lg bg-background px-3 py-2">
                                <p className="text-sm font-bold text-text-primary">{isKo ? '현재' : 'Current'} {currentAvg}</p>
                                <span className="ml-2 text-[9px] text-text-secondary">{isKo ? '평균등급' : 'Avg Grade'}</span>
                              </div>
                            )}
                            <ResponsiveContainer width="100%" height={150}>
                              <RadarChart data={mmtRadarData} cx="50%" cy="50%" outerRadius="70%">
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 8, fill: 'hsl(var(--text-secondary))' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 8, fill: 'hsl(var(--text-secondary))' }} tickCount={6} />
                                {hasPrev && (
                                  <Radar name={isKo ? '이전' : 'Prev'} dataKey="previous" stroke="#9CA3AF" fill="#9CA3AF" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 3" />
                                )}
                                <Radar name={isKo ? '현재' : 'Current'} dataKey="current" stroke="#EC4899" fill="#EC4899" fillOpacity={0.25} strokeWidth={2} />
                                {hasPrev && <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />}
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )
                      })() : (
                        <p className="py-6 text-center text-xs text-text-secondary">{isKo ? '데이터 없음' : 'No data'}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ── Hand: 좌우 비교 바 차트 / 도넛 ── */}
                {handStore.history.length > 0 && (
                  <Card className="min-h-[300px] flex flex-col">
                    <CardHeader className="px-4 py-2.5 pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold">{isKo ? '손기능' : 'Hand'}</CardTitle>
                        <span className="text-[10px] text-text-secondary">Lt. / Rt.</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1 flex-1">
                      {handCompareData.length >= 2 ? (() => {
                        const prev = handCompareData[handCompareData.length - 2]
                        const curr = handCompareData[handCompareData.length - 1]
                        const leftDiff = curr.left - prev.left
                        const rightDiff = curr.right - prev.right
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
                              <p className="text-xs font-bold text-text-primary">Lt.{prev.left} Rt.{prev.right}</p>
                              <div className="flex items-center gap-2">
                                <span className={cn('text-[10px] font-bold', leftDiff > 0 ? 'text-emerald-500' : leftDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                  L{leftDiff > 0 ? `+${leftDiff}` : leftDiff}
                                </span>
                                <span className={cn('text-[10px] font-bold', rightDiff > 0 ? 'text-emerald-500' : rightDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                  R{rightDiff > 0 ? `+${rightDiff}` : rightDiff}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-text-primary">Lt.{curr.left} Rt.{curr.right}</p>
                            </div>
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={[
                                { name: isKo ? '이전' : 'Prev', lt: prev.left, rt: prev.right },
                                { name: isKo ? '현재' : 'Current', lt: curr.left, rt: curr.right },
                              ]} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                <Bar dataKey="lt" fill="#EC4899" radius={[3, 3, 0, 0]} name={isKo ? '환측(Lt)' : 'Affected(Lt)'}>
                                  <LabelList dataKey="lt" position="top" style={{ fontSize: 9, fill: '#EC4899', fontWeight: 600 }} />
                                </Bar>
                                <Bar dataKey="rt" fill="#8B5CF6" radius={[3, 3, 0, 0]} name={isKo ? '건측(Rt)' : 'Sound(Rt)'}>
                                  <LabelList dataKey="rt" position="top" style={{ fontSize: 9, fill: '#8B5CF6', fontWeight: 600 }} />
                                </Bar>
                                <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )
                      })() : (() => {
                        // 1개: 좌우 비교 바 차트
                        const latest = handStore.history[0]
                        return (
                          <div>
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={[
                                { name: isKo ? '현재' : 'Current', lt: latest.leftTotalScore, rt: latest.rightTotalScore },
                              ]} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                <Bar dataKey="lt" fill="#EC4899" radius={[4, 4, 0, 0]} name={isKo ? '환측(Lt)' : 'Affected(Lt)'}>
                                  <LabelList dataKey="lt" position="top" style={{ fontSize: 10, fill: '#EC4899', fontWeight: 700 }} />
                                </Bar>
                                <Bar dataKey="rt" fill="#8B5CF6" radius={[4, 4, 0, 0]} name={isKo ? '건측(Rt)' : 'Sound(Rt)'}>
                                  <LabelList dataKey="rt" position="top" style={{ fontSize: 10, fill: '#8B5CF6', fontWeight: 700 }} />
                                </Bar>
                                <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                              </BarChart>
                            </ResponsiveContainer>
                            <p className="text-center text-[9px] text-text-secondary mt-1">Lt.{latest.leftTotalScore} / Rt.{latest.rightTotalScore}</p>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* ── ROM ── */}
                {romStore.history.length > 0 && (
                  <Card className="min-h-[300px] flex flex-col">
                    <CardHeader className="px-4 py-2.5 pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold">ROM</CardTitle>
                        <span className="text-[10px] text-text-secondary">{isKo ? '관절가동범위' : 'Joint Range'}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1 flex-1">
                      {romStore.history.length >= 2 ? (() => {
                        const sorted = [...romStore.history].sort((a, b) => a.timestamp - b.timestamp)
                        const prev = sorted[sorted.length - 2]
                        const curr = sorted[sorted.length - 1]
                        const prevDate = new Date(prev.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })
                        const currDate = new Date(curr.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })
                        const prevCount = Object.keys(prev.scores).length
                        const currCount = Object.keys(curr.scores).length
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
                              <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{prevCount}</p>
                                <p className="text-[9px] text-text-secondary">{prevDate}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                                <span className="text-[10px] text-text-secondary">{isKo ? '관절' : 'joints'}</span>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{currCount}</p>
                                <p className="text-[9px] text-text-secondary">{currDate}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {Object.keys(curr.scores).map((jointId) => (
                                <span key={jointId} className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] font-medium text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                                  {jointId.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })() : (() => {
                        // 1개: 도넛으로 측정 관절 수 표시
                        const latest = romStore.history[0]
                        const count = Object.keys(latest.scores).length
                        const total = 7
                        const donutData = [{ name: 'measured', value: count }, { name: 'rest', value: total - count }]
                        return (
                          <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={120}>
                              <PieChart>
                                <Pie data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                  <Cell fill="#06B6D4" />
                                  <Cell fill="#E5E7EB" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="-mt-[78px] text-center mb-5">
                              <p className="text-lg font-bold text-text-primary">{count}</p>
                              <p className="text-[9px] text-text-secondary">/{total}</p>
                            </div>
                            <p className="text-[10px] text-cyan-600 font-medium">{isKo ? '관절 측정됨' : 'joints measured'}</p>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>

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
            <div className="flex items-center justify-center py-24">
              <p className="text-center text-sm text-text-secondary">
                {isKo
                  ? '운동 처방 기능 연동 후 재활이행률을 확인할 수 있습니다.'
                  : 'Rehabilitation compliance will be available after exercise prescription integration.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  )
}
