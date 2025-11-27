import type {
  Step1BuyerInfoData,
  Step2DocumentsData,
  Step3SummaryData,
} from "../presentation/schemas/buyer-validation-schemas";

// ===== TYPES POUR LE FORMULAIRE ACHETEUR =====

/**
 * Interface pour les données complètes du formulaire acheteur
 */
export interface BuyerFormData {
  step1: Step1BuyerInfoData;
  step2: Step2DocumentsData;
  step3: Step3SummaryData;
}

/**
 * Interface pour la validation de chaque étape
 */
export interface StepValidation {
  step1: boolean;
  step2: boolean;
  step3: boolean;
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
 * Interface du store pour le formulaire acheteur multi-pages
 */
export interface BuyerFormStore {
  // Données du formulaire par étape
  formData: BuyerFormData;

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
  updateStep1Data: (data: Partial<Step1BuyerInfoData>) => void;
  updateStep2Data: (data: Partial<Step2DocumentsData>) => void;
  updateStep3Data: (data: Partial<Step3SummaryData>) => void;

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
