/**
 * Événement émis lorsqu'une transaction est validée (status = confirmed)
 * Cet événement déclenche l'envoi d'emails de notification au vendeur ET à l'acheteur
 * Inclut une demande de création de déclaration inverse selon le type de transaction
 */
export interface TransactionValidatedPayload {
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
}
