/**
 * 더미 데이터 모듈
 * - 나중에 Supabase 연결 시 이 파일의 export를 DB 쿼리로 교체하면 됩니다.
 * - 모든 타입은 기존 store/types와 동일한 인터페이스를 사용합니다.
 */

import type { BBSResult } from '@/types/bbs'
import type { FACResult, MBIResult, MMTResult, MMTScore } from '@/types/assessments'

// ─── 환자 정보 ─────────────────────────────────────────────
export interface PatientInfo {
  name: string
  age: number
  gender: '남' | '여'
  diagnosis: string
  admissionDate: string // YYYY-MM-DD
  ward?: string
}

export const DUMMY_PATIENT: PatientInfo = {
  name: '김영수',
  age: 65,
  gender: '남',
  diagnosis: '뇌졸중 (좌측 편마비)',
  admissionDate: '2025-12-15',
}

// ─── 대시보드 요약 통계 ────────────────────────────────────
export const DUMMY_DASHBOARD_STATS = {
  todayAssessments: 2,
  todayExerciseSessions: 3,
  complianceRate: 78,
}

// ─── BBS 평가 기록 (4회) ───────────────────────────────────
export const DUMMY_BBS_HISTORY: BBSResult[] = [
  {
    id: 'bbs-dummy-4',
    timestamp: new Date('2026-02-04T09:00:00').getTime(),
    scores: { 1:3, 2:3, 3:3, 4:3, 5:3, 6:3, 7:2, 8:3, 9:2, 10:3, 11:2, 12:3, 13:2, 14:3 },
    totalScore: 38,
    riskLevel: 'medium',
  },
  {
    id: 'bbs-dummy-3',
    timestamp: new Date('2026-01-30T11:00:00').getTime(),
    scores: { 1:3, 2:2, 3:3, 4:2, 5:2, 6:2, 7:2, 8:3, 9:2, 10:2, 11:2, 12:2, 13:2, 14:2 },
    totalScore: 31,
    riskLevel: 'medium',
  },
  {
    id: 'bbs-dummy-2',
    timestamp: new Date('2026-01-20T14:00:00').getTime(),
    scores: { 1:2, 2:2, 3:3, 4:2, 5:2, 6:2, 7:2, 8:2, 9:2, 10:2, 11:1, 12:2, 13:2, 14:2 },
    totalScore: 28,
    riskLevel: 'medium',
  },
  {
    id: 'bbs-dummy-1',
    timestamp: new Date('2026-01-10T10:00:00').getTime(),
    scores: { 1:2, 2:1, 3:2, 4:1, 5:1, 6:2, 7:1, 8:2, 9:1, 10:2, 11:1, 12:2, 13:1, 14:2 },
    totalScore: 21,
    riskLevel: 'high',
  },
]

// ─── FAC 평가 기록 (3회) ───────────────────────────────────
export const DUMMY_FAC_HISTORY: FACResult[] = [
  {
    id: 'fac-dummy-3',
    timestamp: new Date('2026-02-04T10:30:00').getTime(),
    level: 3,
    notes: '감독 하 보행 가능, 계단 보조 필요',
  },
  {
    id: 'fac-dummy-2',
    timestamp: new Date('2026-01-25T10:00:00').getTime(),
    level: 2,
    notes: '간헐적 보조 필요, 균형 개선 중',
  },
  {
    id: 'fac-dummy-1',
    timestamp: new Date('2026-01-10T10:30:00').getTime(),
    level: 1,
    notes: '지속적 보조 필요',
  },
]

// ─── MBI 평가 기록 (3회) ───────────────────────────────────
export const DUMMY_MBI_HISTORY: MBIResult[] = [
  {
    id: 'mbi-dummy-3',
    timestamp: new Date('2026-02-04T11:00:00').getTime(),
    scores: {
      grooming: 3, bathing: 3, eating: 8, toilet: 5,
      stairs: 5, dressing: 8, bowel: 5, bladder: 8,
      walking: 8, wheelchair: 4, transfer: 5,
    },
    totalScore: 62,
  },
  {
    id: 'mbi-dummy-2',
    timestamp: new Date('2026-01-25T10:30:00').getTime(),
    scores: {
      grooming: 3, bathing: 3, eating: 5, toilet: 5,
      stairs: 5, dressing: 5, bowel: 5, bladder: 5,
      walking: 8, wheelchair: 3, transfer: 8,
    },
    totalScore: 55,
  },
  {
    id: 'mbi-dummy-1',
    timestamp: new Date('2026-01-10T11:00:00').getTime(),
    scores: {
      grooming: 1, bathing: 1, eating: 5, toilet: 5,
      stairs: 2, dressing: 5, bowel: 5, bladder: 5,
      walking: 8, wheelchair: 3, transfer: 5,
    },
    totalScore: 45,
  },
]

// ─── MMT 평가 기록 (2회) ───────────────────────────────────
// 좌측 편마비 → lt(좌)에 장애, rt(우)는 정상(5)
const mmtScores1: Record<string, MMTScore> = {
  // 2026-01-15: 좌측 상지 2/5, 좌측 하지 3/5
  shoulder_flexor:         { lt: 2, rt: 5 },
  elbow_flexor_extensor:   { lt: 2, rt: 5 },
  finger_flexor_extensor:  { lt: 2, rt: 5 },
  hip_flexor:              { lt: 3, rt: 5 },
  knee_extensor:           { lt: 3, rt: 5 },
  ankle_dorsiflexor:       { lt: 3, rt: 5 },
}

const mmtScores2: Record<string, MMTScore> = {
  // 2026-02-04: 좌측 상지 3/5, 좌측 하지 3+/5 (3+는 일부 4로 표현)
  shoulder_flexor:         { lt: 3, rt: 5 },
  elbow_flexor_extensor:   { lt: 3, rt: 5 },
  finger_flexor_extensor:  { lt: 3, rt: 5 },
  hip_flexor:              { lt: 4, rt: 5 },
  knee_extensor:           { lt: 3, rt: 5 },
  ankle_dorsiflexor:       { lt: 4, rt: 5 },
}

export const DUMMY_MMT_HISTORY: MMTResult[] = [
  {
    id: 'mmt-dummy-2',
    timestamp: new Date('2026-02-04T14:00:00').getTime(),
    scores: mmtScores2,
  },
  {
    id: 'mmt-dummy-1',
    timestamp: new Date('2026-01-15T10:00:00').getTime(),
    scores: mmtScores1,
  },
]

// ─── 통합 평가 리스트 (최근순) ─────────────────────────────
export interface DummyAssessmentItem {
  id: string
  type: 'BBS' | 'FAC' | 'MBI' | 'MMT'
  timestamp: number
  score?: number
  label: string
}

export function getDummyAssessments(): DummyAssessmentItem[] {
  const items: DummyAssessmentItem[] = []

  DUMMY_BBS_HISTORY.forEach((r) => {
    items.push({ id: r.id, type: 'BBS', timestamp: r.timestamp, score: r.totalScore, label: `${r.totalScore}/56점` })
  })
  DUMMY_FAC_HISTORY.forEach((r) => {
    items.push({ id: r.id, type: 'FAC', timestamp: r.timestamp, score: r.level, label: `Lv.${r.level}` })
  })
  DUMMY_MBI_HISTORY.forEach((r) => {
    items.push({ id: r.id, type: 'MBI', timestamp: r.timestamp, score: r.totalScore, label: `${r.totalScore}/100점` })
  })
  DUMMY_MMT_HISTORY.forEach((r) => {
    const upperLt = r.scores.shoulder_flexor?.lt ?? '-'
    const lowerLt = r.scores.hip_flexor?.lt ?? '-'
    items.push({ id: r.id, type: 'MMT', timestamp: r.timestamp, label: `상지 ${upperLt}/5, 하지 ${lowerLt}/5` })
  })

  return items.sort((a, b) => b.timestamp - a.timestamp)
}

// ─── 차트용 통합 추이 데이터 ───────────────────────────────
export interface TrendDataPoint {
  date: string
  dateRaw: number
  BBS?: number
  FAC?: number
  MBI?: number
}

export function getDummyTrendData(): TrendDataPoint[] {
  const dateMap = new Map<string, TrendDataPoint>()

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  // BBS
  ;[...DUMMY_BBS_HISTORY].reverse().forEach((r) => {
    const key = formatDate(r.timestamp)
    const existing = dateMap.get(key) || { date: key, dateRaw: r.timestamp }
    existing.BBS = r.totalScore
    dateMap.set(key, existing)
  })

  // FAC
  ;[...DUMMY_FAC_HISTORY].reverse().forEach((r) => {
    const key = formatDate(r.timestamp)
    const existing = dateMap.get(key) || { date: key, dateRaw: r.timestamp }
    existing.FAC = r.level
    dateMap.set(key, existing)
  })

  // MBI
  ;[...DUMMY_MBI_HISTORY].reverse().forEach((r) => {
    const key = formatDate(r.timestamp)
    const existing = dateMap.get(key) || { date: key, dateRaw: r.timestamp }
    existing.MBI = r.totalScore
    dateMap.set(key, existing)
  })

  return Array.from(dateMap.values()).sort((a, b) => a.dateRaw - b.dateRaw)
}

// ─── 환자 친화적 임상 코멘트 ───────────────────────────────
export interface ClinicalComment {
  type: string
  icon: 'up' | 'stable' | 'down'
  color: string
  title: string
  detail: string
}

export function getDummyClinicalComments(): ClinicalComment[] {
  const bbsFirst = DUMMY_BBS_HISTORY[DUMMY_BBS_HISTORY.length - 1]
  const bbsLast = DUMMY_BBS_HISTORY[0]
  const bbsDiff = bbsLast.totalScore - bbsFirst.totalScore

  const facFirst = DUMMY_FAC_HISTORY[DUMMY_FAC_HISTORY.length - 1]
  const facLast = DUMMY_FAC_HISTORY[0]

  const mbiFirst = DUMMY_MBI_HISTORY[DUMMY_MBI_HISTORY.length - 1]
  const mbiLast = DUMMY_MBI_HISTORY[0]
  const mbiDiff = mbiLast.totalScore - mbiFirst.totalScore

  return [
    {
      type: 'BBS',
      icon: 'up',
      color: 'blue',
      title: `균형능력 ${bbsDiff > 0 ? '+' : ''}${bbsDiff}점 향상`,
      detail: `BBS ${bbsFirst.totalScore}→${bbsLast.totalScore}점. 낙상위험도 ${bbsFirst.riskLevel === 'high' ? '고위험' : '중위험'}에서 ${bbsLast.riskLevel === 'medium' ? '중위험' : '저위험'}으로 개선되었습니다.`,
    },
    {
      type: 'FAC',
      icon: 'up',
      color: 'amber',
      title: `보행능력 Lv.${facFirst.level}→Lv.${facLast.level} 향상`,
      detail: '지속적 보조가 필요했으나, 현재 감독 하 독립보행이 가능합니다. 꾸준한 보행훈련이 효과를 보이고 있습니다.',
    },
    {
      type: 'MBI',
      icon: 'up',
      color: 'emerald',
      title: `일상생활 독립성 ${mbiDiff > 0 ? '+' : ''}${mbiDiff}점 향상`,
      detail: `MBI ${mbiFirst.totalScore}→${mbiLast.totalScore}점. 식사, 옷 입기, 소변조절 영역에서 뚜렷한 향상을 보이고 있습니다.`,
    },
    {
      type: 'MMT',
      icon: 'up',
      color: 'violet',
      title: '좌측 근력 호전 중',
      detail: '좌측 상지 2→3등급, 하지 3→3+등급으로 근력이 회복되고 있습니다. 지속적인 근력 강화 운동이 필요합니다.',
    },
  ]
}
