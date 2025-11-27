/**
 * Événement émis lorsqu'une transaction est annulée
 * Cet événement déclenche l'envoi d'emails de notification au créateur de la transaction
 * Inclut une invitation à créer la transaction inverse si aucune transaction complémentaire n'existe
 */
export interface TransactionCancelledPayload {
  transactionId: string
  transactionCode: string
  transactionType: 'SALE' | 'PURCHASE'
  transactionDate: string // Format: YYYY-MM-DD
  sellerId: string
  sellerName: string
  buyerId: string
  buyerName: string
  campaignId: string
  campaignCode: string
  locationType: 'MARKET' | 'CONVENTION' | 'OUTSIDE_MARKET'
  locationName?: string
  products: Array<{
    productType: string
    quality: string
    weight: number
    numberOfBags: number
    unitPrice: number
    totalPrice: number
  }>
  totalAmount: number
  cancellationReason?: string
  hasComplementaryTransaction: boolean // Indique si une transaction inverse existe déjà
}
