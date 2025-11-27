import type {
  Step1ExporterInfoData,
  Step2ManagerInfoData,
  Step3BuyersData,
  Step4DocumentsData,
  Step5SummaryData,
} from "../presentation/schemas/exporter-validation-schemas";

// ===== TYPES POUR LE FORMULAIRE EXPORTATEUR =====

/**
 * Interface pour les données complètes du formulaire exportateur
 */
export interface ExporterFormData {
  step1: Step1ExporterInfoData;
  step2: Step2ManagerInfoData;
  step3: Step3BuyersData;
  step4: Step4DocumentsData;
  step5: Step5SummaryData;
}

/**
 * Interface pour la validation de chaque étape
 */
export interface StepValidation {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  step5: boolean;
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
 * Interface du store pour le formulaire exportateur multi-pages
 */
export interface ExporterFormStore {
  // Données du formulaire par étape
  formData: ExporterFormData;

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
  updateStep1Data: (data: Partial<Step1ExporterInfoData>) => void;
  updateStep2Data: (data: Partial<Step2ManagerInfoData>) => void;
  updateStep3Data: (data: Partial<Step3BuyersData>) => void;
  updateStep4Data: (data: Partial<Step4DocumentsData>) => void;
  updateStep5Data: (data: Partial<Step5SummaryData>) => void;

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
