import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new campaign.
 */
export const createCampaignValidator = vine.compile(
  vine.object({
    startDate: vine.date(),
    endDate: vine.date(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing campaign.
 */
export const updateCampaignValidator = vine.compile(
  vine.object({
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
  })
)
