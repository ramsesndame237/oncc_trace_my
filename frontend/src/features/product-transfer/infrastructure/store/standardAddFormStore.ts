import { indexedDBStorage } from "@/lib/indexedDBStorage"
import { create } from "zustand"
import { persist, type PersistStorage } from "zustand/middleware"
import type { ProductItem } from "../../domain"
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
} from "../../presentation/schemas/standard-validation-schemas"
import type { IFileValue } from "@/types/type"

/**
 * Configuration d'une étape
 */
export interface StepConfig {
  id: number
  name: string
  path: string
  title: string
  isOptional: boolean
  isCompleted: boolean
}

/**
 * Validation par étape
 */
export interface StepValidation {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
  step5: boolean
}

/**
 * Données du formulaire
 */
export interface StandardFormData {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  step5: Step5Data
}

/**
 * État du formulaire
 */
interface StandardFormState {
  formData: StandardFormData
  stepValidation: StepValidation
  completedSteps: Set<number>
  currentStep: number
  steps: StepConfig[]
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  isSubmitting: boolean
  error: string | null
  // Mode édition
  isEditMode: boolean
  entityId?: string
  editOffline?: boolean
}

/**
 * Actions du formulaire
 */
interface StandardFormActions {
  // Données
  updateStep1Data: (data: Partial<StandardFormData["step1"]>) => void
  updateStep2Data: (data: Partial<StandardFormData["step2"]>) => void
  updateStep3Data: (data: Partial<StandardFormData["step3"]>) => void
  updateStep4Data: (data: Partial<StandardFormData["step4"]>) => void
  updateStep5Data: (data: Partial<StandardFormData["step5"]>) => void

  // Products helpers
  addProduct: (product: ProductItem) => void
  removeProduct: (index: number) => void
  setProducts: (products: ProductItem[]) => void

  // Documents helpers
  addDocument: (document: IFileValue) => void
  removeDocument: (index: number) => void
  setDocuments: (documents: IFileValue[]) => void

  // Validation
  setStepValidation: (step: keyof StepValidation, isValid: boolean) => void
  validateStep: (stepNumber: number) => boolean

  // Navigation
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  getNextStep: () => number | null
  getPreviousStep: () => number | null
  getStepConfig: (stepId: number) => StepConfig | undefined

  // Steps management
  markStepCompleted: (stepNumber: number) => void
  isStepAccessible: (stepNumber: number) => boolean
  canNavigateToStep: (step: number) => boolean

  // Save & Reset
  saveProgress: () => void
  markAsSaved: () => void
  resetForm: () => void
  initializeForm: (entityId?: string, editOffline?: boolean) => void

  // Mode édition
  setEditMode: (entityId?: string, editOffline?: boolean) => void

  // Submission
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
}

/**
 * Configuration des étapes
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: "general-info",
    path: "/product-transfers/standard/create/general-info",
    title: "Informations générales",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "products",
    path: "/product-transfers/standard/create/products",
    title: "Produits",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: "driver",
    path: "/product-transfers/standard/create/driver",
    title: "Chauffeur",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 4,
    name: "documents",
    path: "/product-transfers/standard/create/documents",
    title: "Documents",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 5,
    name: "summary",
    path: "/product-transfers/standard/create/summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
]

/**
 * Données par défaut
 */
const defaultFormData: StandardFormData = {
  step1: {
    senderActorId: "",
    senderStoreId: "",
    receiverActorId: "",
    receiverStoreId: "",
    transferDate: "",
  },
  step2: {
    products: [],
  },
  step3: {
    hasDriver: false,
    driverInfo: undefined,
  },
  step4: {
    routeSheetDocuments: [],
  },
  step5: {
    confirmed: false,
  },
}

/**
 * Store Zustand pour le formulaire de création de transfert STANDARD
 */
export const useStandardAddFormStore = create<
  StandardFormState & StandardFormActions
>()(
  persist(
    (set, get) => ({
      // État initial
      formData: defaultFormData,
      stepValidation: {
        step1: false,
        step2: false,
        step3: false,
        step4: false,
        step5: false,
      },
      completedSteps: new Set<number>(),
      currentStep: 1,
      steps: stepsConfig,
      hasUnsavedChanges: false,
      lastSaved: null,
      isSubmitting: false,
      error: null,
      isEditMode: false,
      entityId: undefined,
      editOffline: false,

      // Actions - Mise à jour des données
      updateStep1Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step1: { ...state.formData.step1, ...data },
          },
          hasUnsavedChanges: true,
        }))
      },

      updateStep2Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: { ...state.formData.step2, ...data },
          },
          hasUnsavedChanges: true,
        }))
      },

      updateStep3Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step3: { ...state.formData.step3, ...data },
          },
          hasUnsavedChanges: true,
        }))
      },

      updateStep4Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step4: { ...state.formData.step4, ...data },
          },
          hasUnsavedChanges: true,
        }))
      },

      updateStep5Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step5: { ...state.formData.step5, ...data },
          },
          hasUnsavedChanges: true,
        }))
      },

      // Products helpers
      addProduct: (product) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              products: [...state.formData.step2.products, product],
            },
          },
          hasUnsavedChanges: true,
        }))
      },

      removeProduct: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              products: state.formData.step2.products.filter(
                (_, i) => i !== index
              ),
            },
          },
          hasUnsavedChanges: true,
        }))
      },

      setProducts: (products) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: { products },
          },
          hasUnsavedChanges: true,
        }))
      },

      // Documents helpers
      addDocument: (document) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step4: {
              ...state.formData.step4,
              routeSheetDocuments: [
                ...state.formData.step4.routeSheetDocuments,
                document,
              ],
            },
          },
          hasUnsavedChanges: true,
        }))
      },

      removeDocument: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step4: {
              ...state.formData.step4,
              routeSheetDocuments:
                state.formData.step4.routeSheetDocuments.filter(
                  (_, i) => i !== index
                ),
            },
          },
          hasUnsavedChanges: true,
        }))
      },

      setDocuments: (documents) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step4: {
              ...state.formData.step4,
              routeSheetDocuments: documents,
            },
          },
          hasUnsavedChanges: true,
        }))
      },

      // Validation
      setStepValidation: (step, isValid) => {
        set((state) => ({
          stepValidation: {
            ...state.stepValidation,
            [step]: isValid,
          },
        }))
      },

      validateStep: (stepNumber) => {
        const state = get()
        const stepKey = `step${stepNumber}` as keyof StepValidation
        return state.stepValidation[stepKey] || false
      },

      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, steps } = get()
        if (currentStep < steps.length) {
          set({ currentStep: currentStep + 1 })
        }
      },

      previousStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 })
        }
      },

      goToStep: (step) => {
        const { canNavigateToStep } = get()
        if (canNavigateToStep(step)) {
          set({ currentStep: step })
        }
      },

      getNextStep: () => {
        const { currentStep, steps } = get()
        return currentStep < steps.length ? currentStep + 1 : null
      },

      getPreviousStep: () => {
        const { currentStep } = get()
        return currentStep > 1 ? currentStep - 1 : null
      },

      getStepConfig: (stepId) => {
        return get().steps.find((s) => s.id === stepId)
      },

      // Steps management
      markStepCompleted: (stepNumber) => {
        set((state) => {
          const newCompleted = new Set(state.completedSteps)
          newCompleted.add(stepNumber)
          return { completedSteps: newCompleted }
        })
      },

      isStepAccessible: (stepNumber) => {
        const { completedSteps } = get()
        if (stepNumber === 1) return true
        return completedSteps.has(stepNumber - 1)
      },

      canNavigateToStep: (step) => {
        const { isStepAccessible } = get()
        return isStepAccessible(step)
      },

      // Save & Reset
      saveProgress: () => {
        set({
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        })
      },

      markAsSaved: () => {
        set({
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        })
      },

      resetForm: () => {
        set({
          formData: defaultFormData,
          stepValidation: {
            step1: false,
            step2: false,
            step3: false,
            step4: false,
            step5: false,
          },
          completedSteps: new Set<number>(),
          currentStep: 1,
          hasUnsavedChanges: false,
          lastSaved: null,
          isSubmitting: false,
          error: null,
          isEditMode: false,
          entityId: undefined,
          editOffline: false,
        })
      },

      initializeForm: (entityId, editOffline) => {
        set({
          isEditMode: !!entityId,
          entityId,
          editOffline,
        })
      },

      // Mode édition
      setEditMode: (entityId, editOffline) => {
        set({
          isEditMode: !!entityId,
          entityId,
          editOffline,
        })
      },

      // Submission
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setError: (error) => set({ error }),
    }),
    {
      name: "standard-add-form-storage",
      version: 1, // Version du store pour gérer les migrations

      // ⭐ Utiliser IndexedDB RAW (sans createJSONStorage) pour supporter les Blobs
      storage: indexedDBStorage as unknown as PersistStorage<
        StandardFormState & StandardFormActions
      >,

      partialize: (state) =>
        ({
          formData: state.formData, // ✅ Maintenant inclut step4 avec Blobs (documents) natifs
          completedSteps: Array.from(state.completedSteps),
          currentStep: state.currentStep,
          lastSaved: state.lastSaved,
          isEditMode: state.isEditMode,
          entityId: state.entityId,
          editOffline: state.editOffline,
        } as unknown as StandardFormState & StandardFormActions),

      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convertir l'array en Set lors de la réhydratation
          state.completedSteps = new Set(
            state.completedSteps as unknown as number[]
          )

          // Mettre à jour la configuration des étapes avec l'état de completion
          state.steps = stepsConfig.map((step) => ({
            ...step,
            isCompleted: state.completedSteps.has(step.id),
          }))
        }
      },
    }
  )
)
