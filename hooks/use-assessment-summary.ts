import { useMemo } from 'react'
import { useBBSStore } from '@/stores/bbs-store'
import { useFACStore } from '@/stores/fac-store'
import { useMBIStore } from '@/stores/mbi-store'
import { useMMTStore } from '@/stores/mmt-store'
import { useROMAssessmentStore } from '@/stores/rom-assessment-store'
import { useHandFunctionStore } from '@/stores/hand-function-store'
import { MMT_ITEMS, MMT_GRADES, ROM_ITEMS } from '@/types/assessments'
import type { BBSResult } from '@/types/bbs'
import type { FACResult, MBIResult, MMTResult, ROMResult, HandFunctionResult } from '@/types/assessments'

export interface AssessmentScoreCard {
  type: string
  label: string
  score: number | string
  maxScore: number | string
  date: string
  color: string
  detail?: string
}

export interface AssessmentTrendPoint {
  date: string
  bbs?: number
  fac?: number
  mbi?: number
}

export interface AssessmentSummary {
  hasData: boolean
  scoreCards: AssessmentScoreCard[]
  trendData: AssessmentTrendPoint[]
  mmtSummary: string
  romSummary: string
  latestBBS: BBSResult | null
  latestFAC: FACResult | null
  latestMBI: MBIResult | null
  latestMMT: MMTResult | null
  latestROM: ROMResult | null
  latestHandFunction: HandFunctionResult | null
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0]
}

function getBBSRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'high': return 'High Fall Risk'
    case 'medium': return 'Medium Fall Risk'
    case 'low': return 'Low Fall Risk'
    default: return ''
  }
}

function getBBSColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'high': return '#EF4444'
    case 'medium': return '#F59E0B'
    case 'low': return '#10B981'
    default: return '#6B7280'
  }
}

function buildMMTSummary(result: MMTResult): string {
  const lines: string[] = []
  for (const item of MMT_ITEMS) {
    const score = result.scores[item.id]
    if (!score) continue
    const ltGrade = score.lt !== null ? MMT_GRADES[score.lt]?.grade ?? '-' : '-'
    const rtGrade = score.rt !== null ? MMT_GRADES[score.rt]?.grade ?? '-' : '-'
    if (ltGrade !== '-' || rtGrade !== '-') {
      lines.push(`${item.name}: Lt.${ltGrade} / Rt.${rtGrade}`)
    }
  }
  return lines.join('\n')
}

function buildROMSummary(result: ROMResult): string {
  const lines: string[] = []
  for (const item of ROM_ITEMS) {
    const score = result.scores[item.id]
    if (!score) continue
    const ltValues = Object.entries(score.lt || {})
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `${k}:${v}°`)
      .join('/')
    const rtValues = Object.entries(score.rt || {})
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `${k}:${v}°`)
      .join('/')
    if (ltValues || rtValues) {
      lines.push(`${item.name}: Lt.(${ltValues || '-'}) / Rt.(${rtValues || '-'})`)
    }
  }
  return lines.join('\n')
}

export function useAssessmentSummary(): AssessmentSummary {
  const bbsHistory = useBBSStore((s) => s.history)
  const facHistory = useFACStore((s) => s.history)
  const mbiHistory = useMBIStore((s) => s.history)
  const mmtHistory = useMMTStore((s) => s.history)
  const romHistory = useROMAssessmentStore((s) => s.history)
  const handHistory = useHandFunctionStore((s) => s.history)

  return useMemo(() => {
    const latestBBS = bbsHistory[0] ?? null
    const latestFAC = facHistory[0] ?? null
    const latestMBI = mbiHistory[0] ?? null
    const latestMMT = mmtHistory[0] ?? null
    const latestROM = romHistory[0] ?? null
    const latestHandFunction = handHistory[0] ?? null

    const hasData = !!(latestBBS || latestFAC || latestMBI || latestMMT || latestROM || latestHandFunction)

    // Score cards
    const scoreCards: AssessmentScoreCard[] = []

    if (latestBBS) {
      scoreCards.push({
        type: 'BBS',
        label: 'Berg Balance Scale',
        score: latestBBS.totalScore,
        maxScore: 56,
        date: formatDate(latestBBS.timestamp),
        color: getBBSColor(latestBBS.riskLevel),
        detail: getBBSRiskLabel(latestBBS.riskLevel),
      })
    }

    if (latestFAC) {
      scoreCards.push({
        type: 'FAC',
        label: 'Functional Ambulation',
        score: latestFAC.level,
        maxScore: 5,
        date: formatDate(latestFAC.timestamp),
        color: latestFAC.level >= 4 ? '#10B981' : latestFAC.level >= 2 ? '#F59E0B' : '#EF4444',
      })
    }

    if (latestMBI) {
      scoreCards.push({
        type: 'MBI',
        label: 'Modified Barthel Index',
        score: latestMBI.totalScore,
        maxScore: 100,
        date: formatDate(latestMBI.timestamp),
        color: latestMBI.totalScore >= 75 ? '#10B981' : latestMBI.totalScore >= 50 ? '#F59E0B' : '#EF4444',
      })
    }

    if (latestHandFunction) {
      scoreCards.push({
        type: 'Hand',
        label: 'Hand Function',
        score: `L:${latestHandFunction.leftTotalScore}/R:${latestHandFunction.rightTotalScore}`,
        maxScore: 32,
        date: formatDate(latestHandFunction.timestamp),
        color: '#6366F1',
      })
    }

    // Trend data: merge BBS, FAC, MBI histories by date
    const dateMap = new Map<string, AssessmentTrendPoint>()

    for (const r of [...bbsHistory].reverse()) {
      const d = formatDate(r.timestamp)
      const existing = dateMap.get(d) || { date: d }
      existing.bbs = r.totalScore
      dateMap.set(d, existing)
    }
    for (const r of [...facHistory].reverse()) {
      const d = formatDate(r.timestamp)
      const existing = dateMap.get(d) || { date: d }
      existing.fac = r.level
      dateMap.set(d, existing)
    }
    for (const r of [...mbiHistory].reverse()) {
      const d = formatDate(r.timestamp)
      const existing = dateMap.get(d) || { date: d }
      existing.mbi = r.totalScore
      dateMap.set(d, existing)
    }

    const trendData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Text summaries
    const mmtSummary = latestMMT ? buildMMTSummary(latestMMT) : ''
    const romSummary = latestROM ? buildROMSummary(latestROM) : ''

    return {
      hasData,
      scoreCards,
      trendData,
      mmtSummary,
      romSummary,
      latestBBS,
      latestFAC,
      latestMBI,
      latestMMT,
      latestROM,
      latestHandFunction,
    }
  }, [bbsHistory, facHistory, mbiHistory, mmtHistory, romHistory, handHistory])
}
