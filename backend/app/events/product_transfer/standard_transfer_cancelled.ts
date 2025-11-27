/**
 * Événement émis lorsqu'un transfert de type STANDARD est annulé
 * Cet événement déclenche l'envoi d'emails de notification au sender ET au receiver
 */
export interface StandardTransferCancelledPayload {
  transferId: string
  transferCode: string
  transferDate: string // Format: YYYY-MM-DD
  senderActorId: string
  senderActorName: string
  senderStoreId: string
  senderStoreName: string
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
  driverInfo?: {
    fullName: string
    vehicleRegistration: string
    drivingLicenseNumber: string
    routeSheetCode: string
  }
  cancellationReason?: string
}
