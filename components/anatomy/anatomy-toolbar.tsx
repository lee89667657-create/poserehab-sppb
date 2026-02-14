'use client'

import {
  RotateCcw,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  ArrowUp,
  Eye,
  Bone,
  Layers,
  Scan,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnatomyStore } from '@/stores/anatomy-store'
import type { CameraPresetPosition, RenderMode } from '@/types/anatomy'
import { cn } from '@/lib/utils'

interface AnatomyToolbarProps {
  onCameraPreset: (preset: CameraPresetPosition) => void
  className?: string
}

const CAMERA_BUTTONS: { preset: CameraPresetPosition; label: string; icon: React.ReactNode }[] = [
  { preset: 'front', label: '정면', icon: <MoveUp className="h-3.5 w-3.5" /> },
  { preset: 'back', label: '후면', icon: <MoveDown className="h-3.5 w-3.5" /> },
  { preset: 'left', label: '좌측', icon: <MoveLeft className="h-3.5 w-3.5" /> },
  { preset: 'right', label: '우측', icon: <MoveRight className="h-3.5 w-3.5" /> },
  { preset: 'top', label: '상단', icon: <ArrowUp className="h-3.5 w-3.5" /> },
  { preset: 'reset', label: '초기화', icon: <RotateCcw className="h-3.5 w-3.5" /> },
]

const RENDER_MODES: { mode: RenderMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'muscle', label: '근육', icon: <Layers className="h-3.5 w-3.5" /> },
  { mode: 'skeleton', label: '골격', icon: <Bone className="h-3.5 w-3.5" /> },
  { mode: 'xray', label: 'X-Ray', icon: <Scan className="h-3.5 w-3.5" /> },
]

export function AnatomyToolbar({ onCameraPreset, className }: AnatomyToolbarProps) {
  const renderMode = useAnatomyStore((s) => s.renderMode)
  const setRenderMode = useAnatomyStore((s) => s.setRenderMode)
  const tissueVisibility = useAnatomyStore((s) => s.tissueVisibility)
  const setTissueVisibility = useAnatomyStore((s) => s.setTissueVisibility)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5',
        className
      )}
    >
      {/* Camera presets */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-text-secondary">Camera</span>
        {CAMERA_BUTTONS.map(({ preset, label, icon }) => (
          <Button
            key={preset}
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            onClick={() => onCameraPreset(preset)}
            title={label}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Render mode */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-text-secondary">Mode</span>
        {RENDER_MODES.map(({ mode, label, icon }) => (
          <Button
            key={mode}
            variant={renderMode === mode ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 px-2.5 text-xs"
            onClick={() => setRenderMode(mode)}
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Tissue visibility toggles */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-text-secondary">Tissue</span>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={tissueVisibility.muscle}
            onChange={(e) => setTissueVisibility('muscle', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          <Eye className="h-3 w-3 text-red-400" />
          <span className="text-text-primary">근육</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={tissueVisibility.bone}
            onChange={(e) => setTissueVisibility('bone', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          <Bone className="h-3 w-3 text-gray-300" />
          <span className="text-text-primary">뼈</span>
        </label>
      </div>
    </div>
  )
}
