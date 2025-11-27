/**
 * Événement émis lorsqu'un transfert de type GROUPAGE est annulé
 * Cet événement déclenche l'envoi d'email de notification à l'OPA récepteur
 */
export interface GroupageTransferCancelledPayload {
  transferId: string
  transferCode: string
  transferDate: string // Format: YYYY-MM-DD
  senderActorId: string
  senderActorName: string
  receiverActorId: string
  receiverActorName: string
  receiverStoreId: string
  receiverStoreName: string
  campaignId: string
  campaignCode: string
  products: Array<{
    productType: string
    quantity: number
    unit: string
  }>
  cancellationReason?: string
}
