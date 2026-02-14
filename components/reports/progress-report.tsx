'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEV_LABELS, SEV_COLORS, severityRank } from '@/types/anatomy'
import type { Severity } from '@/types/anatomy'
import type { AssessmentTrendPoint } from '@/hooks/use-assessment-summary'
import { cn } from '@/lib/utils'

interface SeveritySnapshot {
  date: string
  regions: { regionKey: string; regionName: string; severity: Severity }[]
}

interface ProgressReportProps {
  patientName: string
  periodStart: string
  periodEnd: string
  snapshots: SeveritySnapshot[]
  assessmentTrend?: AssessmentTrendPoint[]
}

export function ProgressReport({
  patientName,
  periodStart,
  periodEnd,
  snapshots,
  assessmentTrend = [],
}: ProgressReportProps) {
  const totalDays = snapshots.length > 1
    ? Math.ceil(
        (new Date(snapshots[snapshots.length - 1].date).getTime() -
          new Date(snapshots[0].date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  // Collect all unique region keys
  const allRegionKeys = new Set<string>()
  for (const snap of snapshots) {
    for (const r of snap.regions) {
      allRegionKeys.add(r.regionKey)
    }
  }

  // Build trend chart data: each snapshot date with average severity rank
  const chartData = snapshots.map((snap) => {
    const avg =
      snap.regions.length > 0
        ? snap.regions.reduce((sum, r) => sum + severityRank(r.severity), 0) /
          snap.regions.length
        : 0
    return {
      date: snap.date,
      severity: Math.round(avg * 100) / 100,
    }
  })

  // Change summary: compare first and last snapshot
  const first = snapshots[0]
  const last = snapshots[snapshots.length - 1]

  interface ChangeItem {
    regionKey: string
    regionName: string
    from: Severity
    to: Severity
    change: 'improved' | 'unchanged' | 'worsened'
  }

  const changes: ChangeItem[] = []
  if (first && last) {
    const firstMap = new Map(first.regions.map((r) => [r.regionKey, r]))
    for (const r of last.regions) {
      const prev = firstMap.get(r.regionKey)
      if (prev) {
        const prevRank = severityRank(prev.severity)
        const currRank = severityRank(r.severity)
        let change: ChangeItem['change'] = 'unchanged'
        if (currRank < prevRank) change = 'improved'
        else if (currRank > prevRank) change = 'worsened'
        changes.push({
          regionKey: r.regionKey,
          regionName: r.regionName,
          from: prev.severity,
          to: r.severity,
          change,
        })
      }
    }
  }

  const improved = changes.filter((c) => c.change === 'improved').length
  const unchanged = changes.filter((c) => c.change === 'unchanged').length
  const worsened = changes.filter((c) => c.change === 'worsened').length

  const changeBadges = [
    { label: '호전', count: improved, color: 'bg-emerald-500' },
    { label: '유지', count: unchanged, color: 'bg-gray-400' },
    { label: '악화', count: worsened, color: 'bg-red-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Period Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">진행 경과 보고서</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-text-secondary">환자명</p>
              <p className="text-sm font-semibold text-text-primary">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">기간</p>
              <p className="text-sm font-semibold text-text-primary">
                {periodStart} ~ {periodEnd}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">평가 횟수</p>
              <p className="text-sm font-semibold text-text-primary">{snapshots.length}회</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">경과일</p>
              <p className="text-sm font-semibold text-text-primary">{totalDays}일</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">변화 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {changeBadges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white',
                  b.color
                )}
              >
                {b.label}: {b.count}개
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Severity Trend Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">중증도 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  tickFormatter={(v: number) => {
                    const labels: Record<number, string> = { 0: '정상', 1: '경도', 2: '중등도', 3: '중증' }
                    return labels[v] || ''
                  }}
                  tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}`, '평균 중증도']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="severity"
                  name="평균 중증도"
                  stroke="#FF6B6B"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#FF6B6B', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Severity Comparison Table */}
      {changes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">중증도 비교 (최초 vs 최종)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">
                      부위
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary">
                      최초
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary">
                      최종
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary">
                      변화
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {changes.map((c) => (
                    <tr key={c.regionKey} className="transition-colors hover:bg-background/50">
                      <td className="px-4 py-2.5 text-sm text-text-primary">{c.regionName}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: SEV_COLORS[c.from] }}
                        >
                          {SEV_LABELS[c.from]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: SEV_COLORS[c.to] }}
                        >
                          {SEV_LABELS[c.to]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            c.change === 'improved' && 'text-emerald-500',
                            c.change === 'unchanged' && 'text-text-secondary',
                            c.change === 'worsened' && 'text-red-500'
                          )}
                        >
                          {c.change === 'improved' ? '호전' : c.change === 'worsened' ? '악화' : '유지'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Assessment Score Trend */}
      {assessmentTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">평가 점수 변화 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={assessmentTrend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 11 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {assessmentTrend.some((d) => d.bbs !== undefined) && (
                  <Line type="monotone" dataKey="bbs" name="BBS" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                )}
                {assessmentTrend.some((d) => d.fac !== undefined) && (
                  <Line type="monotone" dataKey="fac" name="FAC" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                )}
                {assessmentTrend.some((d) => d.mbi !== undefined) && (
                  <Line type="monotone" dataKey="mbi" name="MBI" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
