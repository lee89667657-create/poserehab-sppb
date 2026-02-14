// highlights.ts - Mesh highlighting, vertex-level region coloring, tissue visibility, render modes
// Ported from git-test/src/anatomy/Highlights.js
// All functions are pure (no global sceneRoot) - accept model root as parameter

import * as THREE from 'three'
import type { RenderMode } from '@/types/anatomy'
import { BONE_PREFIXES, MUSCLE_GROUP_PREFIXES } from '@/lib/anatomy/regions'

// ---- Internal maps keyed by mesh uuid ----
const origVertexColors = new Map<string, Float32Array>()
const origMaterials = new Map<string, THREE.Material>()
const normalModeMaterials = new Map<string, THREE.Material>()
const xrayMaterialCache = new Map<string, THREE.ShaderMaterial>()
const hiddenTissues = new Set<string>()

// ---- Helpers ----

function matchesTissueGroup(matName: string, groupName: string): boolean {
  if (groupName === 'Muscle') {
    return MUSCLE_GROUP_PREFIXES.some((p) => matName.startsWith(p))
  }
  if (groupName === 'Bone') {
    return BONE_PREFIXES.some((p) => matName.startsWith(p))
  }
  return matName === groupName || matName.startsWith(groupName.replace('.001', '').replace('.002', ''))
}

// ---- X-Ray shaders ----

const XRAY_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPos.xyz);
  gl_Position = projectionMatrix * mvPos;
}`

const XRAY_FRAG = `
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
  float alpha = mix(0.02, uIntensity, fresnel);
  vec3 col = uColor * (0.4 + fresnel * 0.8);
  gl_FragColor = vec4(col, alpha);
}`

function getXrayMaterial(uuid: string): THREE.ShaderMaterial {
  if (!xrayMaterialCache.has(uuid)) {
    xrayMaterialCache.set(
      uuid,
      new THREE.ShaderMaterial({
        vertexShader: XRAY_VERT,
        fragmentShader: XRAY_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(0x40a8ff) },
          uIntensity: { value: 0.35 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    )
  }
  return xrayMaterialCache.get(uuid)!
}

// ---- Exported functions ----

/**
 * Initialize vertex colors on a mesh (call during model load).
 * Fills color attribute from material color, stores originals.
 */
export function initVertexColors(mesh: THREE.Mesh): void {
  if (!mesh || !mesh.isMesh) return
  const geo = mesh.geometry as THREE.BufferGeometry
  const pos = geo.attributes.position
  if (!pos) return

  const count = pos.count
  const mat = mesh.material as THREE.MeshStandardMaterial
  const matColor = mat.color ? mat.color.clone() : new THREE.Color(0xcccccc)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    colors[i * 3] = matColor.r
    colors[i * 3 + 1] = matColor.g
    colors[i * 3 + 2] = matColor.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Store originals
  origVertexColors.set(mesh.uuid, new Float32Array(colors))
  origMaterials.set(mesh.uuid, mat.clone())

  // Enable vertex colors
  mat.vertexColors = true
  mat.color = new THREE.Color(0xffffff)
  mat.needsUpdate = true
}

/**
 * Set tissue group visibility on the model.
 */
export function setTissueVisible(
  root: THREE.Object3D,
  groupName: string,
  visible: boolean
): void {
  if (!root) return

  if (visible) {
    hiddenTissues.delete(groupName)
  } else {
    hiddenTissues.add(groupName)
  }

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const matName = (child.userData.tissueType as string) || (child.material as THREE.MeshStandardMaterial).name || ''
    if (matchesTissueGroup(matName, groupName)) {
      child.visible = visible
    }
  })
}

/**
 * Switch render mode: 'muscle' (default), 'skeleton' (bones only), 'xray' (Fresnel edges).
 */
export function setRenderMode(
  root: THREE.Object3D,
  mode: RenderMode,
  previousMode?: RenderMode
): void {
  if (!root) return

  // Save current materials when leaving muscle mode
  if (previousMode === 'muscle' || !previousMode) {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        normalModeMaterials.set(child.uuid, child.material as THREE.Material)
      }
    })
  }

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const matName = (child.userData.tissueType as string) || ''
    const isBone = BONE_PREFIXES.some((p) => matName.startsWith(p))

    switch (mode) {
      case 'muscle': {
        const saved = normalModeMaterials.get(child.uuid)
        if (saved) child.material = saved
        child.visible = !hiddenTissues.has(isBone ? 'Bone' : 'Muscle')
        break
      }

      case 'skeleton': {
        if (isBone) {
          const saved = normalModeMaterials.get(child.uuid)
          if (saved) child.material = saved
          child.visible = true
        } else {
          child.visible = false
        }
        break
      }

      case 'xray': {
        child.visible = true
        if (isBone) {
          const baseMat = normalModeMaterials.get(child.uuid) || child.material
          const boneMat = (baseMat as THREE.MeshStandardMaterial).clone()
          boneMat.emissive = new THREE.Color(0x60d0ff)
          boneMat.emissiveIntensity = 0.6
          boneMat.transparent = false
          boneMat.opacity = 1.0
          boneMat.depthWrite = true
          boneMat.needsUpdate = true
          child.material = boneMat
        } else {
          child.material = getXrayMaterial(child.uuid)
        }
        break
      }
    }
  })
}

/**
 * Start vertex-level pulse animation on the specified meshes for a region.
 * Returns a cleanup function to stop and restore.
 */
export function startPulseHighlight(
  meshes: THREE.Mesh[],
  regionKey: string
): () => void {
  const PULSE_COLOR = { r: 1.0, g: 0.09, b: 0.27 } // #FF1744
  const side = regionKey?.endsWith('_l') ? 'l' : regionKey?.endsWith('_r') ? 'r' : null
  const vec3 = new THREE.Vector3()

  interface PulsingEntry {
    mesh: THREE.Mesh
    origColors: Float32Array
    hitIndices: number[]
    colAttr: THREE.BufferAttribute
  }

  const pulsingMeshes = new Map<string, PulsingEntry>()
  let animId: number | null = null

  for (const mesh of meshes) {
    if (!mesh || !mesh.isMesh) continue
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    const colAttr = mesh.geometry.attributes.color as THREE.BufferAttribute
    if (!pos || !colAttr) continue

    const origColors = new Float32Array(colAttr.array as Float32Array)

    mesh.updateWorldMatrix(true, false)
    const matW = mesh.matrixWorld
    const hitIndices: number[] = []

    for (let i = 0; i < pos.count; i++) {
      vec3.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(matW)
      if (side === 'l' && vec3.x < 0) continue
      if (side === 'r' && vec3.x >= 0) continue
      hitIndices.push(i)
    }

    if (hitIndices.length === 0) continue
    pulsingMeshes.set(mesh.uuid, { mesh, origColors, hitIndices, colAttr })
  }

  function animatePulse() {
    if (pulsingMeshes.size === 0) {
      animId = null
      return
    }

    const t = Date.now() * 0.005
    const factor = 0.3 + (Math.sin(t) * 0.5 + 0.5) * 0.7 // 0.3 ~ 1.0

    Array.from(pulsingMeshes.values()).forEach(({ colAttr, hitIndices, origColors }) => {
      const arr = colAttr.array as Float32Array
      for (let idx = 0; idx < hitIndices.length; idx++) {
        const i = hitIndices[idx]
        const oi = i * 3
        arr[oi] = origColors[oi] + (PULSE_COLOR.r - origColors[oi]) * factor
        arr[oi + 1] = origColors[oi + 1] + (PULSE_COLOR.g - origColors[oi + 1]) * factor
        arr[oi + 2] = origColors[oi + 2] + (PULSE_COLOR.b - origColors[oi + 2]) * factor
      }
      colAttr.needsUpdate = true
    })

    animId = requestAnimationFrame(animatePulse)
  }

  if (pulsingMeshes.size > 0) {
    animatePulse()
  }

  // Cleanup function
  return () => {
    if (animId !== null) {
      cancelAnimationFrame(animId)
      animId = null
    }
    Array.from(pulsingMeshes.values()).forEach(({ colAttr, origColors }) => {
      ;(colAttr.array as Float32Array).set(origColors)
      colAttr.needsUpdate = true
    })
    pulsingMeshes.clear()
  }
}
