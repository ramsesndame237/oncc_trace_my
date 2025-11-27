/**
 * Événement: Notification pour l'acheteur mandataire qu'il a été affecté à un exportateur
 * Pour notifier les utilisateurs de l'acheteur mandataire
 */
export interface BuyerAssignedAsMandatairePayload {
  buyerId: string
  buyerName: string
  exporterId: string
  exporterName: string
}
