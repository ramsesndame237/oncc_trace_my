import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useProducersFormStore } from "../../infrastructure/store/producersFormStore";

export function useProducersFormNavigation() {
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
  } = useProducersFormStore();

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

  const handleCancel = useCallback(() => {
    if (editOffline) {
      router.push("/outbox");
    } else {
      // En mode création: réinitialiser le formulaire avant de quitter et revenir à la page de choix
      resetForm();
      router.push("/actors/producers/choice");
    }
  }, [router, editOffline, resetForm]);

  const handleFinish = useCallback(() => {
    markStepCompleted(4);
    saveProgress();
    if (editOffline) {
      router.replace("/outbox");
    } else {
      router.replace("/actors/producers");
    }
  }, [markStepCompleted, saveProgress, router, editOffline]);

  return {
    navigateToNext,
    navigateToPrevious,
    handleCancel,
    handleFinish,
  };
}
