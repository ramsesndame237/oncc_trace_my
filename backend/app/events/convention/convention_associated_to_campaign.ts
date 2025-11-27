/**
 * Événement: Convention associée à une campagne
 */
export interface ConventionAssociatedToCampaignPayload {
  convention: {
    id: string
    code: string
    signatureDate: string
  }
  campaign: {
    id: string
    code: string
    startDate: string
    endDate: string
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
  associatedBy: {
    id: string
    fullName: string
  }
}
