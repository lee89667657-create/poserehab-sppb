'use client'

import { useState, useCallback, useRef } from 'react'
import { FileDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SEV_LABELS, SEV_COLORS } from '@/types/anatomy'
import type { Severity } from '@/types/anatomy'
import type { AssessmentScoreCard } from '@/hooks/use-assessment-summary'

interface ReferralRegion {
  regionKey: string
  regionName: string
  severity: Severity
  reason: string
}

interface ReferralReportProps {
  patientName: string
  date: string
  diagnosis: string
  regions: ReferralRegion[]
  summaryText: string
  scoreCards?: AssessmentScoreCard[]
  mmtSummary?: string
  romSummary?: string
}

export function ReferralReport({
  patientName,
  date,
  diagnosis,
  regions,
  summaryText,
  scoreCards = [],
  mmtSummary = '',
  romSummary = '',
}: ReferralReportProps) {
  const [purpose, setPurpose] = useState('')
  const [destination, setDestination] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

  const handleExportPdf = useCallback(async () => {
    if (!reportRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      // Handle multi-page if content is taller than A4
      const pageHeight = pdf.internal.pageSize.getHeight()
      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      } else {
        let position = 0
        let remaining = pdfHeight
        while (remaining > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
          remaining -= pageHeight
          if (remaining > 0) {
            pdf.addPage()
            position -= pageHeight
          }
        }
      }

      pdf.save(`referral-${patientName}-${date}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }, [patientName, date])

  const abnormalRegions = regions.filter((r) => r.severity !== 'normal')

  return (
    <div className="space-y-4">
      <div ref={reportRef} className="space-y-4">
        {/* Patient Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">의뢰서</CardTitle>
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

        {/* Assessment Scores (included in PDF) */}
        {scoreCards.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">평가 결과 요약</CardTitle>
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
                    <div className="mt-1 text-xl font-bold" style={{ color: card.color }}>
                      {card.score}
                      <span className="text-xs font-normal text-text-secondary">/{card.maxScore}</span>
                    </div>
                    {card.detail && (
                      <p className="mt-0.5 text-[10px] font-semibold" style={{ color: card.color }}>
                        {card.detail}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-text-secondary">{card.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MMT / ROM (included in PDF) */}
        {(mmtSummary || romSummary) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MMT / ROM 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mmtSummary && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">MMT</p>
                  <pre className="text-xs text-text-primary whitespace-pre-wrap bg-background rounded-lg p-2 border border-border">
                    {mmtSummary}
                  </pre>
                </div>
              )}
              {romSummary && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">ROM</p>
                  <pre className="text-xs text-text-primary whitespace-pre-wrap bg-background rounded-lg p-2 border border-border">
                    {romSummary}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Latest Assessment Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">최근 평가 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{summaryText}</p>
            {abnormalRegions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {abnormalRegions.map((r) => (
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
            )}
          </CardContent>
        </Card>

        {/* Referral Purpose */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">의뢰 내용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                의뢰 목적 (Referral Purpose)
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                rows={4}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="의뢰 사유와 요청 사항을 기술하세요"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                의뢰 대상 (Destination)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="예: 정형외과, OO병원 재활의학과"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Button onClick={handleExportPdf}>
        <FileDown className="mr-1.5 h-4 w-4" />
        PDF 내보내기
      </Button>
    </div>
  )
}
