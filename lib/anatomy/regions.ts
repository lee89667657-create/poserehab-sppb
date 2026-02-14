// regions.ts - Body region definitions and tissue name mapping
// Ported from git-test/src/anatomy/Regions.js (pure data, no THREE.js dependency)

import type { AnatomyRegion, RegionGroup, RegionDef } from '@/types/anatomy'

export const PREDEFINED_REGIONS: AnatomyRegion[] = [
  { id: 'head_l', name: '머리 (좌)', side: 'l' },
  { id: 'head_r', name: '머리 (우)', side: 'r' },
  { id: 'neck_l', name: '목 (좌)', side: 'l' },
  { id: 'neck_r', name: '목 (우)', side: 'r' },
  { id: 'shoulder_l', name: '왼쪽 어깨', side: 'l' },
  { id: 'shoulder_r', name: '오른쪽 어깨', side: 'r' },
  { id: 'chest_l', name: '가슴 (좌)', side: 'l' },
  { id: 'chest_r', name: '가슴 (우)', side: 'r' },
  { id: 'upper_back_l', name: '상부 등 (좌)', side: 'l' },
  { id: 'upper_back_r', name: '상부 등 (우)', side: 'r' },
  { id: 'lower_back_l', name: '허리 (좌)', side: 'l' },
  { id: 'lower_back_r', name: '허리 (우)', side: 'r' },
  { id: 'abdomen_l', name: '복부 (좌)', side: 'l' },
  { id: 'abdomen_r', name: '복부 (우)', side: 'r' },
  { id: 'arm_l', name: '왼팔', side: 'l' },
  { id: 'arm_r', name: '오른팔', side: 'r' },
  { id: 'hip_l', name: '골반 (좌)', side: 'l' },
  { id: 'hip_r', name: '골반 (우)', side: 'r' },
  { id: 'thigh_l', name: '왼대퇴', side: 'l' },
  { id: 'thigh_r', name: '오른대퇴', side: 'r' },
  { id: 'shin_l', name: '왼종아리', side: 'l' },
  { id: 'shin_r', name: '오른종아리', side: 'r' },
  { id: 'foot_l', name: '왼발', side: 'l' },
  { id: 'foot_r', name: '오른발', side: 'r' },
]

export const REGION_GROUPS: RegionGroup[] = [
  { name: '머리', ids: ['head_l', 'head_r'] },
  { name: '목', ids: ['neck_l', 'neck_r'] },
  { name: '어깨', ids: ['shoulder_l', 'shoulder_r'] },
  { name: '가슴', ids: ['chest_l', 'chest_r'] },
  { name: '상부 등', ids: ['upper_back_l', 'upper_back_r'] },
  { name: '허리', ids: ['lower_back_l', 'lower_back_r'] },
  { name: '복부', ids: ['abdomen_l', 'abdomen_r'] },
  { name: '팔', ids: ['arm_l', 'arm_r'] },
  { name: '골반', ids: ['hip_l', 'hip_r'] },
  { name: '대퇴', ids: ['thigh_l', 'thigh_r'] },
  { name: '종아리', ids: ['shin_l', 'shin_r'] },
  { name: '발', ids: ['foot_l', 'foot_r'] },
]

// Label lookup map
const REGION_LABEL_MAP: Record<string, string> = {}
for (const r of PREDEFINED_REGIONS) {
  REGION_LABEL_MAP[r.id] = r.name
}

// Y-axis fallback definitions
export const REGION_DEFS: RegionDef[] = [
  { id: 'head', label: '머리', yMin: 0.88, yMax: 1.0 },
  { id: 'neck', label: '목', yMin: 0.82, yMax: 0.88 },
  { id: 'shoulder', label: '어깨', yMin: 0.75, yMax: 0.85 },
  { id: 'upperBack', label: '상부 등', yMin: 0.65, yMax: 0.82 },
  { id: 'chest', label: '가슴', yMin: 0.65, yMax: 0.80 },
  { id: 'arm', label: '팔', yMin: 0.35, yMax: 0.75 },
  { id: 'lowerBack', label: '허리', yMin: 0.50, yMax: 0.65 },
  { id: 'abdomen', label: '복부', yMin: 0.48, yMax: 0.60 },
  { id: 'hip', label: '골반', yMin: 0.42, yMax: 0.52 },
  { id: 'thigh', label: '대퇴', yMin: 0.25, yMax: 0.45 },
  { id: 'shin', label: '종아리', yMin: 0.07, yMax: 0.25 },
  { id: 'foot', label: '발', yMin: 0.00, yMax: 0.08 },
]

// Tissue type display names (simplified: muscle / bone)
export const TISSUE_NAMES: Record<string, string> = {
  'Muscles.001': '근육',
  'Bone': '뼈',
  'Tendon.001': '근육',
  'Ligament.002': '근육',
  'Cartilage': '근육',
  'Cartilage.001': '근육',
  'Cartilage.002': '근육',
  'Articular_capsule.002': '근육',
  'Fat.001': '근육',
  'Fat.002': '근육',
  'Cornea.001': '근육',
  'Eye.001': '근육',
  'Suture': '뼈',
  'Teeth': '뼈',
  'None': '기타',
}

export const BONE_PREFIXES = ['Bone', 'Suture', 'Teeth']
export const MUSCLE_GROUP_PREFIXES = ['Muscles', 'Tendon', 'Ligament', 'Cartilage', 'Articular_capsule', 'Fat', 'Cornea', 'Eye']

export function getTissueName(materialName: string): string {
  return TISSUE_NAMES[materialName] || materialName || 'Unknown'
}

export function isBoneMaterial(matName: string): boolean {
  return BONE_PREFIXES.some((p) => matName.startsWith(p))
}

export function regionKeyToLabel(key: string): string {
  if (REGION_LABEL_MAP[key]) return REGION_LABEL_MAP[key]
  let side = ''
  let base = key
  if (key.endsWith('_l')) {
    side = ' (Left)'
    base = key.slice(0, -2)
  } else if (key.endsWith('_r')) {
    side = ' (Right)'
    base = key.slice(0, -2)
  }
  const label = base.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return label + side
}

export function regionKeyToSide(key: string): string {
  if (key.endsWith('_l')) return 'Left'
  if (key.endsWith('_r')) return 'Right'
  return 'Center'
}

export const REGION_COLORS = [
  '#E8734A', '#4A90D9', '#6BA88C', '#D4A843', '#9575CD',
  '#4DB6AC', '#E57373', '#64B5F6', '#81C784', '#FFB74D',
  '#BA68C8', '#4DD0E1', '#FF8A65', '#AED581', '#7986CB',
  '#F06292', '#A1887F', '#90A4AE', '#DCE775', '#FFD54F',
]

export function getRegionColor(index: number): string {
  return REGION_COLORS[index % REGION_COLORS.length]
}
