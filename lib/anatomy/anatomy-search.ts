// anatomy-search.ts - Pure search logic
// Ported from git-test/src/anatomy/AnatomyData.js searchAnatomy()

import { ANATOMY_DB } from './anatomy-data'
import type { SearchResult } from '@/types/anatomy'

export function searchAnatomy(query: string): SearchResult[] {
  if (!query || query.trim().length === 0) return []

  const q = query.trim().toLowerCase()
  const diseaseResults: SearchResult[] = []
  const otherResults: SearchResult[] = []
  const seen = new Set<string>()

  // 1st pass: disease matching (highest priority)
  for (const [key, info] of Object.entries(ANATOMY_DB)) {
    for (const path of info.commonPathologies) {
      if (path.toLowerCase().includes(q) && !seen.has(key)) {
        diseaseResults.push({ regionKey: key, name: info.name, matchField: `질환: ${path}` })
        seen.add(key)
        break
      }
    }
  }

  // 2nd pass: muscle, region name, structure, exercise
  for (const [key, info] of Object.entries(ANATOMY_DB)) {
    if (seen.has(key)) continue

    for (const muscle of info.keyMuscles) {
      if (muscle.toLowerCase().includes(q) && !seen.has(key)) {
        otherResults.push({ regionKey: key, name: info.name, matchField: `근육: ${muscle}` })
        seen.add(key)
        break
      }
    }
    if (seen.has(key)) continue

    if (info.name.toLowerCase().includes(q)) {
      otherResults.push({ regionKey: key, name: info.name, matchField: '부위명' })
      seen.add(key)
      continue
    }

    for (const struct of info.keyStructures) {
      if (struct.toLowerCase().includes(q) && !seen.has(key)) {
        otherResults.push({ regionKey: key, name: info.name, matchField: `구조: ${struct}` })
        seen.add(key)
        break
      }
    }
    if (seen.has(key)) continue

    for (const ex of info.exercises) {
      if (ex.name.toLowerCase().includes(q) && !seen.has(key)) {
        otherResults.push({ regionKey: key, name: info.name, matchField: `운동: ${ex.name}` })
        seen.add(key)
        break
      }
    }
  }

  return [...diseaseResults, ...otherResults]
}
