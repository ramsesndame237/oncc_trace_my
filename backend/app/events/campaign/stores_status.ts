/**
 * Événement: Statut des magasins lors de l'activation d'une campagne
 */
export interface StoresStatusPayload {
  campaign: {
    id: string
    code: string
    startDate: string
    endDate: string
  }
  totalStores: number
  activeStores: number
  inactiveStores: number
  activatedBy: {
    id: string
    fullName: string
  }
}
