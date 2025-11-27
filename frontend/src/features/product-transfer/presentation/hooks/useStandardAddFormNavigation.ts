import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { useStandardAddFormStore } from "../../infrastructure/store/standardAddFormStore"

/**
 * Hook personnalisé pour gérer la navigation dans le formulaire de création de transfert STANDARD
 */
export function useStandardAddFormNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    currentStep,
    markStepCompleted,
    getNextStep,
    getPreviousStep,
    getStepConfig,
    saveProgress,
    resetForm,
    entityId,
    editOffline,
  } = useStandardAddFormStore()

  /**
   * Navigue vers l'étape suivante
   */
  const navigateToNext = useCallback(() => {
    const nextStep = getNextStep()
    if (!nextStep) return

    // Marquer l'étape actuelle comme complétée
    markStepCompleted(currentStep)
    saveProgress()

    // Construire le chemin avec les paramètres si en mode édition
    const nextStepConfig = getStepConfig(nextStep)
    if (!nextStepConfig) return

    let path = nextStepConfig.path

    // Ajouter les paramètres pour le mode édition offline
    if (editOffline && entityId) {
      path = `${path}?entityId=${entityId}&editOffline=true`
    }

    router.push(path)
  }, [
    currentStep,
    getNextStep,
    getStepConfig,
    markStepCompleted,
    saveProgress,
    router,
    entityId,
    editOffline,
  ])

  /**
   * Navigue vers l'étape précédente
   */
  const navigateToPrevious = useCallback(() => {
    const previousStep = getPreviousStep()
    if (!previousStep) return

    saveProgress()

    const previousStepConfig = getStepConfig(previousStep)
    if (!previousStepConfig) return

    let path = previousStepConfig.path

    // Ajouter les paramètres pour le mode édition offline
    if (editOffline && entityId) {
      path = `${path}?entityId=${entityId}&editOffline=true`
    }

    router.push(path)
  }, [
    getPreviousStep,
    getStepConfig,
    saveProgress,
    router,
    entityId,
    editOffline,
  ])

  /**
   * Annule le formulaire et retourne à la liste
   */
  const handleCancel = useCallback(() => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir annuler ? Toutes les données non enregistrées seront perdues."
      )
    ) {
      resetForm()
      router.push("/product-transfers")
    }
  }, [resetForm, router])

  /**
   * Finalise le formulaire après la soumission
   */
  const handleFinish = useCallback(() => {
    resetForm()
    // Si en mode editOffline, retourner à la outbox, sinon à la liste des transferts
    if (editOffline) {
      router.push("/outbox")
    } else {
      router.push("/product-transfers")
    }
  }, [resetForm, router, editOffline])

  /**
   * Récupère les paramètres d'URL pour le mode édition
   */
  const getEditParams = useCallback(() => {
    const entityIdParam = searchParams.get("entityId")
    const editOfflineParam = searchParams.get("editOffline")

    return {
      entityId: entityIdParam || undefined,
      editOffline: editOfflineParam === "true",
    }
  }, [searchParams])

  return {
    navigateToNext,
    navigateToPrevious,
    handleCancel,
    handleFinish,
    getEditParams,
    currentStep,
  }
}
