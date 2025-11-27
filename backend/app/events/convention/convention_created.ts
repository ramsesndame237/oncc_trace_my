/**
 * Événement: Convention créée
 */
export interface ConventionCreatedPayload {
  convention: {
    id: string
    code: string
    signatureDate: string
    products: Array<{
      code: string
      name: string
      quantity: number
      unit: string
    }>
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
  createdBy: {
    id: string
    fullName: string
    actorId?: string | null
  }
}
