'use client'

import { useCallback, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2, Camera } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { AnatomyToolbar } from '@/components/anatomy/anatomy-toolbar'
import { AnatomyInfoPanel } from '@/components/anatomy/anatomy-info-panel'
import { VideoModal } from '@/components/anatomy/video-modal'
import { Button } from '@/components/ui/button'
import { useAnatomyStore } from '@/stores/anatomy-store'
import { useTranslation } from '@/hooks/use-translation'
import type { AnatomyControlsRef } from '@/components/anatomy/anatomy-controls'
import type { CameraPresetPosition, RenderMode } from '@/types/anatomy'

// Dynamic import to prevent SSR for the 3D canvas
const AnatomyScene = dynamic(
  () =>
    import('@/components/anatomy/anatomy-scene').then((m) => ({
      default: m.AnatomyScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-xl border border-border bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">3D Viewer Loading...</p>
        </div>
      </div>
    ),
  }
)

function AnatomyContent() {
  const controlsRef = useRef<AnatomyControlsRef | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useTranslation()

  const renderMode = useAnatomyStore((s) => s.renderMode)
  const setSelectedRegionKey = useAnatomyStore((s) => s.setSelectedRegionKey)
  const previousRenderModeRef = useRef<RenderMode>(renderMode)

  const highlightParam = searchParams.get('highlight')

  // Auto-select region from URL param
  useEffect(() => {
    if (highlightParam) {
      setSelectedRegionKey(highlightParam)
    }
  }, [highlightParam, setSelectedRegionKey])

  const handleControlsRef = useCallback((ref: AnatomyControlsRef | null) => {
    controlsRef.current = ref
  }, [])

  const handleCameraPreset = useCallback((preset: CameraPresetPosition) => {
    controlsRef.current?.animateCameraTo(preset)
  }, [])

  useEffect(() => {
    previousRenderModeRef.current = renderMode
  }, [renderMode])

  return (
    <MainLayout title="3D Anatomy Viewer">
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
        {/* Toolbar + Posture Analysis button */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <AnatomyToolbar onCameraPreset={handleCameraPreset} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/posture-analysis')}
            className="gap-2 flex-shrink-0"
          >
            <Camera className="h-4 w-4" />
            {language === 'ko' ? '자세 분석하기' : 'Posture Analysis'}
          </Button>
        </div>

        {/* Highlight banner */}
        {highlightParam && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="text-primary font-medium">
              {language === 'ko' ? '자세 분석에서 연결됨' : 'Linked from Posture Analysis'}
            </span>
            <span className="text-text-secondary">
              {language === 'ko'
                ? '— 아래 정보 패널에서 해당 부위의 상세 정보를 확인하세요'
                : '— See the info panel for details about this region'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/posture-analysis/result/muscle')}
              className="ml-auto text-xs"
            >
              {language === 'ko' ? '근육 분석으로 돌아가기' : 'Back to Muscle Analysis'}
            </Button>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 gap-3 overflow-hidden">
          {/* 3D Viewer */}
          <div className="relative flex-1 overflow-hidden rounded-xl border border-border">
            <AnatomyScene
              onControlsRef={handleControlsRef}
              className="h-full w-full"
            />

            {/* Interaction hint */}
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1.5 text-[11px] text-gray-300 backdrop-blur-sm">
              <span>Drag: Rotate</span>
              <span className="text-gray-500">|</span>
              <span>Scroll: Zoom</span>
              <span className="text-gray-500">|</span>
              <span>Click: Select</span>
            </div>
          </div>

          {/* Info Panel */}
          <AnatomyInfoPanel className="w-80 flex-shrink-0" />
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal />
    </MainLayout>
  )
}

export default function AnatomyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <AnatomyContent />
    </Suspense>
  )
}
