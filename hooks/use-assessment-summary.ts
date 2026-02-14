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
import type { Assessment } from '@/types/database'

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

/**
 * Build assessment summary from Supabase Assessment[] data.
 * Returns the same scoreCards/trendData/mmtSummary/romSummary format
 * used by the reports page.
 */
export function buildSummaryFromDB(assessments: Assessment[]): {
  scoreCards: AssessmentScoreCard[]
  trendData: AssessmentTrendPoint[]
  mmtSummary: string
  romSummary: string
} {
  // Group by assessment_type, sort each group newest first
  const byType: Record<string, Assessment[]> = {}
  for (const a of assessments) {
    if (!byType[a.assessment_type]) byType[a.assessment_type] = []
    byType[a.assessment_type].push(a)
  }
  for (const key of Object.keys(byType)) {
    byType[key].sort((a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime())
  }

  // --- Score Cards ---
  const scoreCards: AssessmentScoreCard[] = []

  const latestBBS = byType['BBS']?.[0]
  if (latestBBS) {
    const details = latestBBS.details as Record<string, unknown> | null
    const riskLevel = (details?.riskLevel as string) || ''
    scoreCards.push({
      type: 'BBS',
      label: 'Berg Balance Scale',
      score: Number(latestBBS.score) || 0,
      maxScore: 56,
      date: latestBBS.assessed_at.split('T')[0],
      color: getBBSColor(riskLevel),
      detail: getBBSRiskLabel(riskLevel),
    })
  }

  const latestFAC = byType['FAC']?.[0]
  if (latestFAC) {
    const score = Number(latestFAC.score) || 0
    scoreCards.push({
      type: 'FAC',
      label: 'Functional Ambulation',
      score,
      maxScore: 5,
      date: latestFAC.assessed_at.split('T')[0],
      color: score >= 4 ? '#10B981' : score >= 2 ? '#F59E0B' : '#EF4444',
    })
  }

  const latestMBI = byType['MBI']?.[0]
  if (latestMBI) {
    const score = Number(latestMBI.score) || 0
    scoreCards.push({
      type: 'MBI',
      label: 'Modified Barthel Index',
      score,
      maxScore: 100,
      date: latestMBI.assessed_at.split('T')[0],
      color: score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
    })
  }

  const latestHF = byType['HandFunction']?.[0]
  if (latestHF) {
    const details = latestHF.details as Record<string, unknown> | null
    const leftTotal = (details?.leftTotalScore as number) ?? 0
    const rightTotal = (details?.rightTotalScore as number) ?? 0
    scoreCards.push({
      type: 'Hand',
      label: 'Hand Function',
      score: `L:${leftTotal}/R:${rightTotal}`,
      maxScore: 32,
      date: latestHF.assessed_at.split('T')[0],
      color: '#6366F1',
    })
  }

  // --- Trend Data ---
  const dateMap = new Map<string, AssessmentTrendPoint>()

  const addTrend = (type: string, key: 'bbs' | 'fac' | 'mbi') => {
    const items = byType[type]
    if (!items) return
    for (const a of [...items].reverse()) {
      if (a.score === null) continue
      const d = a.assessed_at.split('T')[0]
      const existing = dateMap.get(d) || { date: d }
      existing[key] = Number(a.score)
      dateMap.set(d, existing)
    }
  }

  addTrend('BBS', 'bbs')
  addTrend('FAC', 'fac')
  addTrend('MBI', 'mbi')

  const trendData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // --- MMT Summary ---
  let mmtSummary = ''
  const latestMMT = byType['MMT']?.[0]
  if (latestMMT) {
    const details = latestMMT.details as Record<string, unknown> | null
    const scores = details?.scores as Record<string, { lt?: number; rt?: number }> | undefined
    if (scores) {
      const mmtResult: MMTResult = {
        id: latestMMT.id,
        timestamp: new Date(latestMMT.assessed_at).getTime(),
        scores: {},
      }
      for (const [key, val] of Object.entries(scores)) {
        mmtResult.scores[key] = {
          lt: val.lt ?? null,
          rt: val.rt ?? null,
        }
      }
      mmtSummary = buildMMTSummary(mmtResult)
    }
  }

  // --- ROM Summary ---
  let romSummary = ''
  const latestROM = byType['ROM']?.[0]
  if (latestROM) {
    const details = latestROM.details as Record<string, unknown> | null
    const scores = details?.scores as Record<string, { lt?: Record<string, number | null>; rt?: Record<string, number | null> }> | undefined
    if (scores) {
      const lines: string[] = []
      const matched = new Set<string>()

      // Try matching ROM_ITEMS IDs first
      for (const item of ROM_ITEMS) {
        const score = scores[item.id]
        if (!score) continue
        matched.add(item.id)
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

      // Unmatched raw keys (e.g. 'shoulder', 'knee', 'hip' from seed data)
      for (const [key, score] of Object.entries(scores)) {
        if (matched.has(key)) continue
        const ltValues = Object.entries(score.lt || {})
          .filter(([, v]) => v !== null)
          .map(([k, v]) => `${k}:${v}°`)
          .join('/')
        const rtValues = Object.entries(score.rt || {})
          .filter(([, v]) => v !== null)
          .map(([k, v]) => `${k}:${v}°`)
          .join('/')
        if (ltValues || rtValues) {
          const name = key.charAt(0).toUpperCase() + key.slice(1)
          lines.push(`${name}: Lt.(${ltValues || '-'}) / Rt.(${rtValues || '-'})`)
        }
      }

      romSummary = lines.join('\n')
    }
  }

  return { scoreCards, trendData, mmtSummary, romSummary }
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
