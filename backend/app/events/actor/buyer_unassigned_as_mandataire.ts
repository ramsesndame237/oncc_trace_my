/**
 * Événement: Notification pour l'acheteur mandataire qu'il a été retiré d'un exportateur
 * Pour notifier les utilisateurs de l'acheteur mandataire
 */
export interface BuyerUnassignedAsMandatairePayload {
  buyerId: string
  buyerName: string
  exporterId: string
  exporterName: string
}
