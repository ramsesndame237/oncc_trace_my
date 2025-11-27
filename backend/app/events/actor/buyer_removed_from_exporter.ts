/**
 * Événement: Notification de retrait d'acheteur mandataire d'un exportateur
 * Pour notifier les utilisateurs de l'exportateur
 */
export interface BuyerRemovedFromExporterPayload {
  exporterId: string
  exporterName: string
  buyerId: string
  buyerName: string
}
