'use client'

import { useMemo } from 'react'
import {
  MapPin,
  Activity,
  Bone,
  AlertTriangle,
  Dumbbell,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAnatomyStore } from '@/stores/anatomy-store'
import { getAnatomyInfo } from '@/lib/anatomy/anatomy-data'
import { regionKeyToLabel } from '@/lib/anatomy/regions'
import { DIFFICULTY_CLASS } from '@/types/anatomy'
import type { AnatomyInfo, ExerciseInfo } from '@/types/anatomy'
import { cn } from '@/lib/utils'

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cls = DIFFICULTY_CLASS[difficulty] || 'medium'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        cls === 'easy' && 'bg-green-100 text-green-700',
        cls === 'medium' && 'bg-yellow-100 text-yellow-700',
        cls === 'hard' && 'bg-red-100 text-red-700'
      )}
    >
      {difficulty}
    </span>
  )
}

function TagList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            'inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium',
            color
          )}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

export function AnatomyInfoPanel({ className }: { className?: string }) {
  const selectedRegionKey = useAnatomyStore((s) => s.selectedRegionKey)
  const openVideoModal = useAnatomyStore((s) => s.openVideoModal)

  const info: AnatomyInfo | null = useMemo(() => {
    if (!selectedRegionKey) return null
    return getAnatomyInfo(selectedRegionKey)
  }, [selectedRegionKey])

  const handleExerciseClick = (exercise: ExerciseInfo) => {
    openVideoModal(exercise.name, exercise.videoId, exercise.difficulty)
  }

  if (!selectedRegionKey || !info) {
    return (
      <Card className={cn('flex flex-col', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Anatomy Info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-10 w-10 text-text-secondary/30" />
            <p className="mt-3 text-sm text-text-secondary">
              3D 모델에서 부위를 클릭하면
              <br />
              해부학 정보가 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{info.name}</CardTitle>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {regionKeyToLabel(selectedRegionKey)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          {info.description}
        </p>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">
        {/* Key Muscles */}
        <InfoSection
          icon={<Activity className="h-3.5 w-3.5 text-red-400" />}
          title="Key Muscles"
        >
          <TagList items={info.keyMuscles} color="bg-red-50 text-red-700" />
        </InfoSection>

        {/* Key Structures */}
        <InfoSection
          icon={<Bone className="h-3.5 w-3.5 text-blue-400" />}
          title="Key Structures"
        >
          <TagList items={info.keyStructures} color="bg-blue-50 text-blue-700" />
        </InfoSection>

        {/* Common Pathologies */}
        <InfoSection
          icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
          title="Common Pathologies"
        >
          <ul className="space-y-1">
            {info.commonPathologies.map((pathology) => (
              <li
                key={pathology}
                className="flex items-start gap-1.5 text-xs text-text-secondary"
              >
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />
                {pathology}
              </li>
            ))}
          </ul>
        </InfoSection>

        {/* Exercises */}
        <InfoSection
          icon={<Dumbbell className="h-3.5 w-3.5 text-green-400" />}
          title="Exercises"
        >
          <div className="space-y-1">
            {info.exercises.map((exercise) => (
              <button
                key={exercise.name}
                onClick={() => handleExerciseClick(exercise)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-primary">{exercise.name}</span>
                  <DifficultyBadge difficulty={exercise.difficulty} />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
              </button>
            ))}
          </div>
        </InfoSection>
      </CardContent>
    </Card>
  )
}
