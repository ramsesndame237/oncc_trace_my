/**
 * Événement: Convention dissociée d'une campagne
 */
export interface ConventionDissociatedFromCampaignPayload {
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
  dissociatedBy: {
    id: string
    fullName: string
  }
}
