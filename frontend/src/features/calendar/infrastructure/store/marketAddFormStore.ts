import { indexedDBStorage } from "@/lib/indexedDBStorage";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type {
  Step1Data,
  Step2Data,
} from "../../presentation/schemas/market-validation-schemas";

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
}

/**
 * Données du formulaire
 */
export interface MarketCalendarFormData {
  step1: Step1Data;
  step2: Step2Data;
}

/**
 * État du formulaire
 */
interface MarketCalendarFormState {
  formData: MarketCalendarFormData;
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
interface MarketCalendarFormActions {
  // Données
  updateStep1Data: (data: Partial<MarketCalendarFormData["step1"]>) => void;
  updateStep2Data: (data: Partial<MarketCalendarFormData["step2"]>) => void;

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
    name: "informations",
    path: "/calendars/market/create/informations",
    title: "Informations du marché",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "summary",
    path: "/calendars/market/create/summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
];

/**
 * Données par défaut
 */
const defaultFormData: MarketCalendarFormData = {
  step1: {
    opaId: "",
    startDate: "",
    endDate: "",
    locationCode: "",
    location: "",
    eventTime: "",
  },
  step2: {
    confirmed: false,
  },
};

/**
 * Valeurs par défaut garanties (utilisé comme fallback)
 */
const initialState: MarketCalendarFormState = {
  formData: defaultFormData,
  stepValidation: {
    step1: false,
    step2: false,
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
};

/**
 * Store Zustand pour le formulaire de création de calendrier MARCHE
 */
export const useMarketAddFormStore = create<
  MarketCalendarFormState & MarketCalendarFormActions
>()(
  persist(
    (set, get) => ({
      // État initial
      ...initialState,

      // Actions - Mise à jour des données
      updateStep1Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step1: { ...state.formData.step1, ...data },
          },
          hasUnsavedChanges: true,
        }));
      },

      updateStep2Data: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            step2: { ...state.formData.step2, ...data },
          },
          hasUnsavedChanges: true,
        }));
      },

      // Validation
      setStepValidation: (step, isValid) => {
        set((state) => ({
          stepValidation: {
            ...state.stepValidation,
            [step]: isValid,
          },
        }));
      },

      validateStep: (stepNumber) => {
        const state = get();
        const stepKey = `step${stepNumber}` as keyof StepValidation;
        return state.stepValidation[stepKey] || false;
      },

      // Navigation
      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        const { currentStep, steps } = get();
        const nextStep = currentStep + 1;
        if (nextStep <= steps.length) {
          set({ currentStep: nextStep });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        const prevStep = currentStep - 1;
        if (prevStep >= 1) {
          set({ currentStep: prevStep });
        }
      },

      goToStep: (step) => {
        const { canNavigateToStep } = get();
        if (canNavigateToStep(step)) {
          set({ currentStep: step });
        }
      },

      getNextStep: () => {
        const { currentStep, steps } = get();
        const nextStep = currentStep + 1;
        return nextStep <= steps.length ? nextStep : null;
      },

      getPreviousStep: () => {
        const { currentStep } = get();
        const prevStep = currentStep - 1;
        return prevStep >= 1 ? prevStep : null;
      },

      getStepConfig: (stepId) => {
        const { steps } = get();
        return steps.find((s) => s.id === stepId);
      },

      // Steps management
      markStepCompleted: (stepNumber) => {
        set((state) => ({
          completedSteps: new Set(state.completedSteps).add(stepNumber),
        }));
      },

      isStepAccessible: (stepNumber) => {
        const { completedSteps } = get();
        // L'étape 1 est toujours accessible
        if (stepNumber === 1) return true;
        // Les autres étapes nécessitent que l'étape précédente soit complétée
        return completedSteps.has(stepNumber - 1);
      },

      canNavigateToStep: (step) => {
        const { isStepAccessible } = get();
        return isStepAccessible(step);
      },

      // Save & Reset
      saveProgress: () => {
        set({
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        });
      },

      markAsSaved: () => {
        set({
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        });
      },

      resetForm: () => {
        set({
          formData: defaultFormData,
          stepValidation: {
            step1: false,
            step2: false,
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
        });
      },

      initializeForm: (entityId, editOffline) => {
        set({
          isEditMode: !!entityId,
          entityId,
          editOffline,
        });
      },

      // Mode édition
      setEditMode: (entityId, editOffline) => {
        set({
          isEditMode: !!entityId,
          entityId,
          editOffline: editOffline || false,
        });
      },

      // Submission
      setSubmitting: (submitting) => {
        set({ isSubmitting: submitting });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: "market-calendar-form-storage",
      version: 1, // Version du store pour gérer les migrations

      // ⭐ Utiliser IndexedDB RAW (sans createJSONStorage) pour supporter les Blobs
      storage: indexedDBStorage as unknown as PersistStorage<
        MarketCalendarFormState & MarketCalendarFormActions
      >,

      partialize: (state) =>
        ({
          formData: state.formData,
          completedSteps: Array.from(state.completedSteps),
          currentStep: state.currentStep,
          lastSaved: state.lastSaved,
          isEditMode: state.isEditMode,
          entityId: state.entityId,
          editOffline: state.editOffline,
        } as unknown as MarketCalendarFormState & MarketCalendarFormActions),

      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reconvertir l'array en Set
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
