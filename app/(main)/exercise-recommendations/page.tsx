'use client'

import { useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Dumbbell, Play, ExternalLink } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { usePostureStore } from '@/stores/posture-store'
import { EXERCISES } from '@/lib/constants'
import type { Exercise } from '@/types/exercise'
import type { MuscleInfo } from '@/types/analysis-result'
import { cn } from '@/lib/utils'
import { targetMuscleToRegionKey } from '@/lib/anatomy/muscle-region-map'

// 근육 ID → EXERCISES의 targetMuscles 매핑
const MUSCLE_ID_TO_TARGET: Record<string, string[]> = {
  // Front (contracted → stretching needed)
  neck_flexors: ['deep neck flexors', 'longus colli'],
  pectoralis: ['pectoralis major', 'pectoralis minor', 'anterior deltoid'],
  serratus_anterior: ['serratus anterior'],
  external_oblique: ['obliques', 'rectus abdominis'],
  internal_oblique: ['obliques', 'rectus abdominis'],
  transverse_abdominis: ['transverse abdominis', 'rectus abdominis'],
  rectus_abdominis: ['rectus abdominis', 'obliques'],
  iliopsoas: ['hip flexors'],
  hip_flexors: ['hip flexors'],
  tensor_fasciae: ['tensor fasciae latae', 'iliotibial band'],
  rectus_femoris: ['quadriceps', 'rectus femoris'],
  adductors: ['adductors'],
  tibialis_anterior: ['tibialis anterior'],
  // Rear (stretched → strengthening needed)
  neck_extensors: ['upper trapezius', 'levator scapulae'],
  upper_trapezius: ['upper trapezius', 'levator scapulae'],
  levator_scapulae: ['levator scapulae', 'upper trapezius'],
  middle_trapezius: ['rhomboids', 'lower trapezius'],
  lower_trapezius: ['lower trapezius', 'rhomboids'],
  rhomboids: ['rhomboids', 'lower trapezius', 'serratus anterior'],
  infraspinatus: ['infraspinatus', 'rear deltoids'],
  latissimus_dorsi: ['lats', 'latissimus dorsi'],
  thoracic_erector: ['erector spinae'],
  lumbar_muscles: ['erector spinae', 'lumbar muscles'],
  lumbar_erector: ['erector spinae'],
  gluteus_maximus: ['glutes', 'gluteus maximus'],
  gluteus_medius: ['gluteus medius', 'gluteus minimus', 'external rotators'],
  hamstrings: ['hamstrings', 'calves'],
  gastrocnemius: ['calves', 'gastrocnemius'],
}

function findMatchingExercises(
  muscles: MuscleInfo[],
  type: 'stretching' | 'strengthening'
): { exercise: Exercise; matchedMuscles: string[] }[] {
  const results: { exercise: Exercise; matchedMuscles: string[] }[] = []
  const seenIds = new Set<string>()

  for (const muscle of muscles) {
    const targetNames = MUSCLE_ID_TO_TARGET[muscle.id] || []
    if (targetNames.length === 0) continue

    for (const ex of EXERCISES) {
      if (seenIds.has(ex.id)) continue

      // contracted → stretching exercises, stretched → strengthening exercises
      const categoryMatch =
        type === 'stretching'
          ? ex.category === 'stretching' || ex.category === 'correction'
          : ex.category === 'strength' || ex.category === 'correction' || ex.category === 'core'

      const muscleMatch = ex.targetMuscles.some((tm) =>
        targetNames.some((tn) => tm.toLowerCase().includes(tn.toLowerCase()) || tn.toLowerCase().includes(tm.toLowerCase()))
      )

      if (muscleMatch && categoryMatch) {
        seenIds.add(ex.id)
        const matched = ex.targetMuscles.filter((tm) =>
          targetNames.some((tn) => tm.toLowerCase().includes(tn.toLowerCase()) || tn.toLowerCase().includes(tm.toLowerCase()))
        )
        results.push({ exercise: ex, matchedMuscles: matched })
      }
    }
  }

  return results
}

function ExerciseRecommendationsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useTranslation()
  const { detailedResult } = usePostureStore()

  const source = searchParams.get('source')
  const hasPostureData = source === 'posture' && detailedResult?.muscleAnalysis

  const { stretchingExercises, strengtheningExercises } = useMemo(() => {
    if (!hasPostureData) {
      return { stretchingExercises: [], strengtheningExercises: [] }
    }

    const contracted = detailedResult!.muscleAnalysis.contracted
    const stretched = detailedResult!.muscleAnalysis.stretched

    return {
      // 수축근육 → 스트레칭 필요
      stretchingExercises: findMatchingExercises(contracted, 'stretching'),
      // 늘어난근육 → 강화 필요
      strengtheningExercises: findMatchingExercises(stretched, 'strengthening'),
    }
  }, [hasPostureData, detailedResult])

  const handleStartExercise = (exerciseId: string) => {
    router.push(`/exercise/guided?id=${exerciseId}`)
  }

  const handleViewAnatomy = (regionKey: string) => {
    router.push(`/anatomy?highlight=${regionKey}`)
  }

  if (!hasPostureData) {
    return (
      <MainLayout title={language === 'ko' ? '맞춤 운동 추천' : 'Personalized Exercise Recommendations'}>
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Dumbbell className="h-12 w-12 text-text-secondary/30 mb-4" />
              <p className="text-lg font-medium text-text-primary mb-2">
                {language === 'ko' ? '자세 분석 데이터가 필요합니다' : 'Posture analysis data required'}
              </p>
              <p className="text-sm text-text-secondary mb-6 text-center">
                {language === 'ko'
                  ? '자세 분석을 먼저 수행한 후, 근육 불균형 결과에서 "맞춤 운동 보기"를 클릭해주세요.'
                  : 'Please perform posture analysis first, then click "View Personalized Exercises" from muscle imbalance results.'}
              </p>
              <Button onClick={() => router.push('/posture-analysis')} variant="outline">
                {language === 'ko' ? '자세 분석 하러 가기' : 'Go to Posture Analysis'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const contracted = detailedResult!.muscleAnalysis.contracted
  const stretched = detailedResult!.muscleAnalysis.stretched

  return (
    <MainLayout title={language === 'ko' ? '맞춤 운동 추천' : 'Personalized Exercise Recommendations'}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/posture-analysis/result/muscle')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === 'ko' ? '근육 분석으로 돌아가기' : 'Back to Muscle Analysis'}
        </Button>

        {/* Summary */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-error">{contracted.length}</div>
                <div className="text-xs text-text-secondary">
                  {language === 'ko' ? '수축 근육' : 'Contracted'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stretched.length}</div>
                <div className="text-xs text-text-secondary">
                  {language === 'ko' ? '늘어난 근육' : 'Stretched'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{stretchingExercises.length}</div>
                <div className="text-xs text-text-secondary">
                  {language === 'ko' ? '스트레칭 추천' : 'Stretching'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{strengtheningExercises.length}</div>
                <div className="text-xs text-text-secondary">
                  {language === 'ko' ? '강화 운동 추천' : 'Strengthening'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stretching Exercises (for contracted muscles) */}
        {stretchingExercises.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-error/10">
                <span className="h-2.5 w-2.5 rounded-full bg-error" />
              </span>
              {language === 'ko'
                ? '스트레칭 운동 (수축 근육 이완)'
                : 'Stretching Exercises (Release Contracted Muscles)'}
            </h2>
            <div className="space-y-3">
              {stretchingExercises.map(({ exercise, matchedMuscles }) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  matchedMuscles={matchedMuscles}
                  language={language}
                  type="stretching"
                  onStart={() => handleStartExercise(exercise.id)}
                  onViewAnatomy={handleViewAnatomy}
                />
              ))}
            </div>
          </div>
        )}

        {/* Strengthening Exercises (for stretched muscles) */}
        {strengtheningExercises.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              {language === 'ko'
                ? '강화 운동 (늘어난 근육 강화)'
                : 'Strengthening Exercises (Strengthen Stretched Muscles)'}
            </h2>
            <div className="space-y-3">
              {strengtheningExercises.map(({ exercise, matchedMuscles }) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  matchedMuscles={matchedMuscles}
                  language={language}
                  type="strengthening"
                  onStart={() => handleStartExercise(exercise.id)}
                  onViewAnatomy={handleViewAnatomy}
                />
              ))}
            </div>
          </div>
        )}

        {stretchingExercises.length === 0 && strengtheningExercises.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-10 w-10 text-text-secondary/30 mb-3" />
              <p className="text-sm text-text-secondary">
                {language === 'ko'
                  ? '매칭되는 운동이 없습니다. 운동 목록에서 직접 선택해주세요.'
                  : 'No matching exercises found. Please select from the exercise list.'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/exercise/list')}
              >
                {language === 'ko' ? '운동 목록 보기' : 'View Exercise List'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

function ExerciseCard({
  exercise,
  matchedMuscles,
  language,
  type,
  onStart,
  onViewAnatomy,
}: {
  exercise: Exercise
  matchedMuscles: string[]
  language: 'ko' | 'en'
  type: 'stretching' | 'strengthening'
  onStart: () => void
  onViewAnatomy: (regionKey: string) => void
}) {
  const difficultyColor = {
    beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  }

  const difficultyLabel = {
    beginner: language === 'ko' ? '초급' : 'Beginner',
    intermediate: language === 'ko' ? '중급' : 'Intermediate',
    advanced: language === 'ko' ? '고급' : 'Advanced',
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 py-4">
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          type === 'stretching' ? 'bg-error/10' : 'bg-primary/10'
        )}>
          <Dumbbell className={cn('h-5 w-5', type === 'stretching' ? 'text-error' : 'text-primary')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text-primary truncate">
              {language === 'ko' ? exercise.nameKo : exercise.name}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0', difficultyColor[exercise.difficulty])}>
              {difficultyLabel[exercise.difficulty]}
            </span>
          </div>
          <p className="text-xs text-text-secondary truncate mb-1.5">
            {language === 'ko' ? exercise.descriptionKo : exercise.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {matchedMuscles.map((m) => {
              const regionKey = targetMuscleToRegionKey(m)
              return regionKey ? (
                <button
                  key={m}
                  onClick={() => onViewAnatomy(regionKey)}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity cursor-pointer',
                    type === 'stretching'
                      ? 'bg-error/10 text-error'
                      : 'bg-primary/10 text-primary'
                  )}
                  title={language === 'ko' ? '3D 해부학 뷰어에서 보기' : 'View in 3D Anatomy Viewer'}
                >
                  {m}
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              ) : (
                <span
                  key={m}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px]',
                    type === 'stretching'
                      ? 'bg-error/10 text-error'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {m}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-text-secondary">
            {exercise.defaultReps}rep × {exercise.defaultSets}set
          </span>
          <Button size="sm" onClick={onStart} className="gap-1.5">
            <Play className="h-3.5 w-3.5" />
            {language === 'ko' ? '운동 시작' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExerciseRecommendationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <ExerciseRecommendationsContent />
    </Suspense>
  )
}
