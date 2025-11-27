import { indexedDBStorage } from "@/lib/indexedDBStorage";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type { Step2ParcelInfoData } from "../../presentation/schemas/producer-validation-schemas";

/**
 * Types pour le formulaire d'ajout de producteur
 */
export interface ProducerAddFormData {
  step1: {
    selectedProducerId: string | null;
  };
  step2: Step2ParcelInfoData;
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

export interface ProducerAddFormStore {
  // État
  formData: ProducerAddFormData;
  stepValidation: StepValidation;
  completedSteps: Set<number>;
  currentStep: number;
  steps: StepConfig[];
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Actions pour mettre à jour les données
  updateStep1Data: (data: Partial<ProducerAddFormData["step1"]>) => void;
  updateStep2Data: (data: Partial<ProducerAddFormData["step2"]>) => void;
  updateStep3Data: (data: Partial<ProducerAddFormData["step3"]>) => void;

  // Actions de validation
  setStepValidation: (step: keyof StepValidation, isValid: boolean) => void;

  // Actions pour gérer le mode édition
  setEditMode: (entityId?: string, editOffline?: boolean) => void;

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
  initializeForm: (entityId?: string, editOffline?: boolean) => void;
  // Mode édition
  isEditMode: boolean;
  entityId?: string;
  editOffline?: boolean;
}

/**
 * Données par défaut pour chaque étape
 */
const defaultFormData: ProducerAddFormData = {
  step1: {
    selectedProducerId: null,
  },
  step2: { parcels: [] },
  step3: { confirmed: false },
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
    name: "selection",
    path: "/actors/producer/add",
    title: "Sélection du producteur",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "parcels",
    path: "/actors/producer/add/parcels",
    title: "Parcelles",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: "summary",
    path: "/actors/producer/add/summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
];

/**
 * Store Zustand pour le formulaire d'ajout de producteur multi-pages
 * Avec persistance locale pour préserver les données entre les sessions
 */
export const useProducerAddFormStore = create<ProducerAddFormStore>()(
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

      // Actions pour gérer le mode édition
      setEditMode: (entityId, editOffline) =>
        set(() => ({
          isEditMode: Boolean(entityId),
          entityId,
          editOffline,
        })),

      // Utilitaires
      getStepConfig: (step) => {
        const state = get();
        return state.steps.find((s) => s.id === step);
      },

      // Actions de persistance
      saveProgress: () =>
        set({
          lastSaved: new Date(),
        }),

      resetForm: () => {
        set({
          formData: defaultFormData,
          stepValidation: defaultStepValidation,
          completedSteps: new Set<number>(),
          currentStep: 1,
          steps: stepsConfig.map((s) => ({ ...s, isCompleted: false })),
          isEditMode: false,
          entityId: undefined,
          editOffline: undefined,
          lastSaved: null,
          hasUnsavedChanges: false,
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
    }),
    {
      name: "producer-add-form-storage",
      version: 3, // Version du store pour gérer les migrations

      // ⭐ Utiliser IndexedDB RAW (sans createJSONStorage) pour supporter les Blobs
      storage: indexedDBStorage as unknown as PersistStorage<ProducerAddFormStore>,

      partialize: (state) =>
        ({
          formData: state.formData, // ✅ Maintenant inclut step2 avec Blobs natifs
          completedSteps: Array.from(state.completedSteps), // Convertir Set en Array pour la sérialisation
          currentStep: state.currentStep,
          isEditMode: state.isEditMode,
          entityId: state.entityId,
          editOffline: state.editOffline,
          lastSaved: state.lastSaved,
        } as unknown as ProducerAddFormStore),
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
