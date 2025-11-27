export const CAMPAIGN_STATUSES = ['active', 'inactive'] as const

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]
