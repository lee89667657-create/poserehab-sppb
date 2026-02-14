import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RenderMode, MappingJson, Severity } from '@/types/anatomy'

interface AnatomyState {
  // 3D viewer state
  selectedRegionKey: string | null
  hoveredMeshName: string | null
  renderMode: RenderMode
  tissueVisibility: { muscle: boolean; bone: boolean }

  // Mapping data
  mappingData: MappingJson | null

  // Video modal
  videoModalOpen: boolean
  videoExerciseName: string
  videoId: string
  videoDifficulty: string

  // Actions
  setSelectedRegionKey: (key: string | null) => void
  setHoveredMeshName: (name: string | null) => void
  setRenderMode: (mode: RenderMode) => void
  setTissueVisibility: (group: 'muscle' | 'bone', visible: boolean) => void
  setMappingData: (data: MappingJson | null) => void
  openVideoModal: (name: string, videoId: string, difficulty: string) => void
  closeVideoModal: () => void
}

export const useAnatomyStore = create<AnatomyState>()(
  persist(
    (set) => ({
      selectedRegionKey: null,
      hoveredMeshName: null,
      renderMode: 'muscle',
      tissueVisibility: { muscle: true, bone: true },
      mappingData: null,
      videoModalOpen: false,
      videoExerciseName: '',
      videoId: '',
      videoDifficulty: '',

      setSelectedRegionKey: (key) => set({ selectedRegionKey: key }),
      setHoveredMeshName: (name) => set({ hoveredMeshName: name }),
      setRenderMode: (mode) => set({ renderMode: mode }),
      setTissueVisibility: (group, visible) =>
        set((state) => ({
          tissueVisibility: { ...state.tissueVisibility, [group]: visible },
        })),
      setMappingData: (data) => set({ mappingData: data }),
      openVideoModal: (name, videoId, difficulty) =>
        set({ videoModalOpen: true, videoExerciseName: name, videoId, videoDifficulty: difficulty }),
      closeVideoModal: () =>
        set({ videoModalOpen: false, videoExerciseName: '', videoId: '', videoDifficulty: '' }),
    }),
    {
      name: 'anatomy-viewer',
      partialize: (state) => ({
        renderMode: state.renderMode,
        tissueVisibility: state.tissueVisibility,
        mappingData: state.mappingData,
      }),
    }
  )
)
