/**
 * Événement: Statut des conventions d'un OPA lors de l'activation d'une campagne
 */
export interface OpaConventionsStatusPayload {
  campaign: {
    id: string
    code: string
    startDate: string
    endDate: string
  }
  opa: {
    id: string
    fullName: string
  }
  conventionsData: {
    totalConventions: number
    activeConventions: number
    inactiveConventions: number
  }
  activatedBy: {
    id: string
    fullName: string
  }
}
