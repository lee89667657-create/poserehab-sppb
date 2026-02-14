'use client'

import { ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useAnatomyStore } from '@/stores/anatomy-store'
import { DIFFICULTY_CLASS } from '@/types/anatomy'
import { cn } from '@/lib/utils'

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cls = DIFFICULTY_CLASS[difficulty] || 'medium'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        cls === 'easy' && 'bg-green-100 text-green-700',
        cls === 'medium' && 'bg-yellow-100 text-yellow-700',
        cls === 'hard' && 'bg-red-100 text-red-700'
      )}
    >
      {difficulty}
    </span>
  )
}

export function VideoModal() {
  const videoModalOpen = useAnatomyStore((s) => s.videoModalOpen)
  const closeVideoModal = useAnatomyStore((s) => s.closeVideoModal)
  const videoExerciseName = useAnatomyStore((s) => s.videoExerciseName)
  const videoId = useAnatomyStore((s) => s.videoId)
  const videoDifficulty = useAnatomyStore((s) => s.videoDifficulty)

  const hasVideoId = videoId && videoId.trim().length > 0
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    videoExerciseName + ' exercise tutorial'
  )}`

  return (
    <Modal
      isOpen={videoModalOpen}
      onClose={closeVideoModal}
      title={videoExerciseName}
      size="full"
    >
      {/* Difficulty badge */}
      {videoDifficulty && (
        <div className="mb-4">
          <DifficultyBadge difficulty={videoDifficulty} />
        </div>
      )}

      {/* Video embed or fallback */}
      {hasVideoId ? (
        <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={videoExerciseName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background py-12">
          <p className="mb-4 text-sm text-text-secondary">
            This exercise does not have a linked video.
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(searchUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            YouTube Search
          </Button>
        </div>
      )}

      {/* Close button area */}
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={closeVideoModal}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
