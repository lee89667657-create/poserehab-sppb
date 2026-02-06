'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { useAssessmentsStore } from '@/stores/assessments-store'
import type { Assessment } from '@/types/database'

interface TrendPoint {
  date: string
  dateRaw: number
  BBS?: number
  FAC?: number
  MBI?: number
}

interface ClinicalComment {
  type: string
  icon: 'up' | 'stable' | 'down'
  color: string
  title: string
  detail: string
}

export function usePatientAssessments(patientId: string | undefined) {
  const store = useAssessmentsStore()

  useEffect(() => {
    if (patientId) {
      store.fetchAssessments(patientId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const assessments = store._patientId === patientId ? store.assessments : []

  // 타입별 분류
  const byType = useMemo(() => {
    const map: Record<string, Assessment[]> = {}
    assessments.forEach((a) => {
      if (!map[a.assessment_type]) map[a.assessment_type] = []
      map[a.assessment_type].push(a)
    })
    return map
  }, [assessments])

  // 최신 점수 요약
  const latestScores = useMemo(() => {
    const result: Record<string, { score: number | null; date: string }> = {}
    for (const [type, items] of Object.entries(byType)) {
      const latest = items[0]
      result[type] = { score: latest.score ? Number(latest.score) : null, date: latest.assessed_at }
    }
    return result
  }, [byType])

  // 추이 데이터
  const trendData = useMemo((): TrendPoint[] => {
    const dateMap = new Map<string, TrendPoint>()

    const formatDate = (ts: string) => {
      const d = new Date(ts)
      return `${d.getMonth() + 1}/${d.getDate()}`
    }

    const addToMap = (type: 'BBS' | 'FAC' | 'MBI') => {
      const items = byType[type]
      if (!items) return
      ;[...items].reverse().forEach((a) => {
        if (a.score === null) return
        const key = formatDate(a.assessed_at)
        const existing = dateMap.get(key) || { date: key, dateRaw: new Date(a.assessed_at).getTime() }
        existing[type] = Number(a.score)
        dateMap.set(key, existing)
      })
    }

    addToMap('BBS')
    addToMap('FAC')
    addToMap('MBI')

    return Array.from(dateMap.values()).sort((a, b) => a.dateRaw - b.dateRaw)
  }, [byType])

  // 임상 코멘트 생성
  const clinicalComments = useMemo((): ClinicalComment[] => {
    const comments: ClinicalComment[] = []

    const bbsItems = byType['BBS']
    if (bbsItems && bbsItems.length >= 2) {
      const first = bbsItems[bbsItems.length - 1]
      const last = bbsItems[0]
      const diff = Number(last.score) - Number(first.score)
      const firstRisk = (first.details as Record<string, unknown>)?.riskLevel as string
      const lastRisk = (last.details as Record<string, unknown>)?.riskLevel as string
      comments.push({
        type: 'BBS',
        icon: diff > 0 ? 'up' : diff === 0 ? 'stable' : 'down',
        color: 'blue',
        title: `균형능력 ${diff > 0 ? '+' : ''}${diff}점 향상`,
        detail: `BBS ${first.score}→${last.score}점. 낙상위험도 ${firstRisk === 'high' ? '고위험' : '중위험'}에서 ${lastRisk === 'low' ? '저위험' : lastRisk === 'medium' ? '중위험' : '고위험'}으로 변화.`,
      })
    }

    const facItems = byType['FAC']
    if (facItems && facItems.length >= 2) {
      const first = facItems[facItems.length - 1]
      const last = facItems[0]
      comments.push({
        type: 'FAC',
        icon: 'up',
        color: 'amber',
        title: `보행능력 Lv.${first.score}→Lv.${last.score} 향상`,
        detail: `보행 기능이 ${Number(last.score) - Number(first.score)}단계 개선되었습니다.`,
      })
    }

    const mbiItems = byType['MBI']
    if (mbiItems && mbiItems.length >= 2) {
      const first = mbiItems[mbiItems.length - 1]
      const last = mbiItems[0]
      const diff = Number(last.score) - Number(first.score)
      comments.push({
        type: 'MBI',
        icon: diff > 0 ? 'up' : 'stable',
        color: 'emerald',
        title: `일상생활 독립성 ${diff > 0 ? '+' : ''}${diff}점 향상`,
        detail: `MBI ${first.score}→${last.score}점으로 일상생활 수행능력이 개선되고 있습니다.`,
      })
    }

    const mmtItems = byType['MMT']
    if (mmtItems && mmtItems.length >= 2) {
      comments.push({
        type: 'MMT',
        icon: 'up',
        color: 'violet',
        title: '근력 호전 중',
        detail: '도수근력검사 결과 근력이 회복되고 있습니다. 지속적인 근력 강화 운동이 필요합니다.',
      })
    }

    return comments
  }, [byType])

  // 통합 평가 리스트 (최근순)
  const assessmentList = useMemo(() => {
    return assessments.map((a) => {
      let label = ''
      if (a.assessment_type === 'BBS') label = `${a.score}/56점`
      else if (a.assessment_type === 'FAC') label = `Lv.${a.score}`
      else if (a.assessment_type === 'MBI') label = `${a.score}/100점`
      else if (a.assessment_type === 'MMT') {
        const scores = (a.details as Record<string, unknown>)?.scores as Record<string, { lt?: number; rt?: number }> | undefined
        const upperLt = scores?.shoulder_flexor?.lt ?? '-'
        const lowerLt = scores?.hip_flexor?.lt ?? '-'
        label = `상지 ${upperLt}/5, 하지 ${lowerLt}/5`
      } else if (a.assessment_type === 'ROM') label = 'ROM 측정'
      else if (a.assessment_type === 'HandFunction') label = '상지기능 평가'
      else label = a.assessment_type

      return {
        id: a.id,
        type: a.assessment_type,
        timestamp: new Date(a.assessed_at).getTime(),
        score: a.score ? Number(a.score) : undefined,
        label,
      }
    })
  }, [assessments])

  const refetch = useCallback(() => {
    if (!patientId) return
    useAssessmentsStore.getState().invalidate()
    useAssessmentsStore.getState().fetchAssessments(patientId)
  }, [patientId])

  return {
    assessments,
    isLoading: store.isLoading,
    byType,
    latestScores,
    trendData,
    clinicalComments,
    assessmentList,
    refetch,
  }
}
