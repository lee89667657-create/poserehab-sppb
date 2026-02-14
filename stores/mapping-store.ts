import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MappingJson, MappingRegionData } from '@/types/anatomy'
import { PREDEFINED_REGIONS } from '@/lib/anatomy/regions'

interface MappingState {
  mappingData: MappingJson | null
  selectedRegionKey: string | null
  isAssignMode: boolean

  // Actions
  setMappingData: (data: MappingJson | null) => void
  setSelectedRegionKey: (key: string | null) => void
  setIsAssignMode: (mode: boolean) => void

  addRegion: (key: string) => void
  deleteRegion: (key: string) => void
  addMeshToRegion: (regionKey: string, meshName: string) => void
  removeMeshFromRegion: (regionKey: string, meshName: string) => void

  exportMapping: () => MappingJson
  importMapping: (json: MappingJson) => void
}

function createDefaultMapping(): MappingJson {
  const regions: Record<string, MappingRegionData> = {}
  for (const region of PREDEFINED_REGIONS) {
    regions[region.id] = {
      meshes: [],
      state: 'normal',
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
    }
  }
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    regions,
  }
}

export const useMappingStore = create<MappingState>()(
  persist(
    (set, get) => ({
      mappingData: null,
      selectedRegionKey: null,
      isAssignMode: false,

      setMappingData: (data) => set({ mappingData: data }),
      setSelectedRegionKey: (key) => set({ selectedRegionKey: key }),
      setIsAssignMode: (mode) => set({ isAssignMode: mode }),

      addRegion: (key) =>
        set((state) => {
          const data = state.mappingData || createDefaultMapping()
          if (data.regions[key]) return state // already exists

          const newRegion: MappingRegionData = {
            meshes: [],
            state: 'normal',
            xMin: null,
            xMax: null,
            yMin: null,
            yMax: null,
          }

          return {
            mappingData: {
              ...data,
              timestamp: new Date().toISOString(),
              regions: {
                ...data.regions,
                [key]: newRegion,
              },
            },
          }
        }),

      deleteRegion: (key) =>
        set((state) => {
          const data = state.mappingData
          if (!data || !data.regions[key]) return state

          const { [key]: _removed, ...rest } = data.regions
          return {
            mappingData: {
              ...data,
              timestamp: new Date().toISOString(),
              regions: rest,
            },
            selectedRegionKey:
              state.selectedRegionKey === key ? null : state.selectedRegionKey,
          }
        }),

      addMeshToRegion: (regionKey, meshName) =>
        set((state) => {
          const data = state.mappingData || createDefaultMapping()
          const region = data.regions[regionKey]
          if (!region) return state
          if (region.meshes.includes(meshName)) return state

          return {
            mappingData: {
              ...data,
              timestamp: new Date().toISOString(),
              regions: {
                ...data.regions,
                [regionKey]: {
                  ...region,
                  meshes: [...region.meshes, meshName],
                },
              },
            },
          }
        }),

      removeMeshFromRegion: (regionKey, meshName) =>
        set((state) => {
          const data = state.mappingData
          if (!data || !data.regions[regionKey]) return state

          const region = data.regions[regionKey]
          return {
            mappingData: {
              ...data,
              timestamp: new Date().toISOString(),
              regions: {
                ...data.regions,
                [regionKey]: {
                  ...region,
                  meshes: region.meshes.filter((m) => m !== meshName),
                },
              },
            },
          }
        }),

      exportMapping: () => {
        const state = get()
        const data = state.mappingData || createDefaultMapping()
        return {
          ...data,
          timestamp: new Date().toISOString(),
        }
      },

      importMapping: (json) =>
        set({
          mappingData: json,
          selectedRegionKey: null,
          isAssignMode: false,
        }),
    }),
    {
      name: 'mapping-editor',
      partialize: (state) => ({
        mappingData: state.mappingData,
      }),
    }
  )
)
