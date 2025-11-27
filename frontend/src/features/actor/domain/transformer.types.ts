import type {
  Step1TransformerInfoData,
  Step2ManagerInfoData,
  Step3DocumentsData,
  Step4SummaryData,
} from "../presentation/schemas/transformer-validation-schemas";

// ===== TYPES POUR LE FORMULAIRE TRANSFORMATEUR =====

/**
 * Interface pour les données complètes du formulaire transformateur
 */
export interface TransformerFormData {
  step1: Step1TransformerInfoData;
  step2: Step2ManagerInfoData;
  step3: Step3DocumentsData;
  step4: Step4SummaryData;
}

/**
 * Interface pour la validation de chaque étape
 */
export interface StepValidation {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
}

/**
 * Configuration des étapes du formulaire
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
 * Interface du store pour le formulaire transformateur multi-pages
 */
export interface TransformerFormStore {
  // Données du formulaire par étape
  formData: TransformerFormData;

  // État de validation par étape
  stepValidation: StepValidation;

  // Étapes complétées
  completedSteps: Set<number>;

  // Étape actuelle
  currentStep: number;

  // Configuration des étapes
  steps: StepConfig[];

  // Mode édition
  isEditMode: boolean;
  entityId?: string;
  editOffline?: boolean;

  // Auto-save
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Actions pour gérer les données
  updateStep1Data: (data: Partial<Step1TransformerInfoData>) => void;
  updateStep2Data: (data: Partial<Step2ManagerInfoData>) => void;
  updateStep3Data: (data: Partial<Step3DocumentsData>) => void;
  updateStep4Data: (data: Partial<Step4SummaryData>) => void;

  // Actions pour gérer la validation
  setStepValidation: (step: number, isValid: boolean) => void;

  // Actions pour gérer la navigation
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
  getNextStep: () => number | null;
  getPreviousStep: () => number | null;

  // Actions pour gérer le mode édition
  setEditMode: (entityId?: string, editOffline?: boolean) => void;

  // Actions pour la persistance
  saveProgress: () => void;
  resetForm: () => void;
  initializeForm: (entityId?: string, editOffline?: boolean) => void;

  // Utilitaires
  getStepConfig: (step: number) => StepConfig | undefined;
  getStepProgress: () => number;
  isFormValid: () => boolean;
}
