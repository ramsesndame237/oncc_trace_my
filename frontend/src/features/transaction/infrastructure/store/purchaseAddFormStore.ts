import { indexedDBStorage } from '@/lib/indexedDBStorage'
import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { TransactionProductForm } from './saleAddFormStore'

/**
 * Types pour le formulaire d'achat de transaction
 */
export interface PurchaseAddFormData {
  step1: {
    locationType: 'MARKET' | 'CONVENTION' | 'OUTSIDE_MARKET' | null
    buyerId: string | null // Acheteur en premier
    sellerId: string | null // Vendeur en second
    principalExporterId: string | null
    calendarId: string | null
    conventionId: string | null
    transactionDate: string | null
  }
  step2: {
    products: TransactionProductForm[]
  }
  step3: {
    purchaseContractDocuments: Array<{
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

export interface PurchaseAddFormStore {
  // État
  formData: PurchaseAddFormData
  stepValidation: StepValidation
  completedSteps: Set<number>
  currentStep: number
  steps: StepConfig[]
  lastSaved: Date | null
  hasUnsavedChanges: boolean

  // Actions pour mettre à jour les données
  updateStep1Data: (data: Partial<PurchaseAddFormData['step1']>) => void
  updateStep2Data: (data: Partial<PurchaseAddFormData['step2']>) => void
  updateStep3Data: (data: Partial<PurchaseAddFormData['step3']>) => void
  updateStep4Data: (data: Partial<PurchaseAddFormData['step4']>) => void

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
const defaultFormData: PurchaseAddFormData = {
  step1: {
    locationType: null,
    buyerId: null,
    sellerId: null,
    principalExporterId: null,
    calendarId: null,
    conventionId: null,
    transactionDate: null,
  },
  step2: {
    products: [],
  },
  step3: {
    purchaseContractDocuments: [],
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
 * Configuration des étapes pour l'achat
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: 'general-info',
    path: '/transactions/purchase/create/general-info',
    title: 'transaction:purchaseAdd.steps.generalInfo',
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: 'products',
    path: '/transactions/purchase/create/products',
    title: 'transaction:purchaseAdd.steps.products',
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: 'documents',
    path: '/transactions/purchase/create/documents',
    title: 'transaction:purchaseAdd.steps.documents',
    isOptional: true,
    isCompleted: false,
  },
  {
    id: 4,
    name: 'summary',
    path: '/transactions/purchase/create/summary',
    title: 'transaction:purchaseAdd.steps.summary',
    isOptional: false,
    isCompleted: false,
  },
]

/**
 * Store Zustand pour le formulaire d'ajout d'achat
 */
export const usePurchaseAddFormStore = create<PurchaseAddFormStore>()(
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
      name: 'purchase-add-form-storage',
      storage: indexedDBStorage as PersistStorage<PurchaseAddFormStore>,
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
