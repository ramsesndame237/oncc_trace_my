/**
 * Codes d'erreur spécifiques aux campagnes
 */
export enum CampaignErrorCodes {
  CAMPAIGN_NOT_FOUND = 'CAMPAIGN_NOT_FOUND',
  CAMPAIGN_OVERLAP = 'CAMPAIGN_OVERLAP',
  CAMPAIGN_CREATION_FAILED = 'CAMPAIGN_CREATION_FAILED',
  CAMPAIGN_UPDATE_FAILED = 'CAMPAIGN_UPDATE_FAILED',
  CAMPAIGN_ACTIVATION_FAILED = 'CAMPAIGN_ACTIVATION_FAILED',
  CAMPAIGN_DEACTIVATION_FAILED = 'CAMPAIGN_DEACTIVATION_FAILED',
  CAMPAIGN_DEACTIVATION_NOT_ALLOWED = 'CAMPAIGN_DEACTIVATION_NOT_ALLOWED',
  CAMPAIGN_LIST_FAILED = 'CAMPAIGN_LIST_FAILED',
  CAMPAIGN_COUNT_FAILED = 'CAMPAIGN_COUNT_FAILED',
  CAMPAIGN_NOT_AUTHORIZED = 'CAMPAIGN_NOT_AUTHORIZED',
  CAMPAIGN_NO_ACTIVE = 'CAMPAIGN_NO_ACTIVE',
  CAMPAIGN_SYNC_CHECK_FAILED = 'CAMPAIGN_SYNC_CHECK_FAILED',
}

/**
 * Messages d'erreur en français pour les campagnes
 */
export const CampaignErrorMessages: Record<CampaignErrorCodes, string> = {
  [CampaignErrorCodes.CAMPAIGN_NOT_FOUND]: 'La campagne est introuvable.',
  [CampaignErrorCodes.CAMPAIGN_OVERLAP]:
    'Les dates de la campagne se chevauchent avec une campagne existante.',
  [CampaignErrorCodes.CAMPAIGN_CREATION_FAILED]: 'Échec de la création de la campagne.',
  [CampaignErrorCodes.CAMPAIGN_UPDATE_FAILED]: 'Échec de la mise à jour de la campagne.',
  [CampaignErrorCodes.CAMPAIGN_ACTIVATION_FAILED]: "Échec de l'activation de la campagne.",
  [CampaignErrorCodes.CAMPAIGN_DEACTIVATION_FAILED]: 'Échec de la désactivation de la campagne.',
  [CampaignErrorCodes.CAMPAIGN_DEACTIVATION_NOT_ALLOWED]:
    'Vous ne pouvez pas désactiver cette campagne car elle est la seule campagne présente dans le système.',
  [CampaignErrorCodes.CAMPAIGN_LIST_FAILED]: 'Échec de la récupération de la liste des campagnes.',
  [CampaignErrorCodes.CAMPAIGN_COUNT_FAILED]: 'Échec du comptage des campagnes.',
  [CampaignErrorCodes.CAMPAIGN_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à effectuer cette action.",
  [CampaignErrorCodes.CAMPAIGN_NO_ACTIVE]: "Aucune campagne active n'est disponible.",
  [CampaignErrorCodes.CAMPAIGN_SYNC_CHECK_FAILED]:
    'Échec de la vérification de synchronisation des campagnes.',
}

/**
 * Codes de succès spécifiques aux campagnes
 */
export enum CampaignSuccessCodes {
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED = 'CAMPAIGN_UPDATED',
  CAMPAIGN_ACTIVATED = 'CAMPAIGN_ACTIVATED',
  CAMPAIGN_DEACTIVATED = 'CAMPAIGN_DEACTIVATED',
  CAMPAIGN_LIST_SUCCESS = 'CAMPAIGN_LIST_SUCCESS',
  CAMPAIGN_FETCH_SUCCESS = 'CAMPAIGN_FETCH_SUCCESS',
  CAMPAIGN_COUNT_SUCCESS = 'CAMPAIGN_COUNT_SUCCESS',
  CAMPAIGN_SYNC_CHECK_SUCCESS = 'CAMPAIGN_SYNC_CHECK_SUCCESS',
}

/**
 * Messages de succès en français pour les campagnes
 */
export const CampaignSuccessMessages: Record<CampaignSuccessCodes, string> = {
  [CampaignSuccessCodes.CAMPAIGN_CREATED]: 'Campagne créée avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_UPDATED]: 'Campagne mise à jour avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_ACTIVATED]: 'Campagne activée avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_DEACTIVATED]: 'Campagne désactivée avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_LIST_SUCCESS]: 'Liste des campagnes récupérée avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_FETCH_SUCCESS]: 'Détails de la campagne récupérés avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_COUNT_SUCCESS]: 'Nombre de campagnes récupéré avec succès.',
  [CampaignSuccessCodes.CAMPAIGN_SYNC_CHECK_SUCCESS]:
    'Vérification de synchronisation des campagnes effectuée avec succès.',
}
