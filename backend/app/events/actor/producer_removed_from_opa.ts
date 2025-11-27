/**
 * Événement: Notification de retrait de producteur d'une OPA
 */
export interface ProducerRemovedFromOpaPayload {
  opaId: string
  opaName: string
  producerId: string
  producerName: string
}
