/**
 * Événement: Notification d'ajout de producteur à une OPA
 */
export interface ProducerAddedToOpaPayload {
  opaId: string
  opaName: string
  producerId: string
  producerName: string
}
