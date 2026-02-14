'use client'

import { useMemo } from 'react'
import { Play, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAnatomyStore } from '@/stores/anatomy-store'
import { getAnatomyInfo } from '@/lib/anatomy/anatomy-data'
import { regionKeyToLabel } from '@/lib/anatomy/regions'
import { severityRank, SEV_LABELS, SEV_COLORS, DIFFICULTY_CLASS } from '@/types/anatomy'
import type { Severity, ExerciseInfo } from '@/types/anatomy'
import { cn } from '@/lib/utils'

interface RegionEntry {
  regionKey: string
  severity: Severity
  reason: string
}

interface ExerciseRecommendationPanelProps {
  regionMap: Map<string, RegionEntry>
}

interface GroupedExercise {
  exercise: ExerciseInfo
  regionKey: string
  regionName: string
  severity: Severity
}

export function ExerciseRecommendationPanel({ regionMap }: ExerciseRecommendationPanelProps) {
  const { openVideoModal } = useAnatomyStore()

  const grouped = useMemo(() => {
    // Filter out normal severity, sort by severity (severe first)
    const entries = Array.from(regionMap.values())
      .filter((e) => e.severity !== 'normal')
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))

    // Collect exercises grouped by region, deduplicate by exercise name
    const seenExercises = new Set<string>()
    const groups: { regionKey: string; regionName: string; severity: Severity; exercises: ExerciseInfo[] }[] = []

    for (const entry of entries) {
      const info = getAnatomyInfo(entry.regionKey)
      if (!info) continue

      const regionName = regionKeyToLabel(entry.regionKey)
      const uniqueExercises: ExerciseInfo[] = []

      for (const ex of info.exercises) {
        if (!seenExercises.has(ex.name)) {
          seenExercises.add(ex.name)
          uniqueExercises.push(ex)
        }
      }

      if (uniqueExercises.length > 0) {
        groups.push({
          regionKey: entry.regionKey,
          regionName,
          severity: entry.severity,
          exercises: uniqueExercises,
        })
      }
    }

    return groups
  }, [regionMap])

  if (grouped.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Dumbbell className="h-10 w-10 text-text-secondary/30 mb-3" />
          <p className="text-sm text-text-secondary">이상 소견이 없어 추천 운동이 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <Card key={group.regionKey}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="h-4 w-4 text-primary" />
                {group.regionName}
              </CardTitle>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: SEV_COLORS[group.severity] }}
              >
                {SEV_LABELS[group.severity]}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.exercises.map((ex) => {
                const diffClass = DIFFICULTY_CLASS[ex.difficulty] || 'medium'
                return (
                  <div
                    key={ex.name}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">{ex.name}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          diffClass === 'easy' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                          diffClass === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                          diffClass === 'hard' && 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        )}
                      >
                        {ex.difficulty}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openVideoModal(ex.name, ex.videoId, ex.difficulty)}
                    >
                      <Play className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
