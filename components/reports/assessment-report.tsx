'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEV_LABELS, SEV_COLORS } from '@/types/anatomy'
import type { Severity, SoapNotes } from '@/types/anatomy'
import type { AssessmentScoreCard, AssessmentTrendPoint } from '@/hooks/use-assessment-summary'
import { cn } from '@/lib/utils'

interface AssessmentRegion {
  regionKey: string
  regionName: string
  severity: Severity
  reason: string
}

interface AssessmentData {
  patientName: string
  date: string
  diagnosis: string
  regions: AssessmentRegion[]
  soap?: SoapNotes
}

interface AssessmentReportProps {
  assessmentData: AssessmentData
  scoreCards?: AssessmentScoreCard[]
  trendData?: AssessmentTrendPoint[]
  mmtSummary?: string
  romSummary?: string
}

export function AssessmentReport({
  assessmentData,
  scoreCards = [],
  trendData = [],
  mmtSummary = '',
  romSummary = '',
}: AssessmentReportProps) {
  const { patientName, date, diagnosis, regions, soap } = assessmentData

  // Severity distribution
  const sevCounts: Record<Severity, number> = { normal: 0, mild: 0, moderate: 0, severe: 0 }
  for (const r of regions) {
    sevCounts[r.severity] = (sevCounts[r.severity] || 0) + 1
  }

  const hasTrend = trendData.length > 1
  const hasAssessment = scoreCards.length > 0 || mmtSummary || romSummary

  return (
    <div className="space-y-4" id="assessment-report-content">
      {/* Patient Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">환자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-text-secondary">환자명</p>
              <p className="text-sm font-semibold text-text-primary">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">평가일</p>
              <p className="text-sm font-semibold text-text-primary">{date}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">진단명</p>
              <p className="text-sm font-semibold text-text-primary">{diagnosis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Score Cards */}
      {scoreCards.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">평가 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {scoreCards.map((card) => (
                <div
                  key={card.type}
                  className="rounded-lg border border-border p-3 text-center"
                >
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                    {card.type}
                  </p>
                  <div className="mt-1 text-2xl font-bold" style={{ color: card.color }}>
                    {card.score}
                    <span className="text-xs font-normal text-text-secondary">/{card.maxScore}</span>
                  </div>
                  {card.detail && (
                    <p className="mt-0.5 text-[10px] font-semibold" style={{ color: card.color }}>
                      {card.detail}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-text-secondary">{card.date}</p>
                  <p className="text-[10px] text-text-secondary">{card.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MMT / ROM Summary */}
      {(mmtSummary || romSummary) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">MMT / ROM 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mmtSummary && (
              <div>
                <p className="text-xs font-semibold text-primary mb-1">MMT (Manual Muscle Testing)</p>
                <pre className="text-xs text-text-primary whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                  {mmtSummary}
                </pre>
              </div>
            )}
            {romSummary && (
              <div>
                <p className="text-xs font-semibold text-primary mb-1">ROM (Range of Motion)</p>
                <pre className="text-xs text-text-primary whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                  {romSummary}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assessment Score Trend Chart */}
      {hasTrend && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">평가 점수 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
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
                {trendData.some((d) => d.bbs !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="bbs"
                    name="BBS (0-56)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                    connectNulls
                  />
                )}
                {trendData.some((d) => d.fac !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="fac"
                    name="FAC (0-5)"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                    connectNulls
                  />
                )}
                {trendData.some((d) => d.mbi !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="mbi"
                    name="MBI (0-100)"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Severity Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">중증도 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(sevCounts) as Severity[]).map((sev) => (
              <span
                key={sev}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white'
                )}
                style={{ backgroundColor: SEV_COLORS[sev] }}
              >
                {SEV_LABELS[sev]}: {sevCounts[sev]}개
              </span>
            ))}
          </div>

          {/* Region list */}
          <div className="mt-4 space-y-2">
            {regions.filter((r) => r.severity !== 'normal').map((r) => (
              <div
                key={r.regionKey}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium text-text-primary">{r.regionName}</span>
                  <span className="ml-2 text-xs text-text-secondary">{r.reason}</span>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: SEV_COLORS[r.severity] }}
                >
                  {SEV_LABELS[r.severity]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SOAP Summary */}
      {soap && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SOAP 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-primary">S (Subjective)</p>
                <p className="mt-0.5 text-sm text-text-primary">
                  {soap.subjective.chiefComplaint || '-'}
                </p>
                {soap.subjective.painScale > 0 && (
                  <p className="text-xs text-text-secondary">
                    통증: {soap.subjective.painScale}/10 | 부위: {soap.subjective.painLocation || '-'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">O (Objective)</p>
                <p className="mt-0.5 text-sm text-text-primary whitespace-pre-wrap">
                  {soap.objective.autoFindings || '-'}
                </p>
                {soap.objective.rom && (
                  <p className="text-xs text-text-secondary">ROM: {soap.objective.rom}</p>
                )}
                {soap.objective.mmt && (
                  <p className="text-xs text-text-secondary">MMT: {soap.objective.mmt}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">A (Assessment)</p>
                <p className="mt-0.5 text-sm text-text-primary">
                  {soap.assessment.clinicalImpression || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">P (Plan)</p>
                <p className="mt-0.5 text-sm text-text-primary">
                  {soap.plan.treatment || '-'}
                </p>
                {soap.plan.hep && (
                  <p className="text-xs text-text-secondary">HEP: {soap.plan.hep}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!hasAssessment && regions.length === 0 && !soap && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-text-secondary">
              평가 결과가 없습니다. 평가도구에서 평가를 실시해주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
