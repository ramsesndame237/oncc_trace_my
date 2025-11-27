import { indexedDBStorage } from "@/lib/indexedDBStorage";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type {
  ProducersFormData,
  ProducersFormStore,
  StepConfig,
  StepValidation,
} from "../../domain/producers.types";
import type {
  Step1OPAInfoData,
  Step2ManagerInfoData,
  Step3MembersData,
  Step4DocumentsData,
  Step5SummaryData,
} from "../../presentation/schemas/producers-validation-schemas";

/**
 * Données par défaut pour chaque étape
 */
const defaultFormData: ProducersFormData = {
  step1: {
    hasExistenceDeclaration: false,
    metadata: {
      headquartersAddress: "",
      creationDate: "",
      cobgetReference: "",
    },
  } as Step1OPAInfoData,
  step2: {} as Step2ManagerInfoData,
  step3: { selectedProducerIds: [] } as Step3MembersData,
  step4: {} as Step4DocumentsData,
  step5: { confirmed: false } as Step5SummaryData,
};

/**
 * Validation par défaut pour chaque étape
 */
const defaultStepValidation: StepValidation = {
  step1: false,
  step2: false,
  step3: false,
  step4: false,
  step5: false,
};

/**
 * Configuration des étapes
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: "info",
    path: "/actors/producers/create",
    title: "Informations OPA",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "manager",
    path: "/actors/producers/create/manager",
    title: "Gestionnaire",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: "members",
    path: "/actors/producers/create/step-3-members",
    title: "Producteurs Membres",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 4,
    name: "documents",
    path: "/actors/producers/create/step-4-documents",
    title: "Documents",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 5,
    name: "summary",
    path: "/actors/producers/create/step-5-summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
];

/**
 * Store Zustand pour le formulaire OPA multi-pages
 * Avec persistance locale pour préserver les données entre les sessions
 */
export const useProducersFormStore = create<ProducersFormStore>()(
  persist(
    (set, get) => ({
      // État initial
      formData: defaultFormData,
      stepValidation: defaultStepValidation,
      completedSteps: new Set<number>(),
      currentStep: 1,
      steps: stepsConfig,
      isEditMode: false,
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

      updateStep4Data: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step4: { ...state.formData.step4, ...data },
          },
          hasUnsavedChanges: true,
        })),

      updateStep5Data: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            step5: { ...state.formData.step5, ...data },
          },
          hasUnsavedChanges: true,
        })),

      // Actions pour gérer la validation
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

      // Actions pour la persistance
      saveProgress: () =>
        set(() => ({
          lastSaved: new Date(),
        })),

      resetForm: () => {
        set(() => ({
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
        }));
      },

      initializeForm: (entityId, editOffline) => {
        set(() => ({
          isEditMode: Boolean(entityId),
          entityId,
          editOffline,
          currentStep: 1,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        }));
      },

      // Utilitaires
      getStepConfig: (step) => {
        const state = get();
        return state.steps.find((s) => s.id === step);
      },

      getStepProgress: () => {
        const state = get();
        const completedCount = state.completedSteps.size;
        const totalSteps = state.steps.length;
        return Math.round((completedCount / totalSteps) * 100);
      },

      isFormValid: () => {
        const state = get();
        // Le formulaire est valide si toutes les étapes obligatoires sont validées
        return (
          state.stepValidation.step1 &&
          state.stepValidation.step2 &&
          state.stepValidation.step3 &&
          state.stepValidation.step4 &&
          state.stepValidation.step5
        );
      },
    }),
    {
      name: "producers-form-storage",
      version: 2, // Version du store pour gérer les migrations

      // ⭐ Utiliser IndexedDB RAW (sans createJSONStorage) pour supporter les Blobs
      storage: indexedDBStorage as unknown as PersistStorage<ProducersFormStore>,

      partialize: (state) =>
        ({
          formData: state.formData, // ✅ Maintenant inclut step3 avec Blobs natifs
          completedSteps: Array.from(state.completedSteps), // Convertir Set en Array pour la sérialisation
          currentStep: state.currentStep,
          isEditMode: state.isEditMode,
          entityId: state.entityId,
          editOffline: state.editOffline,
          lastSaved: state.lastSaved,
        } as unknown as ProducersFormStore),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reconvertir Array en Set après désérialisation
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
