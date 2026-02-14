'use client'

import {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useAnatomyStore } from '@/stores/anatomy-store'
import { REGION_DEFS } from '@/lib/anatomy/regions'
import type { CameraPresetPosition } from '@/types/anatomy'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// Camera preset positions: [x, y, z]
const CAMERA_PRESETS: Record<CameraPresetPosition, [number, number, number]> = {
  front: [0, 1, 3],
  back: [0, 1, -3],
  left: [3, 1, 0],
  right: [-3, 1, 0],
  top: [0, 3.5, 0.01],
  reset: [0, 1, 3],
}

export interface AnatomyControlsRef {
  animateCameraTo: (preset: CameraPresetPosition, yOffset?: number) => void
}

interface AnatomyControlsProps {
  modelRoot?: THREE.Group | null
}

export const AnatomyControls = forwardRef<AnatomyControlsRef, AnatomyControlsProps>(
  function AnatomyControls({ modelRoot }, ref) {
    const { camera, gl } = useThree()
    const orbitRef = useRef<OrbitControlsImpl>(null)
    const raycasterRef = useRef(new THREE.Raycaster())
    const pointerRef = useRef(new THREE.Vector2())

    // Camera animation state
    const animating = useRef(false)
    const animStartPos = useRef(new THREE.Vector3())
    const animEndPos = useRef(new THREE.Vector3())
    const animStartTarget = useRef(new THREE.Vector3())
    const animEndTarget = useRef(new THREE.Vector3())
    const animProgress = useRef(0)

    const setSelectedRegionKey = useAnatomyStore((s) => s.setSelectedRegionKey)
    const setHoveredMeshName = useAnatomyStore((s) => s.setHoveredMeshName)

    // Animate camera to a preset position
    const animateCameraTo = useCallback(
      (preset: CameraPresetPosition, yOffset = 0) => {
        const [px, py, pz] = CAMERA_PRESETS[preset] || CAMERA_PRESETS.reset
        animStartPos.current.copy(camera.position)
        animEndPos.current.set(px, py + yOffset, pz)

        if (orbitRef.current) {
          animStartTarget.current.copy(orbitRef.current.target)
        } else {
          animStartTarget.current.set(0, 0.8, 0)
        }
        animEndTarget.current.set(0, 0.8 + yOffset, 0)

        animProgress.current = 0
        animating.current = true
      },
      [camera]
    )

    useImperativeHandle(ref, () => ({ animateCameraTo }), [animateCameraTo])

    // Smooth camera animation
    useFrame(() => {
      if (!animating.current) return
      animProgress.current = Math.min(animProgress.current + 0.035, 1)
      const t = animProgress.current
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3)

      camera.position.lerpVectors(animStartPos.current, animEndPos.current, ease)

      if (orbitRef.current) {
        orbitRef.current.target.lerpVectors(
          animStartTarget.current,
          animEndTarget.current,
          ease
        )
        orbitRef.current.update()
      }

      if (t >= 1) {
        animating.current = false
      }
    })

    // Compute region key from a world-space Y position on the model
    const computeRegionKey = useCallback(
      (worldPos: THREE.Vector3, meshName: string): string | null => {
        if (!modelRoot) return null

        // Get model bounding box for normalization
        const box = new THREE.Box3().setFromObject(modelRoot)
        const height = box.max.y - box.min.y
        if (height <= 0) return null

        const normalizedY = (worldPos.y - box.min.y) / height
        const side = worldPos.x >= 0 ? 'l' : 'r'

        // Find matching region by Y range
        for (const def of REGION_DEFS) {
          if (normalizedY >= def.yMin && normalizedY <= def.yMax) {
            // Convert id like 'upperBack' to 'upper_back'
            const baseId = def.id.replace(/([A-Z])/g, '_$1').toLowerCase()
            return `${baseId}_${side}`
          }
        }

        return null
      },
      [modelRoot]
    )

    // Pointer events
    useEffect(() => {
      const canvas = gl.domElement

      const onPointerMove = (e: PointerEvent) => {
        if (!modelRoot) return
        const rect = canvas.getBoundingClientRect()
        pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        raycasterRef.current.setFromCamera(pointerRef.current, camera)
        const intersects = raycasterRef.current.intersectObject(modelRoot, true)

        if (intersects.length > 0) {
          const hit = intersects[0]
          const mesh = hit.object as THREE.Mesh
          if (mesh.isMesh && mesh.visible) {
            canvas.style.cursor = 'pointer'
            setHoveredMeshName(mesh.name)
            return
          }
        }

        canvas.style.cursor = 'default'
        setHoveredMeshName(null)
      }

      const onClick = (e: PointerEvent) => {
        if (!modelRoot) return
        const rect = canvas.getBoundingClientRect()
        pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        raycasterRef.current.setFromCamera(pointerRef.current, camera)
        const intersects = raycasterRef.current.intersectObject(modelRoot, true)

        if (intersects.length > 0) {
          const hit = intersects[0]
          const mesh = hit.object as THREE.Mesh
          if (mesh.isMesh && mesh.visible) {
            const regionKey = computeRegionKey(hit.point, mesh.name)
            if (regionKey) {
              setSelectedRegionKey(regionKey)
            }
          }
        }
      }

      canvas.addEventListener('pointermove', onPointerMove)
      canvas.addEventListener('click', onClick)

      return () => {
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('click', onClick)
        canvas.style.cursor = 'default'
      }
    }, [gl, camera, modelRoot, setHoveredMeshName, setSelectedRegionKey, computeRegionKey])

    return (
      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={1}
        maxDistance={8}
        target={[0, 0.8, 0]}
        enablePan={false}
        minPolarAngle={Math.PI * 0.05}
        maxPolarAngle={Math.PI * 0.95}
      />
    )
  }
)
