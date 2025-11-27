/**
 * Événement: Convention modifiée
 */
export interface ConventionUpdatedPayload {
  convention: {
    id: string
    code: string
    signatureDate: string
    products: Array<{
      code: string
      name: string
      quality: string
      standard: string
      weight: number
      bags: number
      pricePerKg: number
      humidity: number
    }>
  }
  changes: {
    signatureDateChanged: boolean
    productsChanged: boolean
    oldSignatureDate?: string
    newSignatureDate?: string
  }
  buyerExporter: {
    id: string
    fullName: string
    actorType: string
  }
  producers: {
    id: string
    fullName: string
  }
  updatedBy: {
    id: string
    fullName: string
  }
}
