import { indexedDBStorage } from "@/lib/indexedDBStorage";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

/**
 * Types pour le formulaire de gestion des producteurs d'une OPA
 */
export interface OPAManageFormData {
  step1: {
    selectedOPAId: string | null;
  };
  step2: {
    selectedProducerIds: string[];
  };
  step3: {
    confirmed: boolean;
  };
}

export interface StepValidation {
  step1: boolean;
  step2: boolean;
  step3: boolean;
}

export interface StepConfig {
  id: number;
  name: string;
  path: string;
  title: string;
  isOptional: boolean;
  isCompleted: boolean;
}

export interface OPAManageFormStore {
  // État
  formData: OPAManageFormData;
  stepValidation: StepValidation;
  completedSteps: Set<number>;
  currentStep: number;
  steps: StepConfig[];
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Actions pour mettre à jour les données
  updateStep1Data: (data: Partial<OPAManageFormData["step1"]>) => void;
  updateStep2Data: (data: Partial<OPAManageFormData["step2"]>) => void;
  updateStep3Data: (data: Partial<OPAManageFormData["step3"]>) => void;

  // Actions de validation
  setStepValidation: (step: keyof StepValidation, isValid: boolean) => void;

  // Actions de navigation
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
  getNextStep: () => number | null;
  getPreviousStep: () => number | null;
  getStepConfig: (stepId: number) => StepConfig | undefined;

  // Actions de persistance
  saveProgress: () => void;
  resetForm: () => void;
}

/**
 * Données par défaut pour chaque étape
 */
const defaultFormData: OPAManageFormData = {
  step1: {
    selectedOPAId: null,
  },
  step2: {
    selectedProducerIds: [],
  },
  step3: {
    confirmed: false,
  },
};

/**
 * Validation par défaut pour chaque étape
 */
const defaultStepValidation: StepValidation = {
  step1: false,
  step2: false,
  step3: false,
};

/**
 * Configuration des étapes
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: "select-opa",
    path: "/actors/producers/manage/select-opa",
    title: "Sélection de l'OPA",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "producers",
    path: "/actors/producers/manage/producers",
    title: "Gestion des producteurs",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: "summary",
    path: "/actors/producers/manage/summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
];

/**
 * Store Zustand pour le formulaire de gestion des producteurs d'une OPA
 * Avec persistance locale pour préserver les données entre les sessions
 */
export const useOPAManageFormStore = create<OPAManageFormStore>()(
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

      // Actions pour mettre à jour les données
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

      // Actions de validation
      setStepValidation: (step, isValid) =>
        set((state) => ({
          stepValidation: {
            ...state.stepValidation,
            [`step${step}`]: isValid,
          },
        })),

      // Actions pour gérer la navigation
      setCurrentStep: (step) =>
        set(() => ({
          currentStep: step,
        })),

      markStepCompleted: (step) =>
        set((state) => {
          const newCompletedSteps = new Set(state.completedSteps);
          newCompletedSteps.add(step);

          // Mettre à jour la configuration des étapes
          const updatedSteps = state.steps.map((s) =>
            s.id === step ? { ...s, isCompleted: true } : s
          );

          return {
            completedSteps: newCompletedSteps,
            steps: updatedSteps,
          };
        }),

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

      // Utilitaires
      getStepConfig: (step) => {
        const state = get();
        return state.steps.find((s) => s.id === step);
      },

      // Actions de persistance
      saveProgress: () =>
        set({
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        }),

      resetForm: () => {
        set({
          formData: defaultFormData,
          stepValidation: defaultStepValidation,
          completedSteps: new Set<number>(),
          currentStep: 1,
          steps: stepsConfig.map((s) => ({ ...s, isCompleted: false })),
          lastSaved: null,
          hasUnsavedChanges: false,
        });
      },
    }),
    {
      name: "opa-manage-form-storage",
      version: 1,

      // Utiliser IndexedDB pour la persistance
      storage: indexedDBStorage as unknown as PersistStorage<OPAManageFormStore>,

      partialize: (state) =>
        ({
          formData: state.formData,
          completedSteps: Array.from(state.completedSteps), // Convertir Set en Array pour la sérialisation
          currentStep: state.currentStep,
          lastSaved: state.lastSaved,
        } as unknown as OPAManageFormStore),

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
