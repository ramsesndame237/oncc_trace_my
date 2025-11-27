/**
 * Événement: Notification de création d'un transfert de type GROUPAGE
 * Pour notifier :
 * - Les utilisateurs de l'OPA récepteur (receiver)
 */
export interface GroupageTransferCreatedPayload {
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
}
