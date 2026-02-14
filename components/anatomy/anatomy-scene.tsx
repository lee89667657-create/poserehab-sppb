'use client'

import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { Loader2 } from 'lucide-react'
import { AnatomyModel, type ModelBounds } from './anatomy-model'
import { AnatomyControls, type AnatomyControlsRef } from './anatomy-controls'
import type { CameraPresetPosition } from '@/types/anatomy'

function LoadingProgress() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-white">3D Model Loading...</p>
          <p className="text-xs text-gray-400">{progress.toFixed(0)}%</p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  )
}

interface AnatomySceneProps {
  onControlsRef?: (ref: AnatomyControlsRef | null) => void
  className?: string
}

export function AnatomyScene({ onControlsRef, className }: AnatomySceneProps) {
  const controlsRef = useRef<AnatomyControlsRef>(null)
  const [modelRoot, setModelRoot] = useState<THREE.Group | null>(null)

  const handleModelLoaded = useCallback(
    (_bounds: ModelBounds, root: THREE.Group) => {
      setModelRoot(root)
    },
    []
  )

  // Forward controls ref to parent
  const handleControlsRef = useCallback(
    (node: AnatomyControlsRef | null) => {
      ;(controlsRef as React.MutableRefObject<AnatomyControlsRef | null>).current = node
      onControlsRef?.(node)
    },
    [onControlsRef]
  )

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{
          fov: 45,
          near: 0.01,
          far: 1000,
          position: [0, 1, 3],
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: '#0a0f1a' }}
      >
        {/* Clinical lighting setup */}
        <ambientLight intensity={0.4} color="#b0c4de" />
        <hemisphereLight
          color="#cce0ff"
          groundColor="#2a1a0a"
          intensity={0.5}
        />
        {/* Key light (directional with shadow) */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.0}
          color="#fff5e6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
        />
        {/* Fill light */}
        <directionalLight
          position={[-4, 3, -2]}
          intensity={0.35}
          color="#c0d8ff"
        />
        {/* Rim light */}
        <directionalLight
          position={[0, 2, -6]}
          intensity={0.5}
          color="#a0c0ff"
        />
        {/* Bounce light from below */}
        <directionalLight
          position={[0, -3, 2]}
          intensity={0.15}
          color="#ffe8cc"
        />

        <Suspense fallback={<LoadingProgress />}>
          <AnatomyModel onModelLoaded={handleModelLoaded} />
          <Environment preset="studio" environmentIntensity={0.3} />
        </Suspense>

        <AnatomyControls
          ref={handleControlsRef}
          modelRoot={modelRoot}
        />
      </Canvas>
    </div>
  )
}
