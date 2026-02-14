import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  SoapSubjective,
  SoapObjective,
  SoapAssessment,
  SoapPlan,
  SoapNotes,
} from '@/types/anatomy'

type SoapTab = 'subjective' | 'objective' | 'assessment' | 'plan'

interface SoapState {
  activeTab: SoapTab
  subjective: SoapSubjective
  objective: SoapObjective
  assessment: SoapAssessment
  plan: SoapPlan

  setActiveTab: (tab: SoapTab) => void
  updateSubjective: (partial: Partial<SoapSubjective>) => void
  updateObjective: (partial: Partial<SoapObjective>) => void
  updateAssessment: (partial: Partial<SoapAssessment>) => void
  updatePlan: (partial: Partial<SoapPlan>) => void
  clearForm: () => void
  loadFromSoap: (soap: SoapNotes) => void
}

const defaultSubjective: SoapSubjective = {
  chiefComplaint: '',
  painScale: 0,
  symptomDescription: '',
  painLocation: '',
  onset: '',
  aggravating: '',
  relieving: '',
}

const defaultObjective: SoapObjective = {
  autoFindings: '',
  rom: '',
  mmt: '',
  specialTests: '',
  palpation: '',
  gait: '',
  additionalFindings: '',
}

const defaultAssessment: SoapAssessment = {
  clinicalImpression: '',
  progressLevel: 'initial',
  functionalLevel: '',
  goals: '',
}

const defaultPlan: SoapPlan = {
  treatment: '',
  hep: '',
  frequency: '',
  duration: '',
  nextVisit: '',
  precautions: '',
  referral: '',
}

export const useSoapStore = create<SoapState>()(
  persist(
    (set) => ({
      activeTab: 'subjective',
      subjective: { ...defaultSubjective },
      objective: { ...defaultObjective },
      assessment: { ...defaultAssessment },
      plan: { ...defaultPlan },

      setActiveTab: (tab) => set({ activeTab: tab }),

      updateSubjective: (partial) =>
        set((state) => ({
          subjective: { ...state.subjective, ...partial },
        })),

      updateObjective: (partial) =>
        set((state) => ({
          objective: { ...state.objective, ...partial },
        })),

      updateAssessment: (partial) =>
        set((state) => ({
          assessment: { ...state.assessment, ...partial },
        })),

      updatePlan: (partial) =>
        set((state) => ({
          plan: { ...state.plan, ...partial },
        })),

      clearForm: () =>
        set({
          activeTab: 'subjective',
          subjective: { ...defaultSubjective },
          objective: { ...defaultObjective },
          assessment: { ...defaultAssessment },
          plan: { ...defaultPlan },
        }),

      loadFromSoap: (soap) =>
        set({
          subjective: { ...soap.subjective },
          objective: { ...soap.objective },
          assessment: { ...soap.assessment },
          plan: { ...soap.plan },
        }),
    }),
    {
      name: 'soap-notes',
      partialize: (state) => ({
        subjective: state.subjective,
        objective: state.objective,
        assessment: state.assessment,
        plan: state.plan,
      }),
    }
  )
)
