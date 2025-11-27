import { IFileValue } from "@/types/type";
import { indexedDBStorage } from "@/lib/indexedDBStorage";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type {
  ProducerFormData,
  ProducerFormStore,
  StepConfig,
  StepValidation,
} from "../../domain/producer.types";
import type {
  Step1ProducerInfoData,
  Step2ParcelInfoData,
  Step3DocumentsData,
} from "../../presentation/schemas/producer-validation-schemas";

/**
 * Données par défaut pour chaque étape
 */
const defaultFormData: ProducerFormData = {
  step1: {} as Step1ProducerInfoData,
  step2: { parcels: [] } as Step2ParcelInfoData,
  step3: {
    producerDocuments: [],
    landProofDocuments: [],
    complementaryDocuments: [],
  } as Step3DocumentsData,
  step4: { confirmed: false },
};

/**
 * Validation par défaut pour chaque étape
 */
const defaultStepValidation: StepValidation = {
  step1: false,
  step2: false, // Requise maintenant pour les parcelles
  step3: true, // Optionnelle
  step4: false,
};

/**
 * Configuration des étapes
 */
const stepsConfig: StepConfig[] = [
  {
    id: 1,
    name: "general",
    path: "/actors/producer/create",
    title: "Informations générales",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 2,
    name: "parcels",
    path: "/actors/producer/create/parcels",
    title: "Localisation de la plantation",
    isOptional: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: "documents",
    path: "/actors/producer/create/documents",
    title: "Documents",
    isOptional: true,
    isCompleted: false,
  },
  {
    id: 4,
    name: "summary",
    path: "/actors/producer/create/summary",
    title: "Récapitulatif",
    isOptional: false,
    isCompleted: false,
  },
];

/**
 * Store Zustand pour le formulaire producteur multi-pages
 * Avec persistance locale pour préserver les données entre les sessions
 */
export const useProducerFormStore = create<ProducerFormStore>()(
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
        // Effacer aussi la persistance locale
        localStorage.removeItem("producer-form-storage");

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
          state.stepValidation.step4
        );
      },
    }),
    {
      name: "producer-form-storage",
      version: 3, // ⭐ Version 3 : IndexedDB sans JSON.stringify pour supporter les Blobs

      // ⭐ Utiliser IndexedDB RAW (sans createJSONStorage) pour supporter les Blobs
      // createJSONStorage() appelle JSON.stringify() qui détruit les Blobs
      storage: indexedDBStorage as unknown as PersistStorage<ProducerFormStore>,

      partialize: (state) =>
        ({
          formData: state.formData, // ✅ Maintenant inclut step3 avec Blobs natifs
          completedSteps: Array.from(state.completedSteps), // Convertir Set en Array pour la sérialisation
          currentStep: state.currentStep,
          isEditMode: state.isEditMode,
          entityId: state.entityId,
          editOffline: state.editOffline,
          lastSaved: state.lastSaved,
        } as unknown as ProducerFormStore),
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

          // Migration v1: Nettoyer les documents avec des anciennes valeurs françaises
          if (state.formData?.step3) {
            const oldFrenchValues = [
              "photo_producteur",
              "carte_producteur",
              "rccm_producteur",
              "carte_identite_nationale",
              "carte_producteur_cacao",
              "certificat_conformite",
              "numero_enregistrement_cooperative",
              "certificat_production_biologique",
              "attestation_residence",
              "permis_exploitation_agricole",
              "recepisse_declaration_plantation",
              "registre_commercialisation",
              "contrat_cooperative",
              "permis_de_conduire",
              "certificat_propriete_fonciere",
              "acte_de_vente",
              "titre_foncier",
              "autorisation_occupation_temporaire",
              "certificat_non_opposition",
              "certificat_mutation",
              "plan_cadastral",
              "certificat_situation_juridique",
              "attestation_propriete_coutumiere",
            ];

            // Filtrer les documents qui contiennent des anciennes valeurs
            const cleanDocuments = (docs: IFileValue[] = []) =>
              docs.filter(
                (doc) =>
                  !oldFrenchValues.includes(doc.optionValues[1] as string)
              );

            state.formData.step3 = {
              producerDocuments: cleanDocuments(
                state.formData.step3.producerDocuments
              ),
              landProofDocuments: cleanDocuments(
                state.formData.step3.landProofDocuments
              ),
              complementaryDocuments: cleanDocuments(
                state.formData.step3.complementaryDocuments
              ),
            };
          }
        }
      },
    }
  )
);
