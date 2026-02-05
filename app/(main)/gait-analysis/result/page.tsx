'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  Scale,
  Footprints,
  Armchair,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useSPPBStore } from '@/stores/sppb-store'
import { useTranslation } from '@/hooks/use-translation'
import type { SPPBResult } from '@/types/sppb'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function SPPBResultPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-text-secondary">Loading...</div>
          </div>
        </MainLayout>
      }
    >
      <SPPBResultContent />
    </Suspense>
  )
}

function SPPBResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resultId = searchParams.get('id')
  const { language } = useTranslation()

  const { history } = useSPPBStore()
  const [result, setResult] = useState<SPPBResult | null>(null)
  const [previousResult, setPreviousResult] = useState<SPPBResult | null>(null)

  useEffect(() => {
    if (resultId) {
      const found = history.find((r) => r.id === resultId)
      if (found) {
        setResult(found)
        // 이전 결과 찾기
        const currentIndex = history.findIndex((r) => r.id === resultId)
        if (currentIndex < history.length - 1) {
          setPreviousResult(history[currentIndex + 1])
        }
      }
    } else if (history.length > 0) {
      setResult(history[0])
      if (history.length > 1) {
        setPreviousResult(history[1])
      }
    }
  }, [resultId, history])

  if (!result) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <p className="text-text-secondary">
            {language === 'ko' ? '결과를 찾을 수 없습니다' : 'Result not found'}
          </p>
          <Link href="/gait-analysis" className="mt-4 text-primary hover:underline">
            {language === 'ko' ? 'SPPB 검사로 돌아가기' : 'Back to SPPB Assessment'}
          </Link>
        </div>
      </MainLayout>
    )
  }

  const getTotalScoreColor = (score: number) => {
    if (score >= 10) return 'text-emerald-500'
    if (score >= 7) return 'text-amber-500'
    if (score >= 4) return 'text-orange-500'
    return 'text-red-500'
  }

  const getTotalScoreLabel = (score: number) => {
    if (score >= 10) return language === 'ko' ? '양호' : 'Good'
    if (score >= 7) return language === 'ko' ? '보통' : 'Moderate'
    if (score >= 4) return language === 'ko' ? '낮음' : 'Low'
    return language === 'ko' ? '매우 낮음' : 'Very Low'
  }

  const getTotalScoreDescription = (score: number) => {
    if (score >= 10) {
      return language === 'ko'
        ? '신체 기능이 양호합니다. 현재 활동 수준을 유지하세요.'
        : 'Physical function is good. Maintain your current activity level.'
    }
    if (score >= 7) {
      return language === 'ko'
        ? '신체 기능이 보통입니다. 규칙적인 운동을 권장합니다.'
        : 'Physical function is moderate. Regular exercise is recommended.'
    }
    if (score >= 4) {
      return language === 'ko'
        ? '신체 기능이 저하되어 있습니다. 전문가 상담을 권장합니다.'
        : 'Physical function is declining. Professional consultation is recommended.'
    }
    return language === 'ko'
      ? '신체 기능이 매우 저하되어 있습니다. 전문가와 상담하세요.'
      : 'Physical function is very low. Please consult a professional.'
  }

  const getScoreChange = (current: number, previous: number | undefined) => {
    if (previous === undefined) return null
    const diff = current - previous
    if (diff > 0)
      return { value: `+${diff}`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-500' }
    if (diff < 0)
      return { value: `${diff}`, icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-500' }
    return { value: '0', icon: <Minus className="h-4 w-4" />, color: 'text-text-secondary' }
  }

  const scoreChange = previousResult
    ? getScoreChange(result.totalScore, previousResult.totalScore)
    : null

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-text-secondary hover:text-text-primary rounded-lg p-2 transition-colors hover:bg-surface"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-text-primary text-xl font-bold">
                {language === 'ko' ? 'SPPB 검사 결과' : 'SPPB Assessment Result'}
              </h1>
              <p className="text-text-secondary text-sm">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="text-text-secondary hover:text-text-primary rounded-lg p-2 transition-colors hover:bg-surface">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="text-text-secondary hover:text-text-primary rounded-lg p-2 transition-colors hover:bg-surface">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 총점 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border p-8 text-center"
        >
          <div className="text-text-secondary mb-2 text-sm font-medium">
            {language === 'ko' ? '총점' : 'Total Score'}
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className={cn('text-8xl font-bold', getTotalScoreColor(result.totalScore))}>
              {result.totalScore}
            </div>
            <div className="text-left">
              <div className="text-text-secondary text-2xl">/ 12</div>
              {scoreChange && (
                <div className={cn('mt-1 flex items-center gap-1 text-sm font-medium', scoreChange.color)}>
                  {scoreChange.icon}
                  <span>{scoreChange.value}</span>
                  <span className="text-text-secondary font-normal">
                    {language === 'ko' ? '이전 대비' : 'vs prev'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={cn('mt-3 text-xl font-semibold', getTotalScoreColor(result.totalScore))}>
            {getTotalScoreLabel(result.totalScore)}
          </div>
          <p className="text-text-secondary mx-auto mt-4 max-w-md text-sm">
            {getTotalScoreDescription(result.totalScore)}
          </p>
        </motion.div>

        {/* 개별 검사 결과 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* 균형 검사 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="text-text-primary font-bold">
                {language === 'ko' ? '균형 검사' : 'Balance Test'}
              </h3>
            </div>

            <div className="mb-4 text-center">
              <div
                className={cn(
                  'text-4xl font-bold',
                  result.balance.score >= 3
                    ? 'text-emerald-500'
                    : result.balance.score >= 2
                    ? 'text-amber-500'
                    : 'text-red-500'
                )}
              >
                {result.balance.score}
              </div>
              <div className="text-text-secondary text-sm">/ 4점</div>
            </div>

            <div className="space-y-2 text-sm">
              <StanceResult
                label={language === 'ko' ? '일반 자세' : 'Side-by-Side'}
                duration={result.balance.sideBySide.duration}
                completed={result.balance.sideBySide.completed}
                language={language}
              />
              <StanceResult
                label={language === 'ko' ? '반일렬 자세' : 'Semi-Tandem'}
                duration={result.balance.semiTandem.duration}
                completed={result.balance.semiTandem.completed}
                language={language}
              />
              <StanceResult
                label={language === 'ko' ? '일렬 자세' : 'Tandem'}
                duration={result.balance.tandem.duration}
                completed={result.balance.tandem.completed}
                language={language}
              />
            </div>
          </motion.div>

          {/* 보행 속도 검사 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Footprints className="h-5 w-5 text-primary" />
              <h3 className="text-text-primary font-bold">
                {language === 'ko' ? '보행 속도' : 'Gait Speed'}
              </h3>
            </div>

            <div className="mb-4 text-center">
              <div
                className={cn(
                  'text-4xl font-bold',
                  result.gaitSpeed.score >= 3
                    ? 'text-emerald-500'
                    : result.gaitSpeed.score >= 2
                    ? 'text-amber-500'
                    : 'text-red-500'
                )}
              >
                {result.gaitSpeed.score}
              </div>
              <div className="text-text-secondary text-sm">/ 4점</div>
            </div>

            <div className="rounded-xl bg-background p-4 text-center">
              <div className="text-text-secondary text-xs">
                {language === 'ko' ? '4m 보행 시간' : '4m Walk Time'}
              </div>
              <div className="text-text-primary mt-1 text-2xl font-bold">
                {result.gaitSpeed.time !== null
                  ? `${result.gaitSpeed.time.toFixed(2)}s`
                  : language === 'ko'
                  ? '수행 불가'
                  : 'Unable'}
              </div>
              {result.gaitSpeed.time !== null && (
                <div className="text-text-secondary mt-1 text-xs">
                  {language === 'ko' ? '보행 속도: ' : 'Speed: '}
                  {(4 / result.gaitSpeed.time).toFixed(2)} m/s
                </div>
              )}
            </div>
          </motion.div>

          {/* 의자 일어나기 검사 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              <h3 className="text-text-primary font-bold">
                {language === 'ko' ? '의자 일어나기' : 'Chair Stand'}
              </h3>
            </div>

            <div className="mb-4 text-center">
              <div
                className={cn(
                  'text-4xl font-bold',
                  result.chairStand.score >= 3
                    ? 'text-emerald-500'
                    : result.chairStand.score >= 2
                    ? 'text-amber-500'
                    : 'text-red-500'
                )}
              >
                {result.chairStand.score}
              </div>
              <div className="text-text-secondary text-sm">/ 4점</div>
            </div>

            <div className="rounded-xl bg-background p-4 text-center">
              <div className="text-text-secondary text-xs">
                {language === 'ko' ? '5회 반복 시간' : '5 Reps Time'}
              </div>
              <div className="text-text-primary mt-1 text-2xl font-bold">
                {result.chairStand.time !== null
                  ? `${result.chairStand.time.toFixed(2)}s`
                  : language === 'ko'
                  ? '수행 불가'
                  : 'Unable'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 점수 해석 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface rounded-2xl border border-border p-6"
        >
          <h3 className="text-text-primary mb-4 text-lg font-bold">
            {language === 'ko' ? '점수 해석' : 'Score Interpretation'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreRangeCard
              range="10-12"
              label={language === 'ko' ? '양호' : 'Good'}
              description={language === 'ko' ? '신체 기능 양호' : 'Good physical function'}
              color="emerald"
              isActive={result.totalScore >= 10}
            />
            <ScoreRangeCard
              range="7-9"
              label={language === 'ko' ? '보통' : 'Moderate'}
              description={language === 'ko' ? '경미한 기능 저하' : 'Mild functional decline'}
              color="amber"
              isActive={result.totalScore >= 7 && result.totalScore < 10}
            />
            <ScoreRangeCard
              range="4-6"
              label={language === 'ko' ? '낮음' : 'Low'}
              description={language === 'ko' ? '중등도 기능 저하' : 'Moderate functional decline'}
              color="orange"
              isActive={result.totalScore >= 4 && result.totalScore < 7}
            />
            <ScoreRangeCard
              range="0-3"
              label={language === 'ko' ? '매우 낮음' : 'Very Low'}
              description={language === 'ko' ? '심각한 기능 저하' : 'Severe functional decline'}
              color="red"
              isActive={result.totalScore < 4}
            />
          </div>
        </motion.div>

        {/* 권장사항 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface rounded-2xl border border-border p-6"
        >
          <h3 className="text-text-primary mb-4 text-lg font-bold">
            {language === 'ko' ? '권장사항' : 'Recommendations'}
          </h3>
          <div className="space-y-3">
            {result.balance.score < 3 && (
              <RecommendationItem
                icon={<Scale className="h-5 w-5" />}
                title={language === 'ko' ? '균형 운동 필요' : 'Balance Exercises Needed'}
                description={
                  language === 'ko'
                    ? '한 발 서기, 일렬 걷기 등의 균형 운동을 권장합니다.'
                    : 'Balance exercises like single-leg standing and tandem walking are recommended.'
                }
              />
            )}
            {result.gaitSpeed.score < 3 && (
              <RecommendationItem
                icon={<Footprints className="h-5 w-5" />}
                title={language === 'ko' ? '보행 훈련 필요' : 'Gait Training Needed'}
                description={
                  language === 'ko'
                    ? '규칙적인 걷기 운동과 보행 속도 향상 훈련을 권장합니다.'
                    : 'Regular walking exercise and gait speed improvement training are recommended.'
                }
              />
            )}
            {result.chairStand.score < 3 && (
              <RecommendationItem
                icon={<Armchair className="h-5 w-5" />}
                title={language === 'ko' ? '하체 근력 강화 필요' : 'Lower Body Strengthening Needed'}
                description={
                  language === 'ko'
                    ? '스쿼트, 의자 일어나기 반복 등 하체 근력 운동을 권장합니다.'
                    : 'Lower body strengthening exercises like squats and repeated sit-to-stand are recommended.'
                }
              />
            )}
            {result.totalScore >= 10 && (
              <RecommendationItem
                icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
                title={language === 'ko' ? '현재 상태 유지' : 'Maintain Current Status'}
                description={
                  language === 'ko'
                    ? '신체 기능이 양호합니다. 현재 활동 수준을 유지하세요.'
                    : 'Physical function is good. Maintain your current activity level.'
                }
              />
            )}
          </div>
        </motion.div>

        {/* 버튼 */}
        <div className="flex justify-center gap-4 pb-6">
          <Link href="/gait-analysis">
            <Button size="lg">
              {language === 'ko' ? '새로운 검사 시작' : 'Start New Assessment'}
            </Button>
          </Link>
          <Link href="/gait-analysis/history">
            <Button variant="outline" size="lg">
              {language === 'ko' ? '기록 보기' : 'View History'}
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}

function StanceResult({
  label,
  duration,
  completed,
  language,
}: {
  label: string
  duration: number
  completed: boolean
  language: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        {completed ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-text-primary">{label}</span>
      </div>
      <span className={cn('font-medium', completed ? 'text-emerald-500' : 'text-red-500')}>
        {duration.toFixed(1)}s
      </span>
    </div>
  )
}

function ScoreRangeCard({
  range,
  label,
  description,
  color,
  isActive,
}: {
  range: string
  label: string
  description: string
  color: 'emerald' | 'amber' | 'orange' | 'red'
  isActive: boolean
}) {
  const colorClasses = {
    emerald: isActive
      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500'
      : 'border-border',
    amber: isActive
      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500'
      : 'border-border',
    orange: isActive
      ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500'
      : 'border-border',
    red: isActive ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500' : 'border-border',
  }

  const textColorClasses = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
  }

  return (
    <div className={cn('rounded-xl border p-4 transition-all', colorClasses[color])}>
      <div className={cn('text-lg font-bold', isActive ? textColorClasses[color] : 'text-text-secondary')}>
        {range}
      </div>
      <div className={cn('font-medium', isActive ? 'text-text-primary' : 'text-text-secondary')}>
        {label}
      </div>
      <div className="text-text-secondary mt-1 text-xs">{description}</div>
    </div>
  )
}

function RecommendationItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-background p-4">
      <div className="text-primary">{icon}</div>
      <div>
        <div className="text-text-primary font-medium">{title}</div>
        <div className="text-text-secondary mt-1 text-sm">{description}</div>
      </div>
    </div>
  )
}
