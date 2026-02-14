'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { extractKeywords } from '@/lib/anatomy/voice-keywords'

// SpeechRecognition types for browsers
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseVoiceInputReturn {
  isSupported: boolean
  isRecording: boolean
  transcript: string
  detectedTags: Map<string, string[]>
  startRecording: () => void
  stopRecording: () => void
  toggleRecording: () => void
  clearTags: () => void
  removeTag: (keyword: string) => void
  reset: () => void
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [detectedTags, setDetectedTags] = useState<Map<string, string[]>>(new Map())

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isRecordingRef = useRef(false)
  const fullTranscriptRef = useRef('')

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

  const isSupported = !!SpeechRecognitionClass

  const createRecognition = useCallback(() => {
    if (!SpeechRecognitionClass) return null

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        fullTranscriptRef.current += finalTranscript
        setTranscript(fullTranscriptRef.current)

        // Extract keywords from the full transcript
        const tags = extractKeywords(fullTranscriptRef.current)
        setDetectedTags(tags)
      } else if (interimTranscript) {
        setTranscript(fullTranscriptRef.current + interimTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // These are non-critical errors, ignore
        return
      }
      console.error('Speech recognition error:', event.error)
    }

    recognition.onend = () => {
      // Auto-restart if still recording
      if (isRecordingRef.current) {
        try {
          recognition.start()
        } catch {
          // Recognition may already be started
          setIsRecording(false)
          isRecordingRef.current = false
        }
      } else {
        setIsRecording(false)
      }
    }

    return recognition
  }, [SpeechRecognitionClass])

  const startRecording = useCallback(() => {
    if (!isSupported || isRecordingRef.current) return

    const recognition = createRecognition()
    if (!recognition) return

    recognitionRef.current = recognition
    isRecordingRef.current = true
    setIsRecording(true)

    try {
      recognition.start()
    } catch {
      setIsRecording(false)
      isRecordingRef.current = false
    }
  }, [isSupported, createRecognition])

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    setIsRecording(false)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Already stopped
      }
      recognitionRef.current = null
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [startRecording, stopRecording])

  const clearTags = useCallback(() => {
    setDetectedTags(new Map())
  }, [])

  const removeTag = useCallback((keyword: string) => {
    setDetectedTags((prev) => {
      const next = new Map(prev)
      Array.from(next.entries()).forEach(([category, keywords]) => {
        const filtered = keywords.filter((k: string) => k !== keyword)
        if (filtered.length === 0) {
          next.delete(category)
        } else {
          next.set(category, filtered)
        }
      })
      return next
    })
  }, [])

  const reset = useCallback(() => {
    stopRecording()
    fullTranscriptRef.current = ''
    setTranscript('')
    setDetectedTags(new Map())
  }, [stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isRecordingRef.current = false
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  return {
    isSupported,
    isRecording,
    transcript,
    detectedTags,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTags,
    removeTag,
    reset,
  }
}
