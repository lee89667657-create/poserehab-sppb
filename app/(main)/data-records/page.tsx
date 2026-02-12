'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
  ReferenceArea, LabelList,
  AreaChart, Area,
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
  X,
  ChevronRight,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { useExerciseStore } from '@/stores/exercise-store'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { usePatientAssessments } from '@/hooks/use-patient-assessments'
import { cn } from '@/lib/utils'
import { generateComparisonPdfReport, downloadPdf } from '@/lib/report/pdf-generator'

type TabType = 'overview' | 'assessments' | 'exercise' | 'compliance'
type AssessmentFilter = 'all' | 'BBS' | 'MMT' | 'ROM' | 'FAC' | 'MBI' | 'Hand'

export default function DataRecordsPage() {
  const { language } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [assessmentFilter, setAssessmentFilter] = useState<AssessmentFilter>('all')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const { exerciseRecords, getTotalStats } = useExerciseStore()
  const { selectedPatientId } = usePatientContextStore()
  const { byType } = usePatientAssessments(selectedPatientId || undefined)

  const isKo = language === 'ko'
  const stats = getTotalStats()

  // Supabase Assessment[] → 각 평가 타입의 형식으로 변환 (newest first → 기존 코드와 동일)
  const bbsHistory = useMemo(() => {
    return (byType['BBS'] || []).map(a => ({
      id: a.id,
      timestamp: new Date(a.assessed_at).getTime(),
      scores: ((a.details as Record<string, unknown>)?.scores ?? {}) as Record<number, number>,
      totalScore: Number(a.score) || 0,
      riskLevel: ((a.details as Record<string, unknown>)?.riskLevel as 'high' | 'medium' | 'low') || 'medium',
    }))
  }, [byType])

  const facHistory = useMemo(() => {
    return (byType['FAC'] || []).map(a => ({
      id: a.id,
      timestamp: new Date(a.assessed_at).getTime(),
      level: Number(a.score) || 0,
    }))
  }, [byType])

  const mbiHistory = useMemo(() => {
    return (byType['MBI'] || []).map(a => ({
      id: a.id,
      timestamp: new Date(a.assessed_at).getTime(),
      totalScore: Number(a.score) || 0,
      scores: ((a.details as Record<string, unknown>)?.scores ?? {}) as Record<string, number>,
    }))
  }, [byType])

  const mmtHistory = useMemo(() => {
    return (byType['MMT'] || []).map(a => ({
      id: a.id,
      timestamp: new Date(a.assessed_at).getTime(),
      scores: ((a.details as Record<string, unknown>)?.scores ?? {}) as Record<string, { lt: number | null; rt: number | null }>,
    }))
  }, [byType])

  const handHistory = useMemo(() => {
    return (byType['HandFunction'] || []).map(a => {
      const d = a.details as Record<string, unknown> | null
      return {
        id: a.id,
        timestamp: new Date(a.assessed_at).getTime(),
        scores: (d?.scores ?? {}) as Record<string, { left: number | null; right: number | null }>,
        leftTotalScore: (d?.leftTotalScore as number) ?? 0,
        rightTotalScore: (d?.rightTotalScore as number) ?? 0,
      }
    })
  }, [byType])

  const romHistory = useMemo(() => {
    return (byType['ROM'] || []).map(a => ({
      id: a.id,
      timestamp: new Date(a.assessed_at).getTime(),
      scores: ((a.details as Record<string, unknown>)?.scores ?? {}) as Record<string, { lt: Record<string, number | null>; rt: Record<string, number | null> }>,
    }))
  }, [byType])

  // 모든 평가 기록 통합
  const allAssessments = useMemo(() => {
    const items: { id: string; type: AssessmentFilter; timestamp: number; score?: number; label: string; detail?: string }[] = []

    bbsHistory.forEach((r) => {
      const risk = r.totalScore <= 20 ? (isKo ? '높은 위험' : 'High') : r.totalScore <= 40 ? (isKo ? '중간 위험' : 'Medium') : (isKo ? '낮은 위험' : 'Low')
      items.push({ id: r.id, type: 'BBS', timestamp: r.timestamp, score: r.totalScore, label: `${r.totalScore}/56`, detail: risk })
    })
    mmtHistory.forEach((r) => {
      const count = Object.keys(r.scores).length
      items.push({ id: r.id, type: 'MMT', timestamp: r.timestamp, label: `${count} items`, detail: isKo ? `${count}개 근육군` : `${count} muscle groups` })
    })
    romHistory.forEach((r) => {
      const count = Object.keys(r.scores).length
      items.push({ id: r.id, type: 'ROM', timestamp: r.timestamp, label: `${count} joints`, detail: isKo ? `${count}개 관절` : `${count} joints` })
    })
    facHistory.forEach((r: { id: string; timestamp: number; level: number }) => {
      items.push({ id: r.id, type: 'FAC', timestamp: r.timestamp, score: r.level, label: `Level ${r.level}`, detail: isKo ? `보행수준 ${r.level}` : `Ambulation Level ${r.level}` })
    })
    mbiHistory.forEach((r: { id: string; timestamp: number; totalScore: number }) => {
      const dep = r.totalScore >= 91 ? (isKo ? '독립' : 'Independent') : r.totalScore >= 50 ? (isKo ? '부분의존' : 'Partial') : (isKo ? '의존' : 'Dependent')
      items.push({ id: r.id, type: 'MBI', timestamp: r.timestamp, score: r.totalScore, label: `${r.totalScore}/100`, detail: dep })
    })
    handHistory.forEach((r) => {
      items.push({ id: r.id, type: 'Hand', timestamp: r.timestamp, label: `Lt.${r.leftTotalScore} / Rt.${r.rightTotalScore}`, detail: isKo ? '손기능' : 'Hand Function' })
    })

    return items.sort((a, b) => b.timestamp - a.timestamp)
  }, [bbsHistory, mmtHistory, romHistory, facHistory, mbiHistory, handHistory, isKo])

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
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))
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
    return [...bbsHistory]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map((r, i) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        score: r.totalScore,
      }))
  }, [bbsHistory, isKo])

  // MBI 전후 비교 데이터
  const mbiCompareData = useMemo(() => {
    return mbiHistory
      .slice(0, 10)
      .reverse()
      .map((r: { timestamp: number; totalScore: number }, i: number) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        score: r.totalScore,
      }))
  }, [mbiHistory, isKo])

  // FAC 전후 비교 데이터
  const facCompareData = useMemo(() => {
    return [...facHistory]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map((r: { timestamp: number; level: number }, i: number) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        score: r.level,
      }))
  }, [facHistory, isKo])

  // MMT 등급명 헬퍼
  const mmtGradeName = (g: number | null): string => {
    if (g === null) return '-'
    const names: Record<number, string> = { 0: 'Zero', 1: 'Trace', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Normal' }
    return names[g] ?? `${g}`
  }

  // MMT 부위별 비교 데이터 (이전 vs 현재, Lt/Rt 분리, 정수 등급)
  const mmtDetailData = useMemo(() => {
    const sorted = [...mmtHistory].sort((a, b) => a.timestamp - b.timestamp)
    if (sorted.length === 0) return []
    const curr = sorted[sorted.length - 1]
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null

    const muscleLabels: Record<string, string> = {
      shoulder_flexor: isKo ? '어깨' : 'Shoulder',
      elbow_flexor_extensor: isKo ? '팔꿈치' : 'Elbow',
      wrist_flexor_extensor: isKo ? '손목' : 'Wrist',
      finger_flexor_extensor: isKo ? '손가락' : 'Finger',
      hip_flexor: isKo ? '고관절' : 'Hip',
      knee_extensor: isKo ? '무릎' : 'Knee',
      ankle_dorsiflexor: isKo ? '발목' : 'Ankle',
    }

    return Object.entries(curr.scores).map(([key, s]) => {
      const currLt = (s.lt !== null && !isNaN(s.lt)) ? Math.round(s.lt) : null
      const currRt = (s.rt !== null && !isNaN(s.rt)) ? Math.round(s.rt) : null
      let prevLt: number | null = null
      let prevRt: number | null = null
      if (prev && prev.scores[key]) {
        prevLt = (prev.scores[key].lt !== null && !isNaN(prev.scores[key].lt!)) ? Math.round(prev.scores[key].lt!) : null
        prevRt = (prev.scores[key].rt !== null && !isNaN(prev.scores[key].rt!)) ? Math.round(prev.scores[key].rt!) : null
      }
      const ltDiff = (currLt !== null && prevLt !== null) ? currLt - prevLt : null
      const rtDiff = (currRt !== null && prevRt !== null) ? currRt - prevRt : null

      return {
        muscle: muscleLabels[key] || key,
        key,
        currLt, currRt, prevLt, prevRt, ltDiff, rtDiff,
      }
    })
  }, [mmtHistory, isKo])

  // Hand Function 전후 비교 데이터
  const handCompareData = useMemo(() => {
    return [...handHistory]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map((r, i) => ({
        name: `#${i + 1}`,
        date: new Date(r.timestamp).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        left: r.leftTotalScore,
        right: r.rightTotalScore,
      }))
  }, [handHistory, isKo])

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
      bbs: bbsHistory.slice(0, 5),
      mbi: mbiHistory.slice(0, 5),
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
      bbs: { history: bbsHistory },
      fac: { history: facHistory },
      mbi: { history: mbiHistory },
      mmt: { history: mmtHistory },
      rom: { history: romHistory },
      hand: { history: handHistory },
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
            if (bbsHistory.length > 0) usedTools.add('BBS')
            if (facHistory.length > 0) usedTools.add('FAC')
            if (mbiHistory.length > 0) usedTools.add('MBI')
            if (mmtHistory.length > 0) usedTools.add('MMT')
            if (handHistory.length > 0) usedTools.add('Hand')
            if (romHistory.length > 0) usedTools.add('ROM')
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
                      {bbsHistory.length > 0 ? (() => {
                        const latest = [...bbsHistory].sort((a, b) => b.timestamp - a.timestamp)[0]
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
                      {facHistory.length > 0 ? (() => {
                        const latest = [...facHistory].sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)[0] as { level: number }
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
                      {mbiHistory.length > 0 ? (() => {
                        const latest = [...mbiHistory].sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)[0] as { totalScore: number }
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
                      {mmtHistory.length > 0 ? (() => {
                        const latest = [...mmtHistory].sort((a, b) => b.timestamp - a.timestamp)[0]
                        const totalMuscles = Object.keys(latest.scores).length
                        const goodCount = Object.values(latest.scores).filter(s => {
                          const lt = s.lt !== null ? Math.round(s.lt) : 0
                          const rt = s.rt !== null ? Math.round(s.rt) : 0
                          return lt >= 4 && rt >= 4
                        }).length
                        return (
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="inline-flex w-[42px] items-center justify-center rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">MMT</span>
                            <span className="text-xs font-bold text-text-primary">{goodCount}/{totalMuscles}</span>
                            <span className="text-[10px] text-text-secondary">Good+</span>
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
                      {handHistory.length > 0 ? (() => {
                        const latest = [...handHistory].sort((a, b) => b.timestamp - a.timestamp)[0]
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
                      {romHistory.length > 0 ? (() => {
                        const latest = [...romHistory].sort((a, b) => b.timestamp - a.timestamp)[0]
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

          {/* === 전후 비교 (컴팩트 6카드 그리드) === */}
          {activeTab === 'exercise' && (() => {
            // 공통 데이터 준비
            const facSorted = [...facHistory].sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)
            const facCurr = facSorted.length > 0 ? facSorted[facSorted.length - 1] as { level: number } : null
            const facPrev = facSorted.length >= 2 ? facSorted[facSorted.length - 2] as { level: number } : null

            const mbiSorted = [...mbiHistory].sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)
            const mbiCurr = mbiSorted.length > 0 ? mbiSorted[mbiSorted.length - 1] as { totalScore: number } : null
            const mbiPrev = mbiSorted.length >= 2 ? mbiSorted[mbiSorted.length - 2] as { totalScore: number } : null

            const handSorted = [...handHistory].sort((a, b) => a.timestamp - b.timestamp)
            const handCurr = handSorted.length > 0 ? handSorted[handSorted.length - 1] : null
            const handPrev = handSorted.length >= 2 ? handSorted[handSorted.length - 2] : null

            // MMT 등급 요약: Good(4) 이상 부위 수
            const mmtSummary = mmtDetailData.length > 0 ? (() => {
              const total = mmtDetailData.length
              const goodCount = mmtDetailData.filter(m => (m.currLt ?? 0) >= 4 && (m.currRt ?? 0) >= 4).length
              return { total, goodCount }
            })() : null

            const romSorted = [...romHistory].sort((a, b) => a.timestamp - b.timestamp)
            const romCurr = romSorted.length > 0 ? romSorted[romSorted.length - 1] : null
            const romPrev = romSorted.length >= 2 ? romSorted[romSorted.length - 2] : null
            const jointLabels: Record<string, string> = {
              shoulder: isKo ? '어깨' : 'Shoulder', elbow: isKo ? '팔꿈치' : 'Elbow', wrist: isKo ? '손목' : 'Wrist',
              hip: isKo ? '고관절' : 'Hip', knee: isKo ? '무릎' : 'Knee', ankle: isKo ? '발목' : 'Ankle',
            }
            const motionLabels: Record<string, string> = {
              flexion: isKo ? '굴곡' : 'Flex', extension: isKo ? '신전' : 'Ext', abduction: isKo ? '외전' : 'Abd',
              adduction: isKo ? '내전' : 'Add', internal_rotation: isKo ? '내회전' : 'IR', external_rotation: isKo ? '외회전' : 'ER',
            }
            const normalRanges: Record<string, Record<string, number>> = {
              shoulder: { flexion: 180, extension: 60, abduction: 180 }, elbow: { flexion: 150, extension: 0 },
              wrist: { flexion: 80, extension: 70 }, hip: { flexion: 120, extension: 30, abduction: 45 },
              knee: { flexion: 135, extension: 0 }, ankle: { flexion: 50, extension: 20 },
            }
            const muscleLabels: Record<string, string> = {
              shoulder_flexor: isKo ? '어깨' : 'Shoulder', elbow_flexor_extensor: isKo ? '팔꿈치' : 'Elbow',
              wrist_flexor_extensor: isKo ? '손목' : 'Wrist', finger_flexor_extensor: isKo ? '손가락' : 'Finger',
              hip_flexor: isKo ? '고관절' : 'Hip', knee_extensor: isKo ? '무릎' : 'Knee', ankle_dorsiflexor: isKo ? '발목' : 'Ankle',
            }

            // 변화량 색/아이콘 헬퍼
            const DiffBadge = ({ diff, suffix = '' }: { diff: number | null; suffix?: string }) => {
              if (diff === null) return null
              return (
                <span className={cn('text-[10px] font-bold', diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                  {diff > 0 ? '+' : ''}{typeof diff === 'number' && !Number.isInteger(diff) ? diff.toFixed(1) : diff}{suffix}
                </span>
              )
            }

            const noData = bbsHistory.length === 0 && facHistory.length === 0 && mbiHistory.length === 0 && mmtHistory.length === 0 && handHistory.length === 0 && romHistory.length === 0

            return (
            <div className="space-y-3">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">{isKo ? '각 평가 도구별 전후 비교' : 'Before & after comparison'}</p>
                <Button onClick={handleComparisonReport} size="sm" variant="outline">
                  <FileDown className="mr-1.5 h-4 w-4" />
                  {isKo ? '비교 리포트' : 'Report'}
                </Button>
              </div>

              {noData ? (
                <div className="py-16 text-center text-sm text-text-secondary">
                  {isKo ? '아직 평가 기록이 없습니다. 평가를 먼저 진행해주세요.' : 'No assessment records yet.'}
                </div>
              ) : (
              <>
              {/* 3열 2행 그리드 - 한 화면에 모두 표시 */}
              <div className="grid grid-cols-3 grid-rows-2 gap-3" style={{ height: 'calc(100vh - 240px)' }}>

                {/* ─── 1. BBS: 꺾은선 + 위험도 구간 ─── */}
                <Card className="flex flex-col overflow-hidden min-h-0 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={() => setExpandedCard('BBS')}>
                  <CardContent className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">BBS</span>
                        <span className="text-[10px] text-text-secondary">{isKo ? '균형' : 'Balance'}</span>
                      </div>
                      {bbsCompareData.length >= 2 && (() => {
                        const ch = getChange(bbsCompareData)!
                        return (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-text-primary">{ch.curr}<span className="text-[10px] font-normal text-text-secondary">/56</span></span>
                            <DiffBadge diff={ch.diff} />
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex-1 min-h-0">
                      {bbsCompareData.length >= 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={bbsCompareData} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="bbsLineGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#EC4899" />
                              </linearGradient>
                            </defs>
                            <ReferenceArea y1={0} y2={20} fill="#FEE2E2" fillOpacity={0.3} />
                            <ReferenceArea y1={20} y2={40} fill="#FEF3C7" fillOpacity={0.25} />
                            <ReferenceArea y1={40} y2={56} fill="#D1FAE5" fillOpacity={0.25} />
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                            <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--text-secondary))' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 56]} tick={{ fontSize: 8, fill: 'hsl(var(--text-secondary))' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px', padding: '4px 8px' }} />
                            <Line type="monotone" dataKey="score" stroke="url(#bbsLineGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} name="BBS">
                              <LabelList dataKey="score" position="top" offset={6} style={{ fontSize: 10, fill: '#7C3AED', fontWeight: 700 }} />
                            </Line>
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</div>
                      )}
                    </div>
                    {/* 범례 */}
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-0.5"><div className="w-2 h-1.5 rounded-sm bg-red-200" /><span className="text-[7px] text-text-secondary">{isKo ? '고위험' : 'High'}</span></div>
                      <div className="flex items-center gap-0.5"><div className="w-2 h-1.5 rounded-sm bg-amber-200" /><span className="text-[7px] text-text-secondary">{isKo ? '중위험' : 'Med'}</span></div>
                      <div className="flex items-center gap-0.5"><div className="w-2 h-1.5 rounded-sm bg-emerald-200" /><span className="text-[7px] text-text-secondary">{isKo ? '저위험' : 'Low'}</span></div>
                    </div>
                  </CardContent>
                </Card>

                {/* ─── 2. FAC: 세로 레벨 게이지 ─── */}
                <Card className="flex flex-col overflow-hidden min-h-0 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={() => setExpandedCard('FAC')}>
                  <CardContent className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">FAC</span>
                        <span className="text-[10px] text-text-secondary">{isKo ? '보행' : 'Gait'}</span>
                      </div>
                      {facCurr && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-text-primary">Lv.{facCurr.level}<span className="text-[10px] font-normal text-text-secondary">/5</span></span>
                          {facPrev && <DiffBadge diff={facCurr.level - facPrev.level} />}
                        </div>
                      )}
                    </div>
                    {facCurr ? (() => {
                      const facDescriptions: Record<number, string> = isKo
                        ? { 0: '보행불가', 1: '1인 지속보조', 2: '1인 간헐보조', 3: '감독 보행', 4: '평지 독립', 5: '완전 독립' }
                        : { 0: 'Non-amb.', 1: 'Continuous', 2: 'Intermittent', 3: 'Supervised', 4: 'Level indep.', 5: 'Independent' }
                      return (
                        <div className="flex-1 flex flex-col justify-center gap-1 min-h-0">
                          {[5, 4, 3, 2, 1, 0].map((lv) => {
                            const isCurr = lv === facCurr!.level
                            const isPrev = facPrev && lv === facPrev.level
                            const isReached = lv <= facCurr!.level
                            return (
                              <div key={lv} className="flex items-center gap-1.5">
                                <span className={cn('text-[9px] w-5 text-right shrink-0', isCurr ? 'font-bold text-amber-600' : isPrev ? 'font-medium text-gray-400' : 'text-text-secondary')}>{lv}</span>
                                <div className="flex-1 relative">
                                  <div className={cn('h-3.5 rounded transition-all relative overflow-hidden',
                                    isCurr ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm' :
                                    isPrev ? 'bg-amber-200 dark:bg-amber-800/40' :
                                    isReached ? 'bg-amber-100 dark:bg-amber-900/30' :
                                    'bg-gray-100 dark:bg-gray-800'
                                  )}>
                                    {isCurr && <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow" />}
                                    {isPrev && !isCurr && <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-400 border border-white" />}
                                  </div>
                                </div>
                                <span className={cn('text-[7px] w-14 truncate shrink-0', isCurr ? 'font-bold text-amber-700 dark:text-amber-400' : 'text-text-secondary')}>
                                  {facDescriptions[lv]}
                                </span>
                              </div>
                            )
                          })}
                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border/50">
                            <div className="flex items-center gap-0.5"><div className="w-2 h-1.5 rounded-sm bg-gradient-to-r from-amber-400 to-orange-500" /><span className="text-[7px] text-text-secondary">{isKo ? '현재' : 'Current'}</span></div>
                            {facPrev && <div className="flex items-center gap-0.5"><div className="w-2 h-1.5 rounded-sm bg-amber-200" /><span className="text-[7px] text-text-secondary">{isKo ? '이전' : 'Previous'}</span></div>}
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 3. MBI: 도넛 차트 ─── */}
                <Card className="flex flex-col overflow-hidden min-h-0 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={() => setExpandedCard('MBI')}>
                  <CardContent className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">MBI</span>
                        <span className="text-[10px] text-text-secondary">{isKo ? '일상생활' : 'ADL'}</span>
                      </div>
                      {mbiCurr && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-text-primary">{mbiCurr.totalScore}<span className="text-[10px] font-normal text-text-secondary">/100</span></span>
                          {mbiPrev && <DiffBadge diff={mbiCurr.totalScore - mbiPrev.totalScore} />}
                        </div>
                      )}
                    </div>
                    {mbiCurr ? (() => {
                      const score = mbiCurr.totalScore
                      const getDep = (s: number) => s >= 91 ? (isKo ? '독립' : 'Independent') : s >= 50 ? (isKo ? '부분의존' : 'Partial Dep.') : (isKo ? '의존' : 'Dependent')
                      const getDepColor = (s: number) => s >= 91 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'
                      const donutData = [{ name: 'score', value: score }, { name: 'rest', value: 100 - score }]
                      const diff = mbiPrev ? score - mbiPrev.totalScore : null
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
                          <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                              <Pie data={donutData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                <Cell fill={getDepColor(score)} />
                                <Cell fill="hsl(var(--border))" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
                            <span className="text-xl font-bold text-text-primary">{score}</span>
                            <span className="text-[9px] text-text-secondary">/100</span>
                            {diff !== null && (
                              <span className={cn('text-[10px] font-bold mt-0.5', diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium -mt-2" style={{ color: getDepColor(score) }}>{getDep(score)}</p>
                        </div>
                      )
                    })() : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 4. MMT: 부위별 등급 텍스트 테이블 ─── */}
                <Card className="flex flex-col overflow-hidden min-h-0 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={() => setExpandedCard('MMT')}>
                  <CardContent className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">MMT</span>
                        <span className="text-[10px] text-text-secondary">{isKo ? '근력' : 'Strength'}</span>
                      </div>
                      {mmtSummary && (
                        <span className="text-[10px] text-text-secondary">
                          {mmtSummary.total}{isKo ? '부위 중 ' : '/'}<span className="font-bold text-purple-600">{mmtSummary.goodCount}</span>{isKo ? '개 Good↑' : ' Good+'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {mmtDetailData.length > 0 ? (
                        <div className="space-y-0.5">
                          {mmtDetailData.map((m) => (
                            <div key={m.key} className="flex items-center gap-1 py-[3px] border-b border-border/30 last:border-0">
                              <span className="text-[9px] font-medium text-text-primary w-10 shrink-0 truncate">{m.muscle}</span>
                              {/* Lt */}
                              <div className="flex-1 flex items-center gap-0.5 min-w-0">
                                <span className="text-[7px] text-purple-400 shrink-0">Lt</span>
                                {m.prevLt !== null ? (
                                  <span className="text-[8px] text-text-secondary truncate">{mmtGradeName(m.prevLt)}→<span className="font-bold text-text-primary">{mmtGradeName(m.currLt)}</span></span>
                                ) : (
                                  <span className="text-[8px] font-bold text-text-primary">{mmtGradeName(m.currLt)}</span>
                                )}
                                {m.ltDiff !== null && (
                                  <span className={cn('text-[8px] font-bold shrink-0', m.ltDiff > 0 ? 'text-emerald-500' : m.ltDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                    {m.ltDiff > 0 ? '↑' : m.ltDiff < 0 ? '↓' : '-'}
                                  </span>
                                )}
                              </div>
                              {/* Rt */}
                              <div className="flex-1 flex items-center gap-0.5 min-w-0">
                                <span className="text-[7px] text-pink-400 shrink-0">Rt</span>
                                {m.prevRt !== null ? (
                                  <span className="text-[8px] text-text-secondary truncate">{mmtGradeName(m.prevRt)}→<span className="font-bold text-text-primary">{mmtGradeName(m.currRt)}</span></span>
                                ) : (
                                  <span className="text-[8px] font-bold text-text-primary">{mmtGradeName(m.currRt)}</span>
                                )}
                                {m.rtDiff !== null && (
                                  <span className={cn('text-[8px] font-bold shrink-0', m.rtDiff > 0 ? 'text-emerald-500' : m.rtDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                    {m.rtDiff > 0 ? '↑' : m.rtDiff < 0 ? '↓' : '-'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ─── 5. Hand: 반원 게이지 Lt/Rt ─── */}
                <Card className="flex flex-col overflow-hidden min-h-0 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={() => setExpandedCard('Hand')}>
                  <CardContent className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-700 dark:bg-pink-500/20 dark:text-pink-400">Hand</span>
                        <span className="text-[10px] text-text-secondary">{isKo ? '손기능' : 'Hand'}</span>
                      </div>
                      {handCurr && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-text-primary">Lt.{handCurr.leftTotalScore} Rt.{handCurr.rightTotalScore}</span>
                        </div>
                      )}
                    </div>
                    {handCurr ? (() => {
                      const ltPct = (handCurr.leftTotalScore / 32) * 100
                      const rtPct = (handCurr.rightTotalScore / 32) * 100
                      const ltDiff = handPrev ? handCurr.leftTotalScore - handPrev.leftTotalScore : null
                      const rtDiff = handPrev ? handCurr.rightTotalScore - handPrev.rightTotalScore : null
                      const ltDonut = [{ value: handCurr.leftTotalScore }, { value: 32 - handCurr.leftTotalScore }]
                      const rtDonut = [{ value: handCurr.rightTotalScore }, { value: 32 - handCurr.rightTotalScore }]
                      const ltPrevDonut = handPrev ? [{ value: handPrev.leftTotalScore }, { value: 32 - handPrev.leftTotalScore }] : null
                      const rtPrevDonut = handPrev ? [{ value: handPrev.rightTotalScore }, { value: 32 - handPrev.rightTotalScore }] : null
                      return (
                        <div className="flex-1 flex min-h-0">
                          {/* Lt 반원 */}
                          <div className="flex-1 flex flex-col items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="80%">
                              <PieChart>
                                {ltPrevDonut && (
                                  <Pie data={ltPrevDonut} cx="50%" cy="70%" innerRadius="50%" outerRadius="60%" startAngle={180} endAngle={0} dataKey="value" stroke="none">
                                    <Cell fill="#D1D5DB" /><Cell fill="transparent" />
                                  </Pie>
                                )}
                                <Pie data={ltDonut} cx="50%" cy="70%" innerRadius="65%" outerRadius="85%" startAngle={180} endAngle={0} dataKey="value" stroke="none">
                                  <Cell fill="#EC4899" /><Cell fill="hsl(var(--border))" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute bottom-[20%] flex flex-col items-center" style={{ pointerEvents: 'none' }}>
                              <span className="text-sm font-bold text-pink-600">{handCurr.leftTotalScore}</span>
                              <span className="text-[8px] text-text-secondary">/32</span>
                              {ltDiff !== null && <DiffBadge diff={ltDiff} />}
                            </div>
                            <span className="text-[9px] font-medium text-text-secondary -mt-1">Lt({isKo ? '환측' : 'Aff.'})</span>
                          </div>
                          {/* Rt 반원 */}
                          <div className="flex-1 flex flex-col items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="80%">
                              <PieChart>
                                {rtPrevDonut && (
                                  <Pie data={rtPrevDonut} cx="50%" cy="70%" innerRadius="50%" outerRadius="60%" startAngle={180} endAngle={0} dataKey="value" stroke="none">
                                    <Cell fill="#D1D5DB" /><Cell fill="transparent" />
                                  </Pie>
                                )}
                                <Pie data={rtDonut} cx="50%" cy="70%" innerRadius="65%" outerRadius="85%" startAngle={180} endAngle={0} dataKey="value" stroke="none">
                                  <Cell fill="#8B5CF6" /><Cell fill="hsl(var(--border))" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute bottom-[20%] flex flex-col items-center" style={{ pointerEvents: 'none' }}>
                              <span className="text-sm font-bold text-violet-600">{handCurr.rightTotalScore}</span>
                              <span className="text-[8px] text-text-secondary">/32</span>
                              {rtDiff !== null && <DiffBadge diff={rtDiff} />}
                            </div>
                            <span className="text-[9px] font-medium text-text-secondary -mt-1">Rt({isKo ? '건측' : 'Sound'})</span>
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 6. ROM: 부위별 각도 텍스트 테이블 ─── */}
                <Card className="flex flex-col overflow-hidden min-h-0 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={() => setExpandedCard('ROM')}>
                  <CardContent className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400">ROM</span>
                        <span className="text-[10px] text-text-secondary">{isKo ? '관절가동범위' : 'ROM'}</span>
                      </div>
                      {romCurr && (() => {
                        let totalPct = 0; let cnt = 0
                        Object.entries(romCurr.scores).forEach(([jid, sides]) => {
                          new Set([...Object.keys(sides.lt || {}), ...Object.keys(sides.rt || {})]).forEach((m) => {
                            const best = Math.max((sides.lt as Record<string, number | null>)?.[m] ?? 0, (sides.rt as Record<string, number | null>)?.[m] ?? 0)
                            const norm = normalRanges[jid]?.[m]; if (norm && norm > 0) { totalPct += Math.min((best / norm) * 100, 100); cnt++ }
                          })
                        })
                        return <span className="text-[10px] font-bold text-cyan-600">{cnt > 0 ? Math.round(totalPct / cnt) : 0}% {isKo ? '달성' : 'norm'}</span>
                      })()}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {romCurr ? (
                        <div className="space-y-0">
                          {Object.entries(romCurr.scores).map(([jid, sides]) => {
                            const ltMotions = sides.lt ? Object.keys(sides.lt) : []
                            const rtMotions = sides.rt ? Object.keys(sides.rt) : []
                            const allMotions = Array.from(new Set([...ltMotions, ...rtMotions]))
                            return allMotions.map((motion) => {
                              const cL = (sides.lt as Record<string, number | null>)?.[motion] ?? null
                              const cR = (sides.rt as Record<string, number | null>)?.[motion] ?? null
                              const pL = (romPrev?.scores?.[jid]?.lt as Record<string, number | null>)?.[motion] ?? null
                              const pR = (romPrev?.scores?.[jid]?.rt as Record<string, number | null>)?.[motion] ?? null
                              const lD = (cL !== null && pL !== null) ? cL - pL : null
                              const rD = (cR !== null && pR !== null) ? cR - pR : null
                              const norm = normalRanges[jid]?.[motion] ?? null
                              const best = Math.max(cL ?? 0, cR ?? 0)
                              const pct = norm && norm > 0 ? Math.round(Math.min((best / norm) * 100, 100)) : null
                              return (
                                <div key={`${jid}-${motion}`} className="flex items-center gap-1 py-[3px] border-b border-border/30 last:border-0">
                                  <span className="text-[8px] font-medium text-text-primary w-14 shrink-0 truncate">{jointLabels[jid] || jid} {motionLabels[motion] || motion}</span>
                                  {/* Lt */}
                                  <div className="flex-1 flex items-center gap-0.5 min-w-0">
                                    <span className="text-[7px] text-cyan-400 shrink-0">Lt</span>
                                    {pL !== null ? (
                                      <span className="text-[8px] text-text-secondary truncate">{pL}→<span className="font-bold text-text-primary">{cL}°</span></span>
                                    ) : (
                                      <span className="text-[8px] font-bold text-text-primary">{cL !== null ? `${cL}°` : '-'}</span>
                                    )}
                                    {lD !== null && lD !== 0 && (
                                      <span className={cn('text-[7px] font-bold shrink-0', lD > 0 ? 'text-emerald-500' : 'text-red-500')}>
                                        {lD > 0 ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                  {/* Rt */}
                                  <div className="flex-1 flex items-center gap-0.5 min-w-0">
                                    <span className="text-[7px] text-violet-400 shrink-0">Rt</span>
                                    {pR !== null ? (
                                      <span className="text-[8px] text-text-secondary truncate">{pR}→<span className="font-bold text-text-primary">{cR}°</span></span>
                                    ) : (
                                      <span className="text-[8px] font-bold text-text-primary">{cR !== null ? `${cR}°` : '-'}</span>
                                    )}
                                    {rD !== null && rD !== 0 && (
                                      <span className={cn('text-[7px] font-bold shrink-0', rD > 0 ? 'text-emerald-500' : 'text-red-500')}>
                                        {rD > 0 ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                  {/* 달성률 */}
                                  {pct !== null && (
                                    <span className={cn('text-[7px] font-bold shrink-0 w-6 text-right', pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500')}>{pct}%</span>
                                  )}
                                </div>
                              )
                            })
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-text-secondary">{isKo ? '미평가' : 'N/A'}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              </>
              )}

              {/* ── 상세 모달 ── */}
              {expandedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setExpandedCard(null)}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="relative w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-surface border border-border shadow-2xl p-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => setExpandedCard(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-background transition-colors">
                      <X className="h-5 w-5 text-text-secondary" />
                    </button>

                    {/* BBS 상세 */}
                    {expandedCard === 'BBS' && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-3">BBS {isKo ? '균형 척도' : 'Balance Scale'} <span className="text-text-secondary font-normal">0-56</span></h3>
                        {bbsCompareData.length >= 2 ? (() => {
                          const ch = getChange(bbsCompareData)!
                          const getRisk = (s: number) => s <= 20 ? (isKo ? '높은위험' : 'High Risk') : s <= 40 ? (isKo ? '중간위험' : 'Med Risk') : (isKo ? '낮은위험' : 'Low Risk')
                          const getRiskColor = (s: number) => s <= 20 ? 'text-red-500' : s <= 40 ? 'text-amber-500' : 'text-emerald-500'
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-2">
                                <div className="text-center"><p className="text-lg font-bold">{ch.prev}/56</p><p className={cn('text-[10px]', getRiskColor(ch.prev))}>{getRisk(ch.prev)}</p></div>
                                <div className="flex items-center gap-1.5">
                                  {ch.diff > 0 ? <ArrowUp className="h-4 w-4 text-emerald-500" /> : ch.diff < 0 ? <ArrowDown className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4 text-text-secondary" />}
                                  <DiffBadge diff={ch.diff} />
                                </div>
                                <div className="text-center"><p className="text-lg font-bold">{ch.curr}/56</p><p className={cn('text-[10px]', getRiskColor(ch.curr))}>{getRisk(ch.curr)}</p></div>
                              </div>
                              <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={bbsCompareData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="bbsGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#EC4899" /></linearGradient>
                                    <linearGradient id="bbsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} /><stop offset="100%" stopColor="#EC4899" stopOpacity={0.05} /></linearGradient>
                                  </defs>
                                  <ReferenceArea y1={0} y2={20} fill="#FEE2E2" fillOpacity={0.25} />
                                  <ReferenceArea y1={20} y2={40} fill="#FEF3C7" fillOpacity={0.2} />
                                  <ReferenceArea y1={40} y2={56} fill="#D1FAE5" fillOpacity={0.2} />
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                  <YAxis domain={[0, 56]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                  <Area type="monotone" dataKey="score" stroke="url(#bbsGrad)" strokeWidth={3} fill="url(#bbsFill)" dot={{ r: 6, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} name="BBS">
                                    <LabelList dataKey="score" position="top" offset={10} style={{ fontSize: 12, fill: '#7C3AED', fontWeight: 800 }} />
                                  </Area>
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )
                        })() : <p className="text-xs text-text-secondary py-4">{isKo ? '2회 이상 평가 후 비교 가능' : 'Need 2+ records'}</p>}
                      </div>
                    )}

                    {/* FAC 상세 */}
                    {expandedCard === 'FAC' && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-3">FAC {isKo ? '기능적 보행 분류' : 'Functional Ambulation'} <span className="text-text-secondary font-normal">Lv.0-5</span></h3>
                        {facCurr ? (() => {
                          const getDesc = (l: number) => l <= 1 ? (isKo ? '보조 필요' : 'Assisted') : l <= 3 ? (isKo ? '감독 필요' : 'Supervised') : (isKo ? '독립 보행' : 'Independent')
                          return (
                            <div className="space-y-3">
                              {facPrev && (
                                <div className="flex items-center justify-between rounded-lg bg-background px-4 py-2">
                                  <div className="text-center"><p className="text-lg font-bold">Lv.{facPrev.level}</p><p className="text-[10px] text-text-secondary">{getDesc(facPrev.level)}</p></div>
                                  <DiffBadge diff={facCurr.level - facPrev.level} />
                                  <div className="text-center"><p className="text-lg font-bold">Lv.{facCurr.level}</p><p className="text-[10px] text-text-secondary">{getDesc(facCurr.level)}</p></div>
                                </div>
                              )}
                              <div className="space-y-2">
                                {[0,1,2,3,4,5].map((lv) => (
                                  <div key={lv} className="flex items-center gap-2">
                                    <span className={cn('text-xs w-8 text-right', lv === facCurr!.level ? 'font-bold text-amber-600' : 'text-text-secondary')}>Lv.{lv}</span>
                                    <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                      {lv <= facCurr!.level && <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })() : <p className="text-xs text-text-secondary py-4">{isKo ? '평가 데이터 없음' : 'No data'}</p>}
                      </div>
                    )}

                    {/* MBI 상세 */}
                    {expandedCard === 'MBI' && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-3">MBI {isKo ? '일상생활 독립성' : 'Modified Barthel Index'} <span className="text-text-secondary font-normal">0-100</span></h3>
                        {mbiCompareData.length >= 2 ? (() => {
                          const ch = getChange(mbiCompareData)!
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-2">
                                <div className="text-center"><p className="text-lg font-bold">{ch.prev}/100</p></div>
                                <DiffBadge diff={ch.diff} />
                                <div className="text-center"><p className="text-lg font-bold">{ch.curr}/100</p></div>
                              </div>
                              <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={mbiCompareData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                                  <defs><linearGradient id="mbiFill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.02} /></linearGradient></defs>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                  <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fill="url(#mbiFill2)" dot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} name="MBI">
                                    <LabelList dataKey="score" position="top" style={{ fontSize: 11, fill: '#059669', fontWeight: 700 }} />
                                  </Area>
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )
                        })() : <p className="text-xs text-text-secondary py-4">{isKo ? '2회 이상 평가 후 비교 가능' : 'Need 2+ records'}</p>}
                      </div>
                    )}

                    {/* MMT 상세 */}
                    {expandedCard === 'MMT' && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-1">MMT {isKo ? '근력 등급' : 'Muscle Grade'} <span className="text-text-secondary font-normal">Grade 0-5</span></h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-3 text-[9px] text-text-secondary">
                          <span>0=Zero</span><span>1=Trace</span><span>2=Poor</span><span>3=Fair</span><span>4=Good</span><span>5=Normal</span>
                        </div>
                        {mmtDetailData.length > 0 ? (
                          <div className="space-y-2">
                            {mmtDetailData.map((m) => (
                              <div key={m.key} className="rounded-lg border border-border px-3 py-2">
                                <span className="text-xs font-bold text-text-primary">{m.muscle}</span>
                                <div className="flex gap-4 mt-1">
                                  {/* Lt */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-purple-500 font-medium w-4">Lt</span>
                                    {m.prevLt !== null ? (
                                      <span className="text-xs text-text-secondary">{mmtGradeName(m.prevLt)} → <span className="font-bold text-text-primary">{mmtGradeName(m.currLt)}</span></span>
                                    ) : (
                                      <span className="text-xs font-bold text-text-primary">{mmtGradeName(m.currLt)}</span>
                                    )}
                                    {m.ltDiff !== null && (
                                      <span className={cn('text-xs font-bold', m.ltDiff > 0 ? 'text-emerald-500' : m.ltDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                        {m.ltDiff > 0 ? '↑' : m.ltDiff < 0 ? '↓' : '-'}
                                      </span>
                                    )}
                                  </div>
                                  {/* Rt */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-pink-500 font-medium w-4">Rt</span>
                                    {m.prevRt !== null ? (
                                      <span className="text-xs text-text-secondary">{mmtGradeName(m.prevRt)} → <span className="font-bold text-text-primary">{mmtGradeName(m.currRt)}</span></span>
                                    ) : (
                                      <span className="text-xs font-bold text-text-primary">{mmtGradeName(m.currRt)}</span>
                                    )}
                                    {m.rtDiff !== null && (
                                      <span className={cn('text-xs font-bold', m.rtDiff > 0 ? 'text-emerald-500' : m.rtDiff < 0 ? 'text-red-500' : 'text-text-secondary')}>
                                        {m.rtDiff > 0 ? '↑' : m.rtDiff < 0 ? '↓' : '-'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-text-secondary py-4">{isKo ? '데이터 없음' : 'No data'}</p>}
                      </div>
                    )}

                    {/* Hand 상세 */}
                    {expandedCard === 'Hand' && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-3">{isKo ? '손기능 평가' : 'Hand Function'} <span className="text-text-secondary font-normal">0-32</span></h3>
                        {handCompareData.length >= 2 ? (() => {
                          const prev = handCompareData[handCompareData.length - 2]
                          const curr = handCompareData[handCompareData.length - 1]
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-2">
                                <p className="text-sm font-bold">Lt.{prev.left} Rt.{prev.right}</p>
                                <div className="flex gap-2"><DiffBadge diff={curr.left - prev.left} /><DiffBadge diff={curr.right - prev.right} /></div>
                                <p className="text-sm font-bold">Lt.{curr.left} Rt.{curr.right}</p>
                              </div>
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={[{ name: isKo ? '이전' : 'Prev', lt: prev.left, rt: prev.right }, { name: isKo ? '현재' : 'Current', lt: curr.left, rt: curr.right }]} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                                  <YAxis domain={[0, 32]} tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }} />
                                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                                  <Bar dataKey="lt" fill="#EC4899" radius={[3, 3, 0, 0]} name={isKo ? '환측(Lt)' : 'Affected(Lt)'}><LabelList dataKey="lt" position="top" style={{ fontSize: 10, fill: '#EC4899', fontWeight: 600 }} /></Bar>
                                  <Bar dataKey="rt" fill="#8B5CF6" radius={[3, 3, 0, 0]} name={isKo ? '건측(Rt)' : 'Sound(Rt)'}><LabelList dataKey="rt" position="top" style={{ fontSize: 10, fill: '#8B5CF6', fontWeight: 600 }} /></Bar>
                                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )
                        })() : <p className="text-xs text-text-secondary py-4">{isKo ? '2회 이상 평가 후 비교 가능' : 'Need 2+ records'}</p>}
                      </div>
                    )}

                    {/* ROM 상세 */}
                    {expandedCard === 'ROM' && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-3">ROM {isKo ? '관절가동범위' : 'Joint Range of Motion'}</h3>
                        {romCurr ? (
                          <div className="space-y-3">
                            {Object.entries(romCurr.scores).map(([jointId, sides]) => (
                              <div key={jointId} className="border border-border rounded-lg overflow-hidden">
                                <div className="bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1.5">
                                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">{jointLabels[jointId] || jointId}</span>
                                </div>
                                <div className="px-3 py-1">
                                  <div className="grid grid-cols-[70px_1fr_45px_45px_45px_45px] gap-1 text-[8px] font-semibold text-text-secondary border-b border-border/50 pb-1 mb-1">
                                    <span>{isKo ? '동작' : 'Motion'}</span><span>{isKo ? '정상범위' : 'Normal'}</span>
                                    <span className="text-center">{isKo ? '이전Lt' : 'Prev Lt'}</span><span className="text-center">{isKo ? '현재Lt' : 'Curr Lt'}</span>
                                    <span className="text-center">{isKo ? '이전Rt' : 'Prev Rt'}</span><span className="text-center">{isKo ? '현재Rt' : 'Curr Rt'}</span>
                                  </div>
                                  {(() => {
                                    const ltM = sides.lt ? Object.keys(sides.lt) : []; const rtM = sides.rt ? Object.keys(sides.rt) : []
                                    return Array.from(new Set([...ltM, ...rtM])).map((motion) => {
                                      const cL = (sides.lt as Record<string, number | null>)?.[motion] ?? null; const cR = (sides.rt as Record<string, number | null>)?.[motion] ?? null
                                      const pL = (romPrev?.scores?.[jointId]?.lt as Record<string, number | null>)?.[motion] ?? null
                                      const pR = (romPrev?.scores?.[jointId]?.rt as Record<string, number | null>)?.[motion] ?? null
                                      const norm = normalRanges[jointId]?.[motion] ?? null
                                      const best = Math.max(cL ?? 0, cR ?? 0); const pct = norm ? Math.min((best / norm) * 100, 100) : 0
                                      const lD = (cL !== null && pL !== null) ? cL - pL : null; const rD = (cR !== null && pR !== null) ? cR - pR : null
                                      return (
                                        <div key={motion} className="grid grid-cols-[70px_1fr_45px_45px_45px_45px] gap-1 items-center py-0.5">
                                          <span className="text-[10px] text-text-primary">{motionLabels[motion] || motion}</span>
                                          <div className="flex items-center gap-1">
                                            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                              <div className={cn('h-full rounded-full', pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${pct}%` }} />
                                            </div>
                                            {norm && <span className="text-[8px] text-text-secondary shrink-0">{Math.round(pct)}%</span>}
                                          </div>
                                          <span className="text-[10px] text-center text-text-secondary">{pL !== null ? `${pL}°` : '-'}</span>
                                          <div className="text-center"><span className="text-[10px] font-bold">{cL !== null ? `${cL}°` : '-'}</span>{lD !== null && lD !== 0 && <span className={cn('text-[8px] ml-0.5', lD > 0 ? 'text-emerald-500' : 'text-red-500')}>{lD > 0 ? `+${lD}` : lD}</span>}</div>
                                          <span className="text-[10px] text-center text-text-secondary">{pR !== null ? `${pR}°` : '-'}</span>
                                          <div className="text-center"><span className="text-[10px] font-bold">{cR !== null ? `${cR}°` : '-'}</span>{rD !== null && rD !== 0 && <span className={cn('text-[8px] ml-0.5', rD > 0 ? 'text-emerald-500' : 'text-red-500')}>{rD > 0 ? `+${rD}` : rD}</span>}</div>
                                        </div>
                                      )
                                    })
                                  })()}
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center gap-4 pt-1">
                              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-emerald-400" /><span className="text-[9px] text-text-secondary">≥80%</span></div>
                              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-amber-400" /><span className="text-[9px] text-text-secondary">50-80%</span></div>
                              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-red-400" /><span className="text-[9px] text-text-secondary">&lt;50%</span></div>
                            </div>
                          </div>
                        ) : <p className="text-xs text-text-secondary py-4">{isKo ? '데이터 없음' : 'No data'}</p>}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
            )
          })()}

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
