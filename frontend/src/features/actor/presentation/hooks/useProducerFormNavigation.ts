import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useProducerFormStore } from "../../infrastructure/store/producerFormStore";

/**
 * Hook personnalisé pour gérer la navigation dans le formulaire producteur multi-pages
 */
export function useProducerFormNavigation() {
  const router = useRouter();
  const {
    setCurrentStep,
    markStepCompleted,
    getNextStep,
    getPreviousStep,
    getStepConfig,
    saveProgress,
    hasUnsavedChanges,
    resetForm,
  } = useProducerFormStore();

  /**
   * Navigue vers l'étape suivante
   */
  const navigateToNext = useCallback(
    (currentStepId: number, isEditOffline?: boolean, entityId?: string) => {
      markStepCompleted(currentStepId);
      saveProgress();

      const nextStep = getNextStep();
      if (nextStep) {
        const stepConfig = getStepConfig(nextStep);
        if (stepConfig) {
          setCurrentStep(nextStep);
          const currentPath =
            isEditOffline && entityId
              ? `${stepConfig.path}?entityId=${entityId}&editOffline=true`
              : stepConfig.path;
          router.push(currentPath);
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
  const navigateToPrevious = useCallback(
    (isEditOffline?: boolean, entityId?: string) => {
      const previousStep = getPreviousStep();
      if (previousStep) {
        const stepConfig = getStepConfig(previousStep);
        if (stepConfig) {
          setCurrentStep(previousStep);
          const currentPath =
            isEditOffline && entityId
              ? `${stepConfig.path}?entityId=${entityId}&editOffline=true`
              : stepConfig.path;
          router.push(currentPath);
        }
      }
    },
    [getPreviousStep, getStepConfig, setCurrentStep, router]
  );

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
   * Annule le formulaire et retourne à la page précédente
   */
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?"
      );
      if (!confirmLeave) return;
    }
    resetForm();
    router.replace("/actors/producer");
  }, [router, hasUnsavedChanges, resetForm]);

  /**
   * Finalise le formulaire (après l'étape finale)
   */
  const handleFinish = useCallback(() => {
    markStepCompleted(4);
    saveProgress();
    // Rediriger vers la liste des producteurs ou page de succès
    router.replace("/actors/producer");
  }, [markStepCompleted, saveProgress, router]);

  return {
    navigateToNext,
    navigateToPrevious,
    navigateToStep,
    handleCancel,
    handleFinish,
  };
}
