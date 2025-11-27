/**
 * Événement: Notification d'ajout d'acheteur mandataire à un exportateur
 * Pour notifier les utilisateurs de l'exportateur
 */
export interface BuyerAddedToExporterPayload {
  exporterId: string
  exporterName: string
  buyerId: string
  buyerName: string
}
