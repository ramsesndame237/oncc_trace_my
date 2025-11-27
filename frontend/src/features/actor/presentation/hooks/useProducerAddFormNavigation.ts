import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useProducerAddFormStore } from "../../infrastructure/store/producerAddFormStore";

/**
 * Hook personnalisé pour gérer la navigation dans le formulaire d'ajout de producteur multi-pages
 */
export function useProducerAddFormNavigation() {
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
  } = useProducerAddFormStore();

  /**
   * Navigue vers l'étape suivante
   */
  const navigateToNext = useCallback(
    (currentStepId: number, editOffline?: boolean, entityId?: string) => {
      markStepCompleted(currentStepId);
      saveProgress();

      const nextStep = getNextStep();
      if (nextStep) {
        const stepConfig = getStepConfig(nextStep);
        if (stepConfig) {
          setCurrentStep(nextStep);

          // Construire l'URL avec les paramètres si en mode offline
          let url = stepConfig.path;
          if (editOffline && entityId) {
            url = `${stepConfig.path}?entityId=${entityId}&editOffline=true`;
          }

          router.push(url);
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
    (editOffline?: boolean, entityId?: string) => {
      const previousStep = getPreviousStep();
      if (previousStep) {
        const stepConfig = getStepConfig(previousStep);
        if (stepConfig) {
          setCurrentStep(previousStep);

          // Construire l'URL avec les paramètres si en mode offline
          let url = stepConfig.path;
          if (editOffline && entityId) {
            url = `${stepConfig.path}?entityId=${entityId}&editOffline=true`;
          }

          router.push(url);
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
    markStepCompleted(3);
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
