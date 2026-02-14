'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { initVertexColors } from '@/lib/anatomy/highlights'
import { isBoneMaterial, MUSCLE_GROUP_PREFIXES } from '@/lib/anatomy/regions'

const MODEL_PATH = '/models/RiggingModel.glb'

export interface ModelBounds {
  center: THREE.Vector3
  size: THREE.Vector3
  min: THREE.Vector3
  max: THREE.Vector3
}

interface AnatomyModelProps {
  onModelLoaded?: (bounds: ModelBounds, root: THREE.Group) => void
}

export function AnatomyModel({ onModelLoaded }: AnatomyModelProps) {
  const { scene } = useGLTF(MODEL_PATH)
  const groupRef = useRef<THREE.Group>(null)
  const initializedRef = useRef(false)

  // Clone scene once to avoid mutating the cached original
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    if (initializedRef.current || !clonedScene) return
    initializedRef.current = true

    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const mesh = child as THREE.Mesh
      const originalMat = mesh.material as THREE.MeshStandardMaterial

      // Clone material so each mesh gets its own instance
      const mat = originalMat.clone() as THREE.MeshStandardMaterial
      mesh.material = mat

      // Determine tissue type from material name
      const matName = mat.name || ''
      const isBone = isBoneMaterial(matName)
      const isMuscle = MUSCLE_GROUP_PREFIXES.some((p) => matName.startsWith(p))

      // Store tissue type in userData for later use
      mesh.userData.tissueType = matName

      if (isBone) {
        // Bone: matte appearance
        mat.roughness = 0.85
        mat.metalness = 0.02
        mat.envMapIntensity = 0.3
      } else if (isMuscle) {
        // Muscle: slightly glossy
        mat.roughness = 0.55
        mat.metalness = 0.08
        mat.envMapIntensity = 0.6
      }

      // Initialize vertex colors for region coloring support
      initVertexColors(mesh)
    })

    // Compute model bounds
    const box = new THREE.Box3().setFromObject(clonedScene)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    if (onModelLoaded && groupRef.current) {
      onModelLoaded(
        { center, size, min: box.min.clone(), max: box.max.clone() },
        groupRef.current
      )
    }
  }, [clonedScene, onModelLoaded])

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload the model
useGLTF.preload(MODEL_PATH)
