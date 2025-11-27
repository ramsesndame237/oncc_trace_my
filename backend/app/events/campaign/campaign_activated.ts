import Campaign from '#models/campaign'

/**
 * Interface pour les données de l'événement d'activation de campagne
 */
export interface CampaignActivatedPayload {
  campaign: Campaign
  activatedBy: {
    id: string
    username: string
    fullName: string
  }
}
