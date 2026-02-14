'use client'

import { X, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSoapStore } from '@/stores/soap-store'
import { getAutoFillSuggestions } from '@/lib/anatomy/voice-keywords'
import { cn } from '@/lib/utils'

interface VoiceTagsProps {
  tags: Map<string, string[]>
  onRemoveTag: (keyword: string) => void
  className?: string
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '통증 양상': {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-500/30',
  },
  '부위': {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/30',
  },
  '시기·빈도': {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  '악화·완화': {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
  '정도': {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-500/30',
  },
}

const DEFAULT_COLORS = {
  bg: 'bg-gray-50 dark:bg-gray-500/10',
  text: 'text-gray-700 dark:text-gray-400',
  border: 'border-gray-200 dark:border-gray-500/30',
}

export function VoiceTags({ tags, onRemoveTag, className }: VoiceTagsProps) {
  const { updateSubjective } = useSoapStore()

  const handleAutoFill = () => {
    const suggestions = getAutoFillSuggestions(tags)

    // Build partial update for SOAP subjective
    const partial: Record<string, string> = {}

    if (suggestions.chiefComplaint) {
      partial.chiefComplaint = suggestions.chiefComplaint
    }
    if (suggestions.symptomDescription) {
      partial.symptomDescription = suggestions.symptomDescription
    }
    if (suggestions.painLocation) {
      partial.painLocation = suggestions.painLocation
    }
    if (suggestions.onset) {
      partial.onset = suggestions.onset
    }
    if (suggestions.aggravating) {
      partial.aggravating = suggestions.aggravating
    }

    // Also store voice tags in SOAP
    const voiceTags: Record<string, string[]> = {}
    tags.forEach((keywords, category) => {
      voiceTags[category] = keywords
    })
    partial.voiceTags = JSON.stringify(voiceTags)

    updateSubjective(partial as Parameters<typeof updateSubjective>[0])
  }

  if (tags.size === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Category groups */}
      {Array.from(tags.entries()).map(([category, keywords]) => {
        const colors = CATEGORY_COLORS[category] || DEFAULT_COLORS

        return (
          <div key={category}>
            {/* Category label */}
            <p className={cn('mb-1.5 text-xs font-semibold', colors.text)}>
              {category}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(keyword)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )
      })}

      {/* Auto-fill button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAutoFill}
        className="mt-2 gap-2"
      >
        <Wand2 className="h-3.5 w-3.5" />
        자동채우기
      </Button>
    </div>
  )
}
