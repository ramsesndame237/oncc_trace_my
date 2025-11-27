import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { usePurchaseAddFormStore } from '../../infrastructure/store/purchaseAddFormStore'

/**
 * Hook personnalisé pour gérer la navigation dans le formulaire d'ajout d'achat multi-pages
 */
export function usePurchaseAddFormNavigation() {
  const router = useRouter()
  const {
    setCurrentStep,
    markStepCompleted,
    getNextStep,
    getPreviousStep,
    getStepConfig,
    saveProgress,
    hasUnsavedChanges,
    resetForm,
  } = usePurchaseAddFormStore()

  /**
   * Navigue vers l'étape suivante
   */
  const navigateToNext = useCallback(
    (currentStepId: number, editOffline?: boolean, entityId?: string, returnTo?: string) => {
      markStepCompleted(currentStepId)
      saveProgress()

      const nextStep = getNextStep()
      if (nextStep) {
        const stepConfig = getStepConfig(nextStep)
        if (stepConfig) {
          setCurrentStep(nextStep)

          // Construire l'URL avec les paramètres si en mode offline
          let url = stepConfig.path
          if (editOffline && entityId) {
            url = `${stepConfig.path}?entityId=${entityId}&editOffline=true`
          }
          // Ajouter returnTo pour garder le contexte
          if (returnTo) {
            const separator = url.includes('?') ? '&' : '?'
            url = `${url}${separator}returnTo=${encodeURIComponent(returnTo)}`
          }

          router.push(url)
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
  )

  /**
   * Navigue vers l'étape précédente
   * @param returnTo - URL de retour optionnelle pour quitter le formulaire
   */
  const navigateToPrevious = useCallback(
    (editOffline?: boolean, entityId?: string, returnTo?: string) => {
      const previousStep = getPreviousStep()
      if (previousStep) {
        const stepConfig = getStepConfig(previousStep)
        if (stepConfig) {
          setCurrentStep(previousStep)

          // Construire l'URL avec les paramètres si en mode offline
          let url = stepConfig.path
          if (editOffline && entityId) {
            url = `${stepConfig.path}?entityId=${entityId}&editOffline=true`
          }
          // Ajouter returnTo pour garder le contexte
          if (returnTo) {
            const separator = url.includes('?') ? '&' : '?'
            url = `${url}${separator}returnTo=${encodeURIComponent(returnTo)}`
          }

          router.push(url)
        }
      } else if (returnTo) {
        // Si pas d'étape précédente et returnTo est défini, retourner vers returnTo
        resetForm()
        router.replace(returnTo)
      }
    },
    [getPreviousStep, getStepConfig, setCurrentStep, router, resetForm]
  )

  /**
   * Navigue vers une étape spécifique
   */
  const navigateToStep = useCallback(
    (stepId: number) => {
      const stepConfig = getStepConfig(stepId)
      if (stepConfig) {
        setCurrentStep(stepId)
        router.push(stepConfig.path)
      }
    },
    [getStepConfig, setCurrentStep, router]
  )

  /**
   * Annule le formulaire et retourne à la page des transactions ou returnTo
   * @param returnTo - URL de retour optionnelle
   */
  const handleCancel = useCallback(
    (returnTo?: string) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?'
        )
        if (!confirmLeave) return
      }
      resetForm()
      router.replace(returnTo || '/transactions')
    },
    [router, hasUnsavedChanges, resetForm]
  )

  /**
   * Finalise le formulaire (après l'étape finale)
   * @param editOffline - Si true, redirige vers /outbox
   */
  const handleFinish = useCallback(
    (editOffline?: boolean) => {
      markStepCompleted(4)
      saveProgress()
      // Rediriger vers /outbox si editOffline, sinon vers la liste des transactions
      if (editOffline) {
        router.replace('/outbox')
      } else {
        router.replace('/transactions')
      }
    },
    [markStepCompleted, saveProgress, router]
  )

  return {
    navigateToNext,
    navigateToPrevious,
    navigateToStep,
    handleCancel,
    handleFinish,
  }
}
