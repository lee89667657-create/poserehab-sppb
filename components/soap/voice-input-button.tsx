'use client'

import { Mic, MicOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { cn } from '@/lib/utils'

interface VoiceInputButtonProps {
  onTranscriptChange?: (transcript: string) => void
  onTagsChange?: (tags: Map<string, string[]>) => void
  className?: string
}

export function VoiceInputButton({
  onTranscriptChange,
  onTagsChange,
  className,
}: VoiceInputButtonProps) {
  const {
    isSupported,
    isRecording,
    transcript,
    detectedTags,
    toggleRecording,
  } = useVoiceInput()

  // Notify parent of changes
  if (onTranscriptChange && transcript) {
    onTranscriptChange(transcript)
  }
  if (onTagsChange && detectedTags.size > 0) {
    onTagsChange(detectedTags)
  }

  if (!isSupported) {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <Button variant="outline" size="icon" disabled>
          <MicOff className="h-4 w-4" />
        </Button>
        <span className="flex items-center gap-1 text-[11px] text-text-secondary">
          <AlertCircle className="h-3 w-3" />
          음성 인식 미지원
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* Mic button with pulse animation */}
      <div className="relative">
        {isRecording && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
        )}
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          size="icon"
          onClick={toggleRecording}
          className={cn(
            'relative z-10',
            isRecording && 'ring-2 ring-red-400 ring-offset-2'
          )}
        >
          {isRecording ? (
            <Mic className="h-4 w-4 animate-pulse" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Status text */}
      <div className="text-center">
        {isRecording ? (
          <span className="text-[11px] font-medium text-red-500">
            듣고 있습니다...
          </span>
        ) : transcript ? (
          <span className="max-w-[200px] truncate text-[11px] text-text-secondary">
            인식 완료
          </span>
        ) : (
          <span className="text-[11px] text-text-secondary">
            음성 입력
          </span>
        )}
      </div>

      {/* Interim transcript preview */}
      {isRecording && transcript && (
        <p className="mt-1 max-w-[300px] rounded-md bg-surface px-2 py-1 text-[11px] text-text-secondary">
          인식 중: {transcript.slice(-80)}
          {transcript.length > 80 ? '...' : ''}
        </p>
      )}
    </div>
  )
}
