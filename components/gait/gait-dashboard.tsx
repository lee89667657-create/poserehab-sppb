'use client'

import { motion } from 'framer-motion'
import type { GaitMeasurements, MeasurementValue } from '@/types/gait'
import { GAIT_MEASUREMENT_LABELS } from '@/lib/gait-constants'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'

interface GaitDashboardProps {
  measurements: GaitMeasurements | null
  showAll?: boolean
}

// 종합 점수 계산 함수
function calculateOverallScore(measurements: GaitMeasurements): {
  total: number
  speedScore: number
  symmetryScore: number
  kneeScore: number
} {
  let speedScore = 0
  let symmetryScore = 0
  let kneeScore = 0

  // 보행 속도 점수 (40점 만점)
  if (measurements.gaitSpeed) {
    const speed = measurements.gaitSpeed.value
    if (speed >= 1.0) {
      speedScore = 40
    } else if (speed >= 0.8) {
      speedScore = 30
    } else {
      speedScore = 15
    }
  }

  // 대칭성 점수 (30점 만점)
  if (measurements.leftRightSymmetry) {
    const symmetry = measurements.leftRightSymmetry.value * 100
    if (symmetry >= 95 && symmetry <= 105) {
      symmetryScore = 30
    } else if (symmetry >= 85 && symmetry <= 115) {
      symmetryScore = 20
    } else {
      symmetryScore = 10
    }
  }

  // 무릎 굴곡 점수 (30점 만점)
  if (measurements.kneeFlexionLeft && measurements.kneeFlexionRight) {
    const leftValue = measurements.kneeFlexionLeft.value
    const rightValue = measurements.kneeFlexionRight.value
    const diff = Math.abs(leftValue - rightValue)
    const avgValue = (leftValue + rightValue) / 2

    const isSevereAsymmetry = diff >= 20
    const isMildAsymmetry = diff >= 10
    const isNormalFlexion = avgValue >= 50 && avgValue <= 70
    const isSevereLimited = avgValue < 30

    if (isSevereAsymmetry || isSevereLimited) {
      kneeScore = 10
    } else if (isMildAsymmetry || avgValue < 50) {
      kneeScore = 20
    } else if (isNormalFlexion) {
      kneeScore = 30
    } else {
      kneeScore = 20
    }
  }

  return {
    total: speedScore + symmetryScore + kneeScore,
    speedScore,
    symmetryScore,
    kneeScore,
  }
}

// 상태별 색상
const STATUS_COLORS = {
  normal: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
  },
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/30',
  },
}

// 주요 측정 항목 (기본 표시) - 별도 카드로 표시되는 항목들 제외
// leftRightSymmetry는 아래 SymmetryChart에서 표시하므로 제외
const PRIMARY_METRICS = [] as const

// 모든 측정 항목
const ALL_METRICS = [
  'strideLength',
  'gaitSpeed',
  'gaitCycle',
  'leftRightSymmetry',
  'kneeFlexionLeft',
  'kneeFlexionRight',
  'hipFlexionLeft',
  'hipFlexionRight',
  'trunkInclination',
  'footClearance',
] as const

function MetricCard({
  label,
  labelKo,
  value,
  unit,
  status,
  index,
}: {
  label: string
  labelKo: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'danger'
  index: number
}) {
  const { language } = useTranslation()
  const colors = STATUS_COLORS[status]
  const displayLabel = language === 'ko' ? labelKo : label

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-xl border p-4',
        colors.bg,
        colors.border,
        'transition-colors duration-300'
      )}
    >
      <div className="text-text-secondary mb-1 text-xs font-medium">
        {displayLabel}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>
          {value.toFixed(unit === '°' || unit === '' ? 1 : 2)}
        </span>
        {unit && (
          <span className="text-text-secondary text-sm">{unit}</span>
        )}
      </div>
    </motion.div>
  )
}

// 종합 점수 카드
function OverallScoreCard({
  measurements,
}: {
  measurements: GaitMeasurements
}) {
  const { language } = useTranslation()
  const scores = calculateOverallScore(measurements)

  const isGood = scores.total >= 80
  const isWarning = scores.total >= 60 && scores.total < 80

  const colors = isGood
    ? STATUS_COLORS.normal
    : isWarning
    ? STATUS_COLORS.warning
    : STATUS_COLORS.danger

  const interpretation = isGood
    ? { ko: '✅ 양호', en: '✅ Good' }
    : isWarning
    ? { ko: '⚠️ 주의 필요', en: '⚠️ Needs attention' }
    : { ko: '❌ 재활 훈련 권장', en: '❌ Rehab recommended' }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'col-span-2 rounded-2xl border-2 p-5',
        colors.bg,
        colors.border,
        'transition-colors duration-300'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-text-secondary text-sm font-medium">
            {language === 'ko' ? '종합 점수' : 'Overall Score'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn('text-5xl font-bold tabular-nums', colors.text)}>
              {scores.total}
            </span>
            <span className="text-text-secondary text-lg">/ 100</span>
          </div>
          <p className={cn('mt-2 text-sm font-medium', colors.text)}>
            {language === 'ko' ? interpretation.ko : interpretation.en}
          </p>
        </div>

        {/* 세부 점수 */}
        <div className="text-right space-y-1">
          <div className="text-xs">
            <span className="text-text-secondary">
              {language === 'ko' ? '속도' : 'Speed'}:
            </span>
            <span className={cn('ml-1 font-medium', colors.text)}>
              {scores.speedScore}/40
            </span>
          </div>
          <div className="text-xs">
            <span className="text-text-secondary">
              {language === 'ko' ? '대칭' : 'Symmetry'}:
            </span>
            <span className={cn('ml-1 font-medium', colors.text)}>
              {scores.symmetryScore}/30
            </span>
          </div>
          <div className="text-xs">
            <span className="text-text-secondary">
              {language === 'ko' ? '무릎' : 'Knee'}:
            </span>
            <span className={cn('ml-1 font-medium', colors.text)}>
              {scores.kneeScore}/30
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 보행 속도 카드 (임상 해석 포함)
function GaitSpeedCard({
  value,
  index,
}: {
  value: number
  index: number
}) {
  const { language } = useTranslation()

  // 임상 기준에 따른 상태 판정
  const isNormal = value >= 1.0
  const isWarning = value >= 0.8 && value < 1.0

  const colors = isNormal
    ? STATUS_COLORS.normal
    : isWarning
    ? STATUS_COLORS.warning
    : STATUS_COLORS.danger

  const interpretation = isNormal
    ? {
        ko: '✅ 정상 - 지역사회 보행 가능',
        en: '✅ Normal - Community ambulation',
      }
    : isWarning
    ? {
        ko: '⚠️ 경계 - 제한적 지역사회 보행',
        en: '⚠️ Borderline - Limited community ambulation',
      }
    : {
        ko: '❌ 느림 - 실내 보행 수준, 보행 훈련 필요',
        en: '❌ Slow - Household ambulation, gait training needed',
      }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-xl border p-4',
        colors.bg,
        colors.border,
        'transition-colors duration-300'
      )}
    >
      <div className="text-text-secondary mb-1 text-xs font-medium">
        {language === 'ko' ? '보행 속도' : 'Gait Speed'}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>
          {value.toFixed(2)}
        </span>
        <span className="text-text-secondary text-sm">m/s</span>
      </div>
      <p className={cn('mt-2 text-xs leading-tight', colors.text)}>
        {language === 'ko' ? interpretation.ko : interpretation.en}
      </p>
    </motion.div>
  )
}

// 보폭 카드 (임상 해석 포함)
function StrideLengthCard({
  value,
  index,
}: {
  value: number // cm 단위
  index: number
}) {
  const { language } = useTranslation()

  // 임상 기준에 따른 상태 판정
  const isNormal = value >= 60
  const isWarning = value >= 40 && value < 60

  const colors = isNormal
    ? STATUS_COLORS.normal
    : isWarning
    ? STATUS_COLORS.warning
    : STATUS_COLORS.danger

  const interpretation = isNormal
    ? {
        ko: '✅ 정상',
        en: '✅ Normal',
      }
    : isWarning
    ? {
        ko: '⚠️ 보폭 감소 - 낙상 위험 주의',
        en: '⚠️ Reduced stride - Fall risk warning',
      }
    : {
        ko: '❌ 보폭 심하게 감소',
        en: '❌ Severely reduced stride',
      }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-xl border p-4',
        colors.bg,
        colors.border,
        'transition-colors duration-300'
      )}
    >
      <div className="text-text-secondary mb-1 text-xs font-medium">
        {language === 'ko' ? '보폭' : 'Stride Length'}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>
          {value.toFixed(1)}
        </span>
        <span className="text-text-secondary text-sm">cm</span>
      </div>
      <p className={cn('mt-2 text-xs leading-tight', colors.text)}>
        {language === 'ko' ? interpretation.ko : interpretation.en}
      </p>
    </motion.div>
  )
}

// 무릎 굴곡 카드 (좌우 비교 + 임상 해석)
function KneeFlexionCard({
  leftValue,
  rightValue,
  index,
}: {
  leftValue: number
  rightValue: number
  index: number
}) {
  const { language } = useTranslation()

  // 좌우 차이 계산
  const diff = Math.abs(leftValue - rightValue)
  const avgValue = (leftValue + rightValue) / 2

  // 좌우 비대칭 판정
  const isSevereAsymmetry = diff >= 20
  const isMildAsymmetry = diff >= 10 && diff < 20

  // 굴곡 범위 판정
  const isNormalFlexion = avgValue >= 50 && avgValue <= 70
  const isLimitedFlexion = avgValue >= 30 && avgValue < 50
  const isSevereLimited = avgValue < 30

  // 색상 결정 (비대칭이 더 심각한 경우 우선)
  let colors = STATUS_COLORS.normal
  if (isSevereAsymmetry || isSevereLimited) {
    colors = STATUS_COLORS.danger
  } else if (isMildAsymmetry || isLimitedFlexion) {
    colors = STATUS_COLORS.warning
  }

  // 해석 메시지 생성
  const getInterpretation = () => {
    const messages: { ko: string; en: string }[] = []

    // 좌우 비대칭 해석
    if (isSevereAsymmetry) {
      messages.push({
        ko: '❌ 심한 비대칭 - 재활 필요',
        en: '❌ Severe asymmetry - Rehab needed',
      })
    } else if (isMildAsymmetry) {
      messages.push({
        ko: '⚠️ 좌우 비대칭 - 약한 쪽 근력 강화 필요',
        en: '⚠️ Asymmetry - Strengthen weaker side',
      })
    }

    // 굴곡 범위 해석
    if (isSevereLimited) {
      messages.push({
        ko: '❌ 심한 굴곡 제한',
        en: '❌ Severe flexion limitation',
      })
    } else if (isLimitedFlexion) {
      messages.push({
        ko: '⚠️ 굴곡 제한',
        en: '⚠️ Limited flexion',
      })
    } else if (isNormalFlexion && !isMildAsymmetry && !isSevereAsymmetry) {
      messages.push({
        ko: '✅ 정상',
        en: '✅ Normal',
      })
    }

    return messages
  }

  const interpretations = getInterpretation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'col-span-2 rounded-xl border p-4',
        colors.bg,
        colors.border,
        'transition-colors duration-300'
      )}
    >
      <div className="text-text-secondary mb-2 text-xs font-medium">
        {language === 'ko' ? '무릎 굴곡' : 'Knee Flexion'}
      </div>
      <div className="flex items-center justify-around">
        <div className="text-center">
          <div className="text-text-secondary text-xs">
            {language === 'ko' ? '왼쪽' : 'Left'}
          </div>
          <div className={cn('text-2xl font-bold tabular-nums', colors.text)}>
            {leftValue.toFixed(0)}°
          </div>
        </div>
        <div className="text-text-secondary text-sm">
          {language === 'ko' ? '차이' : 'Diff'}: {diff.toFixed(0)}°
        </div>
        <div className="text-center">
          <div className="text-text-secondary text-xs">
            {language === 'ko' ? '오른쪽' : 'Right'}
          </div>
          <div className={cn('text-2xl font-bold tabular-nums', colors.text)}>
            {rightValue.toFixed(0)}°
          </div>
        </div>
      </div>
      {interpretations.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {interpretations.map((msg, i) => (
            <p key={i} className={cn('text-xs leading-tight', colors.text)}>
              {language === 'ko' ? msg.ko : msg.en}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function GaitDashboard({ measurements, showAll = false }: GaitDashboardProps) {
  const { t, language } = useTranslation()

  // showAll일 때는 별도 카드로 표시되는 항목들 제외
  // leftRightSymmetry는 SymmetryChart에서 표시하므로 제외
  const metrics = showAll
    ? ALL_METRICS.filter((m) =>
        m !== 'gaitSpeed' &&
        m !== 'strideLength' &&
        m !== 'kneeFlexionLeft' &&
        m !== 'kneeFlexionRight' &&
        m !== 'leftRightSymmetry'
      )
    : PRIMARY_METRICS

  if (!measurements) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {/* 종합 점수 플레이스홀더 */}
        <div className="bg-surface/50 col-span-2 animate-pulse rounded-2xl border-2 border-border/50 p-5">
          <div className="text-text-secondary text-sm font-medium">
            {language === 'ko' ? '종합 점수' : 'Overall Score'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-text-secondary text-5xl font-bold">--</span>
            <span className="text-text-secondary text-lg">/ 100</span>
          </div>
        </div>
        {/* 보행 속도 플레이스홀더 */}
        <div className="bg-surface/50 animate-pulse rounded-xl border border-border/50 p-4">
          <div className="text-text-secondary mb-1 text-xs font-medium">
            {language === 'ko' ? '보행 속도' : 'Gait Speed'}
          </div>
          <div className="text-text-secondary text-2xl font-bold">-- m/s</div>
        </div>
        {/* 보폭 플레이스홀더 */}
        <div className="bg-surface/50 animate-pulse rounded-xl border border-border/50 p-4">
          <div className="text-text-secondary mb-1 text-xs font-medium">
            {language === 'ko' ? '보폭' : 'Stride Length'}
          </div>
          <div className="text-text-secondary text-2xl font-bold">-- cm</div>
        </div>
        {/* 무릎 굴곡 플레이스홀더 */}
        <div className="bg-surface/50 col-span-2 animate-pulse rounded-xl border border-border/50 p-4">
          <div className="text-text-secondary mb-1 text-xs font-medium">
            {language === 'ko' ? '무릎 굴곡' : 'Knee Flexion'}
          </div>
          <div className="flex justify-around">
            <div className="text-text-secondary text-2xl font-bold">--°</div>
            <div className="text-text-secondary text-2xl font-bold">--°</div>
          </div>
        </div>
        {metrics.map((key, index) => {
          const config = GAIT_MEASUREMENT_LABELS[key]
          return (
            <div
              key={key}
              className="bg-surface/50 animate-pulse rounded-xl border border-border/50 p-4"
            >
              <div className="text-text-secondary mb-1 text-xs font-medium">
                {language === 'ko' ? config.ko : config.en}
              </div>
              <div className="text-text-secondary text-2xl font-bold">--</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 종합 점수 카드 (최상단) */}
      <OverallScoreCard measurements={measurements} />

      {/* 보행 속도 카드 (임상 해석 포함) */}
      {measurements.gaitSpeed ? (
        <GaitSpeedCard value={measurements.gaitSpeed.value} index={0} />
      ) : (
        <div className="bg-surface/50 rounded-xl border border-border/50 p-4">
          <div className="text-text-secondary mb-1 text-xs font-medium">
            {language === 'ko' ? '보행 속도' : 'Gait Speed'}
          </div>
          <div className="text-text-secondary text-2xl font-bold">-- m/s</div>
        </div>
      )}

      {/* 보폭 카드 (임상 해석 포함) */}
      {measurements.strideLength ? (
        <StrideLengthCard value={measurements.strideLength.value} index={1} />
      ) : (
        <div className="bg-surface/50 rounded-xl border border-border/50 p-4">
          <div className="text-text-secondary mb-1 text-xs font-medium">
            {language === 'ko' ? '보폭' : 'Stride Length'}
          </div>
          <div className="text-text-secondary text-2xl font-bold">-- cm</div>
        </div>
      )}

      {/* 무릎 굴곡 카드 (좌우 비교 + 임상 해석) */}
      {measurements.kneeFlexionLeft && measurements.kneeFlexionRight ? (
        <KneeFlexionCard
          leftValue={measurements.kneeFlexionLeft.value}
          rightValue={measurements.kneeFlexionRight.value}
          index={2}
        />
      ) : (
        <div className="bg-surface/50 col-span-2 rounded-xl border border-border/50 p-4">
          <div className="text-text-secondary mb-1 text-xs font-medium">
            {language === 'ko' ? '무릎 굴곡' : 'Knee Flexion'}
          </div>
          <div className="flex justify-around">
            <div className="text-text-secondary text-2xl font-bold">--°</div>
            <div className="text-text-secondary text-2xl font-bold">--°</div>
          </div>
        </div>
      )}

      {/* 나머지 측정 항목 */}
      {metrics.map((key, index) => {
        const measurement = measurements[key as keyof GaitMeasurements]
        const config = GAIT_MEASUREMENT_LABELS[key]

        if (!measurement) {
          return (
            <div
              key={key}
              className="bg-surface/50 rounded-xl border border-border/50 p-4"
            >
              <div className="text-text-secondary mb-1 text-xs font-medium">
                {language === 'ko' ? config.ko : config.en}
              </div>
              <div className="text-text-secondary text-2xl font-bold">--</div>
            </div>
          )
        }

        return (
          <MetricCard
            key={key}
            label={config.en}
            labelKo={config.ko}
            value={measurement.value}
            unit={measurement.unit}
            status={measurement.status}
            index={index + 1}
          />
        )
      })}
    </div>
  )
}

// 대형 측정값 표시 (결과 화면용)
export function LargeMeasurementDisplay({
  measurement,
  label,
  labelKo,
}: {
  measurement: MeasurementValue
  label: string
  labelKo: string
}) {
  const { language } = useTranslation()
  const colors = STATUS_COLORS[measurement.status]
  const displayLabel = language === 'ko' ? labelKo : label

  return (
    <div className={cn('rounded-2xl border-2 p-6 text-center', colors.border, colors.bg)}>
      <div className="text-text-secondary mb-2 text-sm font-medium">
        {displayLabel}
      </div>
      <div className="flex items-baseline justify-center gap-2">
        <span className={cn('text-5xl font-bold tabular-nums', colors.text)}>
          {measurement.value.toFixed(measurement.unit === '°' ? 0 : 1)}
        </span>
        {measurement.unit && (
          <span className="text-text-secondary text-xl">{measurement.unit}</span>
        )}
      </div>
      <div className="text-text-secondary mt-2 text-xs">
        {language === 'ko' ? '정상 범위' : 'Normal Range'}: {measurement.idealMin} -{' '}
        {measurement.idealMax}
        {measurement.unit}
      </div>
    </div>
  )
}
