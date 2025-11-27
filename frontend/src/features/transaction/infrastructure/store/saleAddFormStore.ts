import { indexedDBStorage } from '@/lib/indexedDBStorage'
import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'

/**
 * Interface pour un produit dans la transaction
 */
export interface TransactionProductForm {
  id: string // ID temporaire pour le form
  quality: string
  standard: string
  weight: number
  bagCount: number
  pricePerKg: number
  totalPrice: number
  humidity: number | null
  producerId: string | null
  notes: string | null
}

/**
 * Types pour le formulaire de vente de transaction
 */
export interface SaleAddFormData {
  step1: {
    locationType: 'MARKET' | 'CONVENTION' | 'OUTSIDE_MARKET' | null
    sellerId: string | null
    buyerId: string | null
    principalExporterId: string | null
    calendarId: string | null // Calendrier (marché ou enlèvement)
    conventionId: string | null // Si locationType = CONVENTION
    transactionDate: string | null
  }
  step2: {
    products: TransactionProductForm[]
  }
  step3: {
    saleContractDocuments: Array<{
      optionValues: unknown[]
      type: string
      data: string | Blob
      fileSize: number
      name?: string
    }>
  }
  step4: {
    confirmed: boolean
    notes: string | null
  }
}

export interface StepValidation {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
}

export interface StepConfig {
  id: number
  name: string
  path: string
  title: string
  isOptional: boolean
  isCompleted: boolean
}

export interface SaleAddFormStore {
  // État
  formData: SaleAddFormData
  stepValidation: StepValidation
  completedSteps: Set<number>
  currentStep: number
  steps: StepConfig[]
  lastSaved: Date | null
  hasUnsavedChanges: boolean

  // Actions pour mettre à jour les données
  updateStep1Data: (data: Partial<SaleAddFormData['step1']>) => void
  updateStep2Data: (data: Partial<SaleAddFormData['step2']>) => void
  updateStep3Data: (data: Partial<SaleAddFormData['step3']>) => void
  updateStep4Data: (data: Partial<SaleAddFormData['step4']>) => void

  // Actions pour gérer les produits
  addProduct: (product: TransactionProductForm) => void
  removeProduct: (index: number) => void
  setProducts: (products: TransactionProductForm[]) => void
  clearProducts: () => void

  // Actions de validation
  setStepValidation: (step: keyof StepValidation, isValid: boolean) => void

  // Actions pour gérer le mode édition
  setEditMode: (entityId?: string, editOffline?: boolean) => void

  // Actions de navigation
  setCurrentStep: (step: number) => void
  markStepCompleted: (step: number) => void
  canNavigateToStep: (step: number) => boolean
  getNextStep: () => number | null
  getPreviousStep: () => number | null
  getStepConfig: (stepId: number) => StepConfig | undefined

  // Actions de persistance
  saveProgress: () => void
  resetForm: () => void
  initializeForm: (entityId?: string, editOffline?: boolean) => void

  // Mode édition
  isEditMode: boolean
  entityId?: string
  editOffline?: boolean
}

/**
 * Données par défaut pour chaque étape
 */
const defaultFormData: SaleAddFormData = {
  step1: {
    locationType: null,
    sellerId: null,
    buyerId: null,
    principalExporterId: null,
    calendarId: null,
    conventionId: null,
    transactionDate: null,
  },
  step2: {
    products: [],
  },
  step3: {
    saleContractDocuments: [],
  },
  step4: {
    confirmed: false,
    notes: null,
  },
}

/**
 * Validation par défaut pour chaque étape
 */
const defaultStepValidation: StepValidation = {
  step1: false,
  step2: false,
  step3: false,
  step4: false,
}

/**
 * Configuration des étapes
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: 'general-info',
    path: '/transactions/sale/create/general-info',
    title: 'transaction:saleAdd.steps.generalInfo',
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: 'products',
    path: '/transactions/sale/create/products',
    title: 'transaction:saleAdd.steps.products',
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: 'documents',
    path: '/transactions/sale/create/documents',
    title: 'transaction:saleAdd.steps.documents',
    isOptional: true,
    isCompleted: false,
  },
  {
    id: 4,
    name: 'summary',
    path: '/transactions/sale/create/summary',
    title: 'transaction:saleAdd.steps.summary',
    isOptional: false,
    isCompleted: false,
  },
]

/**
 * Store Zustand pour le formulaire d'ajout de vente
 */
export const useSaleAddFormStore = create<SaleAddFormStore>()(
  persist(
    (set, get) => ({
      // État initial
      formData: defaultFormData,
      stepValidation: defaultStepValidation,
      completedSteps: new Set<number>(),
      currentStep: 1,
      steps: stepsConfig,
      lastSaved: null,
      hasUnsavedChanges: false,
      isEditMode: false,

      // Mise à jour des données
      updateStep1Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step1: { ...state.formData.step1, ...data },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      updateStep2Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: { ...state.formData.step2, ...data },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      updateStep3Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step3: { ...state.formData.step3, ...data },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      updateStep4Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step4: { ...state.formData.step4, ...data },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      // Gestion des produits
      addProduct: (product) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              ...state.formData.step2,
              products: [...state.formData.step2.products, product],
            },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      removeProduct: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              ...state.formData.step2,
              products: state.formData.step2.products.filter((_, i) => i !== index),
            },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      setProducts: (products) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              ...state.formData.step2,
              products,
            },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      clearProducts: () => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              ...state.formData.step2,
              products: [],
            },
          },
          hasUnsavedChanges: true,
        }))
        get().saveProgress()
      },

      // Validation
      setStepValidation: (step, isValid) => {
        set((state) => ({
          stepValidation: { ...state.stepValidation, [step]: isValid },
        }))
      },

      // Mode édition
      setEditMode: (entityId, editOffline) => {
        set({ isEditMode: !!entityId, entityId, editOffline })
      },

      // Navigation
      setCurrentStep: (step) => {
        set({ currentStep: step })
      },

      markStepCompleted: (step) => {
        set((state) => ({
          completedSteps: new Set(state.completedSteps).add(step),
          steps: state.steps.map((s) =>
            s.id === step ? { ...s, isCompleted: true } : s
          ),
        }))
      },

      canNavigateToStep: (step) => {
        const state = get()
        if (step === 1) return true
        if (step === state.currentStep) return true

        // Vérifier que toutes les étapes précédentes obligatoires sont complétées
        for (let i = 1; i < step; i++) {
          const stepConfig = state.steps.find((s) => s.id === i)
          if (stepConfig && !stepConfig.isOptional && !state.completedSteps.has(i)) {
            return false
          }
        }
        return true
      },

      getNextStep: () => {
        const state = get()
        const nextStep = state.currentStep + 1
        return nextStep <= state.steps.length ? nextStep : null
      },

      getPreviousStep: () => {
        const state = get()
        const prevStep = state.currentStep - 1
        return prevStep >= 1 ? prevStep : null
      },

      getStepConfig: (stepId) => {
        return get().steps.find((s) => s.id === stepId)
      },

      // Persistance
      saveProgress: () => {
        set({ lastSaved: new Date(), hasUnsavedChanges: false })
      },

      resetForm: () => {
        set({
          formData: defaultFormData,
          stepValidation: defaultStepValidation,
          completedSteps: new Set<number>(),
          currentStep: 1,
          steps: stepsConfig,
          lastSaved: null,
          hasUnsavedChanges: false,
          isEditMode: false,
          entityId: undefined,
          editOffline: undefined,
        })
      },

      initializeForm: (entityId, editOffline) => {
        if (entityId) {
          get().setEditMode(entityId, editOffline)
        } else {
          get().resetForm()
        }
      },
    }),
    {
      name: 'sale-add-form-storage',
      storage: indexedDBStorage as PersistStorage<SaleAddFormStore>,
      partialize: (state) => ({
        formData: state.formData,
        completedSteps: Array.from(state.completedSteps),
        currentStep: state.currentStep,
        lastSaved: state.lastSaved,
        isEditMode: state.isEditMode,
        entityId: state.entityId,
        editOffline: state.editOffline,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.completedSteps)) {
          state.completedSteps = new Set(state.completedSteps as unknown as number[])
        }
      },
    }
  )
)
