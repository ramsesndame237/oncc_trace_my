import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useConventionFormStore } from "../../infrastructure/store/conventionFormStore";

/**
 * Hook personnalisé pour gérer la navigation dans le formulaire de création de convention multi-pages
 */
export function useConventionFormNavigation() {
  const router = useRouter();
  const {
    currentStep,
    getNextStep,
    getPreviousStep,
    markStepCompleted,
    steps,
    saveProgress,
    editOffline,
    entityId,
    resetForm,
  } = useConventionFormStore();

  /**
   * Navigue vers l'étape suivante
   * Gère automatiquement les paramètres editOffline et entityId dans l'URL
   */
  const navigateToNext = useCallback(() => {
    const nextStep = getNextStep();

    if (nextStep) {
      markStepCompleted(currentStep);
      saveProgress();
      const nextStepConfig = steps.find((s) => s.id === nextStep);
      if (nextStepConfig) {
        const currentPath =
          editOffline && entityId
            ? `${nextStepConfig.path}?entityId=${entityId}&editOffline=true`
            : nextStepConfig.path;
        router.push(currentPath);
      }
    }
  }, [currentStep, getNextStep, markStepCompleted, steps, saveProgress, editOffline, entityId, router]);

  /**
   * Navigue vers l'étape précédente
   * Gère automatiquement les paramètres editOffline et entityId dans l'URL
   */
  const navigateToPrevious = useCallback(() => {
    const previousStep = getPreviousStep();

    if (previousStep) {
      const previousStepConfig = steps.find((s) => s.id === previousStep);
      if (previousStepConfig) {
        const currentPath =
          editOffline && entityId
            ? `${previousStepConfig.path}?entityId=${entityId}&editOffline=true`
            : previousStepConfig.path;
        router.push(currentPath);
      }
    }
  }, [getPreviousStep, steps, editOffline, entityId, router]);

  /**
   * Annule le formulaire et retourne à la page appropriée
   * - Si editOffline: retourne à l'outbox (sans réinitialiser le formulaire)
   * - Sinon: réinitialise le formulaire et retourne à la liste des conventions
   */
  const handleCancel = useCallback(() => {
    if (editOffline) {
      router.push("/outbox");
    } else {
      // En mode création: réinitialiser le formulaire avant de quitter
      resetForm();
      router.push("/conventions");
    }
  }, [router, editOffline, resetForm]);

  /**
   * Finalise le formulaire (après l'étape finale)
   * - Si editOffline: retourne à l'outbox
   * - Sinon: retourne à la liste des conventions
   */
  const handleFinish = useCallback(() => {
    markStepCompleted(4); // Étape 4 est la dernière pour les conventions
    saveProgress();
    if (editOffline) {
      router.replace("/outbox");
    } else {
      router.replace("/conventions");
    }
  }, [markStepCompleted, saveProgress, router, editOffline]);

  return {
    navigateToNext,
    navigateToPrevious,
    handleCancel,
    handleFinish,
  };
}
