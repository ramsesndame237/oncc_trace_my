import { indexedDBStorage } from "@/lib/indexedDBStorage";
import { ConventionProduct } from "@/features/convention/domain/types/convention.types";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
} from "../../presentation/schemas/convention-validation-schemas";

/**
 * Configuration d'une étape
 */
export interface StepConfig {
  id: number;
  name: string;
  path: string;
  title: string;
  isOptional: boolean;
  isCompleted: boolean;
}

/**
 * Validation par étape
 */
export interface StepValidation {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
}

/**
 * Données du formulaire
 */
export interface ConventionFormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

/**
 * État du formulaire
 */
interface ConventionFormState {
  formData: ConventionFormData;
  stepValidation: StepValidation;
  completedSteps: Set<number>;
  currentStep: number;
  steps: StepConfig[];
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  isSubmitting: boolean;
  error: string | null;
  // Mode édition
  isEditMode: boolean;
  entityId?: string;
  editOffline?: boolean;
}

/**
 * Actions du formulaire
 */
interface ConventionFormActions {
  // Données
  updateStep1Data: (data: Partial<ConventionFormData["step1"]>) => void;
  updateStep2Data: (data: Partial<ConventionFormData["step2"]>) => void;
  updateStep3Data: (data: Partial<ConventionFormData["step3"]>) => void;
  updateStep4Data: (data: Partial<ConventionFormData["step4"]>) => void;

  // Products helpers
  addProduct: (product: ConventionProduct) => void;
  removeProduct: (index: number) => void;
  setProducts: (products: ConventionProduct[]) => void;

  // Validation
  setStepValidation: (step: keyof StepValidation, isValid: boolean) => void;
  validateStep: (stepNumber: number) => boolean;

  // Navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  getNextStep: () => number | null;
  getPreviousStep: () => number | null;
  getStepConfig: (stepId: number) => StepConfig | undefined;

  // Steps management
  markStepCompleted: (stepNumber: number) => void;
  isStepAccessible: (stepNumber: number) => boolean;
  canNavigateToStep: (step: number) => boolean;

  // Save & Reset
  saveProgress: () => void;
  markAsSaved: () => void;
  resetForm: () => void;
  initializeForm: (entityId?: string, editOffline?: boolean) => void;

  // Mode édition
  setEditMode: (entityId?: string, editOffline?: boolean) => void;

  // Submission
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Configuration des étapes
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: "basic-info",
    path: "/conventions/create/basic-info",
    title: "Informations de base",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "products",
    path: "/conventions/create/products",
    title: "Produits",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: "documents",
    path: "/conventions/create/documents",
    title: "Documents",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 4,
    name: "summary",
    path: "/conventions/create/summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
];

/**
 * Données par défaut
 */
const defaultFormData: ConventionFormData = {
  step1: {
    buyerExporterId: "",
    producersId: "",
    signatureDate: "",
  },
  step2: {
    products: [],
  },
  step3: {
    conventionDocuments: [],
    complementDocuments: [],
  },
  step4: {
    confirmed: false,
  },
};

/**
 * Validation par défaut
 */
const defaultStepValidation: StepValidation = {
  step1: false,
  step2: false,
  step3: false,
  step4: false,
};

/**
 * État initial
 */
const initialState: ConventionFormState = {
  formData: defaultFormData,
  stepValidation: defaultStepValidation,
  completedSteps: new Set<number>(),
  currentStep: 1,
  steps: stepsConfig,
  hasUnsavedChanges: false,
  lastSaved: null,
  isSubmitting: false,
  error: null,
  isEditMode: false,
  entityId: undefined,
  editOffline: undefined,
};

/**
 * Store Zustand pour le formulaire de création de convention
 */
export const useConventionFormStore = create<
  ConventionFormState & ConventionFormActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Mise à jour des données
      updateStep1Data: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step1: { ...state.formData.step1, ...data },
          },
          hasUnsavedChanges: true,
        })),

      updateStep2Data: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step2: { ...state.formData.step2, ...data },
          },
          hasUnsavedChanges: true,
        })),

      updateStep3Data: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step3: { ...state.formData.step3, ...data },
          },
          hasUnsavedChanges: true,
        })),

      updateStep4Data: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step4: { ...state.formData.step4, ...data },
          },
          hasUnsavedChanges: true,
        })),

      // Products helpers
      addProduct: (product) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step2: {
              products: [...state.formData.step2.products, product],
            },
          },
          hasUnsavedChanges: true,
        })),

      removeProduct: (index) =>
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
        })),

      setProducts: (products) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step2: { products },
          },
          hasUnsavedChanges: true,
        })),

      // Validation
      setStepValidation: (step, isValid) =>
        set((state) => ({
          stepValidation: { ...state.stepValidation, [step]: isValid },
        })),

      validateStep: (stepNumber) => {
        const state = get();
        switch (stepNumber) {
          case 1:
            return !!(
              state.formData.step1.buyerExporterId &&
              state.formData.step1.producersId &&
              state.formData.step1.signatureDate
            );
          case 2:
            return state.formData.step2.products.length > 0;
          case 3:
            return (
              state.formData.step3.conventionDocuments &&
              state.formData.step3.conventionDocuments.length > 0
            );
          case 4:
            return state.formData.step4.confirmed;
          default:
            return false;
        }
      },

      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const state = get();
        if (state.currentStep < state.steps.length) {
          set({ currentStep: state.currentStep + 1 });
        }
      },

      previousStep: () => {
        const state = get();
        if (state.currentStep > 1) {
          set({ currentStep: state.currentStep - 1 });
        }
      },

      goToStep: (step) => {
        const state = get();
        if (state.isStepAccessible(step)) {
          set({ currentStep: step });
        }
      },

      getNextStep: () => {
        const state = get();
        const currentIndex = state.steps.findIndex(
          (s) => s.id === state.currentStep
        );

        if (currentIndex < state.steps.length - 1) {
          return state.steps[currentIndex + 1].id;
        }

        return null;
      },

      getPreviousStep: () => {
        const state = get();
        const currentIndex = state.steps.findIndex(
          (s) => s.id === state.currentStep
        );

        if (currentIndex > 0) {
          return state.steps[currentIndex - 1].id;
        }

        return null;
      },

      getStepConfig: (stepId) => {
        const state = get();
        return state.steps.find((s) => s.id === stepId);
      },

      // Steps management
      markStepCompleted: (stepNumber) =>
        set((state) => {
          const newCompletedSteps = new Set(state.completedSteps);
          newCompletedSteps.add(stepNumber);

          // Mettre à jour la configuration des étapes
          const updatedSteps = state.steps.map((s) =>
            s.id === stepNumber ? { ...s, isCompleted: true } : s
          );

          return {
            completedSteps: newCompletedSteps,
            steps: updatedSteps,
          };
        }),

      isStepAccessible: (stepNumber) => {
        const state = get();
        if (stepNumber === 1) return true;
        return (
          state.completedSteps.has(stepNumber - 1) ||
          state.currentStep >= stepNumber
        );
      },

      canNavigateToStep: (step) => {
        const state = get();

        // On peut toujours naviguer à l'étape 1
        if (step === 1) return true;

        // On peut naviguer à une étape si :
        // 1. L'étape précédente est complétée OU optionnelle
        // 2. OU si on a déjà visité cette étape
        const previousStep = step - 1;
        const isPreviousStepCompleted = state.completedSteps.has(previousStep);
        const isPreviousStepOptional = state.steps.find(
          (s) => s.id === previousStep
        )?.isOptional;
        const hasVisitedStep = state.completedSteps.has(step);

        return (
          isPreviousStepCompleted || isPreviousStepOptional || hasVisitedStep
        );
      },

      // Save & Reset
      saveProgress: () =>
        set({
          lastSaved: new Date(),
        }),

      markAsSaved: () =>
        set({
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        }),

      resetForm: () => {
        set({
          formData: defaultFormData,
          stepValidation: defaultStepValidation,
          completedSteps: new Set<number>(),
          currentStep: 1,
          steps: stepsConfig.map((s) => ({ ...s, isCompleted: false })),
          hasUnsavedChanges: false,
          lastSaved: null,
          isSubmitting: false,
          error: null,
          isEditMode: false,
          entityId: undefined,
          editOffline: undefined,
        });
      },

      initializeForm: (entityId, editOffline) =>
        set(() => ({
          isEditMode: Boolean(entityId),
          entityId,
          editOffline,
          currentStep: 1,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        })),

      // Mode édition
      setEditMode: (entityId, editOffline) =>
        set(() => ({
          isEditMode: Boolean(entityId),
          entityId,
          editOffline,
        })),

      // Submission
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setError: (error) => set({ error }),
    }),
    {
      name: "convention-form-storage",
      version: 1, // Version du store pour gérer les migrations

      // ⭐ Utiliser IndexedDB RAW (sans createJSONStorage) pour supporter les Blobs
      storage: indexedDBStorage as unknown as PersistStorage<
        ConventionFormState & ConventionFormActions
      >,

      partialize: (state) =>
        ({
          formData: state.formData, // ✅ Maintenant inclut step3 avec Blobs (documents) natifs
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps), // Convertir Set en Array pour la sérialisation
          stepValidation: state.stepValidation,
          lastSaved: state.lastSaved,
          isEditMode: state.isEditMode,
          entityId: state.entityId,
          editOffline: state.editOffline,
        } as unknown as ConventionFormState & ConventionFormActions),

      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convertir l'array en Set lors de la réhydratation
          state.completedSteps = new Set(
            state.completedSteps as unknown as number[]
          );

          // Mettre à jour la configuration des étapes avec l'état de completion
          state.steps = stepsConfig.map((step) => ({
            ...step,
            isCompleted: state.completedSteps.has(step.id),
          }));
        }
      },
    }
  )
);
