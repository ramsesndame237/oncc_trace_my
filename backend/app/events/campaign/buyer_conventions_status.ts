/**
 * Événement: Statut des conventions d'un acheteur/exportateur lors de l'activation d'une campagne
 */
export interface BuyerConventionsStatusPayload {
  campaign: {
    id: string
    code: string
    startDate: string
    endDate: string
  }
  buyer: {
    id: string
    fullName: string
    actorType: string
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
