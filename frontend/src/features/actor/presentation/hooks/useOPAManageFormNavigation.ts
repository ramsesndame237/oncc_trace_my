import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useOPAManageFormStore } from "../../infrastructure/store/opaManageFormStore";

/**
 * Hook personnalisé pour gérer la navigation dans le formulaire de gestion des producteurs d'une OPA
 */
export function useOPAManageFormNavigation() {
  const router = useRouter();
  const {
    formData,
    setCurrentStep,
    markStepCompleted,
    getNextStep,
    getPreviousStep,
    getStepConfig,
    saveProgress,
    resetForm,
  } = useOPAManageFormStore();

  /**
   * Navigue vers l'étape suivante
   */
  const navigateToNext = useCallback(
    (currentStepId: number) => {
      markStepCompleted(currentStepId);
      saveProgress();

      const nextStep = getNextStep();
      if (nextStep) {
        const stepConfig = getStepConfig(nextStep);
        if (stepConfig) {
          setCurrentStep(nextStep);
          router.push(stepConfig.path);
        }
      }
    },
    [
      markStepCompleted,
      saveProgress,
      getNextStep,
      getStepConfig,
      setCurrentStep,
      router,
    ]
  );

  /**
   * Navigue vers l'étape précédente
   */
  const navigateToPrevious = useCallback(() => {
    const previousStep = getPreviousStep();
    if (previousStep) {
      const stepConfig = getStepConfig(previousStep);
      if (stepConfig) {
        setCurrentStep(previousStep);
        router.push(stepConfig.path);
      }
    }
  }, [getPreviousStep, getStepConfig, setCurrentStep, router]);

  /**
   * Navigue vers une étape spécifique
   */
  const navigateToStep = useCallback(
    (stepId: number) => {
      const stepConfig = getStepConfig(stepId);
      if (stepConfig) {
        setCurrentStep(stepId);
        router.push(stepConfig.path);
      }
    },
    [getStepConfig, setCurrentStep, router]
  );

  /**
   * Annule le formulaire et retourne à la liste des OPAs
   */
  const handleCancel = useCallback(() => {
    // Vérifier si des données ont été saisies dans le formulaire
    const hasData =
      formData.step1.selectedOPAId !== null ||
      formData.step2.selectedProducerIds.length > 0;

    if (hasData) {
      const confirmLeave = window.confirm(
        "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?"
      );
      if (!confirmLeave) return;
    }
    resetForm();
    router.replace("/actors/producers");
  }, [router, formData, resetForm]);

  /**
   * Finalise le formulaire (après l'étape finale)
   */
  const handleFinish = useCallback(() => {
    markStepCompleted(3);
    saveProgress();
    resetForm();
    // Rediriger vers la liste des OPAs
    router.replace("/actors/producers");
  }, [markStepCompleted, saveProgress, resetForm, router]);

  return {
    navigateToNext,
    navigateToPrevious,
    navigateToStep,
    handleCancel,
    handleFinish,
  };
}
