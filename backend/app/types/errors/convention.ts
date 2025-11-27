/**
 * Codes d'erreur spécifiques aux conventions
 */
export enum ConventionErrorCodes {
  CONVENTION_NOT_FOUND = 'CONVENTION_NOT_FOUND',
  CONVENTION_BUYER_EXPORTER_NOT_FOUND = 'CONVENTION_BUYER_EXPORTER_NOT_FOUND',
  CONVENTION_INVALID_BUYER_EXPORTER_TYPE = 'CONVENTION_INVALID_BUYER_EXPORTER_TYPE',
  CONVENTION_OPA_NOT_FOUND = 'CONVENTION_OPA_NOT_FOUND',
  CONVENTION_INVALID_OPA_TYPE = 'CONVENTION_INVALID_OPA_TYPE',
  CONVENTION_BUYER_EXPORTER_NOT_ACTIVE = 'CONVENTION_BUYER_EXPORTER_NOT_ACTIVE',
  CONVENTION_OPA_NOT_ACTIVE = 'CONVENTION_OPA_NOT_ACTIVE',
  CONVENTION_NO_PRODUCTS = 'CONVENTION_NO_PRODUCTS',
  CONVENTION_CREATE_FAILED = 'CONVENTION_CREATE_FAILED',
  CONVENTION_UPDATE_FAILED = 'CONVENTION_UPDATE_FAILED',
  CONVENTION_STATUS_UPDATE_FAILED = 'CONVENTION_STATUS_UPDATE_FAILED',
  CONVENTION_STATUS_UPDATE_INVALID = 'CONVENTION_STATUS_UPDATE_INVALID',
  CONVENTION_STATUS_MISSING = 'CONVENTION_STATUS_MISSING',
  CONVENTION_DELETE_FAILED = 'CONVENTION_DELETE_FAILED',
  CONVENTION_LIST_FAILED = 'CONVENTION_LIST_FAILED',
  CONVENTION_SHOW_FAILED = 'CONVENTION_SHOW_FAILED',
  CONVENTION_CAMPAIGN_ASSOCIATE_FAILED = 'CONVENTION_CAMPAIGN_ASSOCIATE_FAILED',
  CONVENTION_CAMPAIGN_DISSOCIATE_FAILED = 'CONVENTION_CAMPAIGN_DISSOCIATE_FAILED',
  CONVENTION_CAMPAIGN_NOT_ASSOCIATED = 'CONVENTION_CAMPAIGN_NOT_ASSOCIATED',
  CONVENTION_CAMPAIGN_ID_MISSING = 'CONVENTION_CAMPAIGN_ID_MISSING',
  CONVENTION_ACTIVATE_TO_CAMPAIGN_FAILED = 'CONVENTION_ACTIVATE_TO_CAMPAIGN_FAILED',
  CONVENTION_NO_ACTIVE_CAMPAIGN = 'CONVENTION_NO_ACTIVE_CAMPAIGN',
  CONVENTION_NOT_AUTHORIZED = 'CONVENTION_NOT_AUTHORIZED',
  CONVENTION_SYNC_FAILED = 'CONVENTION_SYNC_FAILED',
}

/**
 * Messages d'erreur en français pour les conventions
 */
export const ConventionErrorMessages: Record<ConventionErrorCodes, string> = {
  [ConventionErrorCodes.CONVENTION_NOT_FOUND]: 'La convention est introuvable.',
  [ConventionErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_FOUND]:
    "L'acheteur/exportateur est introuvable.",
  [ConventionErrorCodes.CONVENTION_INVALID_BUYER_EXPORTER_TYPE]:
    "L'acteur sélectionné n'est pas un acheteur ou exportateur.",
  [ConventionErrorCodes.CONVENTION_OPA_NOT_FOUND]: "L'OPA est introuvable.",
  [ConventionErrorCodes.CONVENTION_INVALID_OPA_TYPE]:
    "L'acteur sélectionné n'est pas une OPA.",
  [ConventionErrorCodes.CONVENTION_BUYER_EXPORTER_NOT_ACTIVE]:
    "L'acheteur/exportateur sélectionné n'est pas actif.",
  [ConventionErrorCodes.CONVENTION_OPA_NOT_ACTIVE]: "L'OPA sélectionnée n'est pas active.",
  [ConventionErrorCodes.CONVENTION_NO_PRODUCTS]:
    'Au moins un produit doit être spécifié dans la convention.',
  [ConventionErrorCodes.CONVENTION_CREATE_FAILED]: 'Échec de la création de la convention.',
  [ConventionErrorCodes.CONVENTION_UPDATE_FAILED]: 'Échec de la mise à jour de la convention.',
  [ConventionErrorCodes.CONVENTION_STATUS_UPDATE_FAILED]:
    'Échec de la mise à jour du statut de la convention.',
  [ConventionErrorCodes.CONVENTION_STATUS_UPDATE_INVALID]:
    'La convention a déjà ce statut.',
  [ConventionErrorCodes.CONVENTION_STATUS_MISSING]: 'Le statut est requis.',
  [ConventionErrorCodes.CONVENTION_DELETE_FAILED]: 'Échec de la suppression de la convention.',
  [ConventionErrorCodes.CONVENTION_LIST_FAILED]:
    'Échec de la récupération de la liste des conventions.',
  [ConventionErrorCodes.CONVENTION_SHOW_FAILED]:
    'Échec de la récupération des détails de la convention.',
  [ConventionErrorCodes.CONVENTION_CAMPAIGN_ASSOCIATE_FAILED]:
    "Échec de l'association de la convention à la campagne.",
  [ConventionErrorCodes.CONVENTION_CAMPAIGN_DISSOCIATE_FAILED]:
    'Échec de la dissociation de la convention de la campagne.',
  [ConventionErrorCodes.CONVENTION_CAMPAIGN_NOT_ASSOCIATED]:
    "Cette convention n'est pas associée à cette campagne.",
  [ConventionErrorCodes.CONVENTION_CAMPAIGN_ID_MISSING]: "L'ID de la campagne est requis.",
  [ConventionErrorCodes.CONVENTION_ACTIVATE_TO_CAMPAIGN_FAILED]:
    "Échec de l'activation de la convention à la campagne active.",
  [ConventionErrorCodes.CONVENTION_NO_ACTIVE_CAMPAIGN]:
    "Aucune campagne active n'est disponible pour activer cette convention.",
  [ConventionErrorCodes.CONVENTION_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à effectuer cette action.",
  [ConventionErrorCodes.CONVENTION_SYNC_FAILED]:
    'Échec de la synchronisation des conventions.',
}

/**
 * Codes de succès spécifiques aux conventions
 */
export enum ConventionSuccessCodes {
  CONVENTION_CREATED = 'CONVENTION_CREATED',
  CONVENTION_UPDATED = 'CONVENTION_UPDATED',
  CONVENTION_STATUS_UPDATED = 'CONVENTION_STATUS_UPDATED',
  CONVENTION_STATUS_UPDATE_SUCCESS = 'CONVENTION_STATUS_UPDATE_SUCCESS',
  CONVENTION_DELETED = 'CONVENTION_DELETED',
  CONVENTION_DELETE_SUCCESS = 'CONVENTION_DELETE_SUCCESS',
  CONVENTION_LIST_SUCCESS = 'CONVENTION_LIST_SUCCESS',
  CONVENTION_SHOW_SUCCESS = 'CONVENTION_SHOW_SUCCESS',
  CONVENTION_UPDATE_SUCCESS = 'CONVENTION_UPDATE_SUCCESS',
  CONVENTION_CAMPAIGN_ASSOCIATE_SUCCESS = 'CONVENTION_CAMPAIGN_ASSOCIATE_SUCCESS',
  CONVENTION_CAMPAIGN_DISSOCIATE_SUCCESS = 'CONVENTION_CAMPAIGN_DISSOCIATE_SUCCESS',
  CONVENTION_ACTIVATE_TO_CAMPAIGN_SUCCESS = 'CONVENTION_ACTIVATE_TO_CAMPAIGN_SUCCESS',
  CONVENTION_SYNC_SUCCESS = 'CONVENTION_SYNC_SUCCESS',
}

/**
 * Messages de succès en français pour les conventions
 */
export const ConventionSuccessMessages: Record<ConventionSuccessCodes, string> = {
  [ConventionSuccessCodes.CONVENTION_CREATED]: 'Convention créée avec succès.',
  [ConventionSuccessCodes.CONVENTION_UPDATED]: 'Convention mise à jour avec succès.',
  [ConventionSuccessCodes.CONVENTION_STATUS_UPDATED]: 'Statut de la convention mis à jour avec succès.',
  [ConventionSuccessCodes.CONVENTION_STATUS_UPDATE_SUCCESS]:
    'Statut de la convention mis à jour avec succès.',
  [ConventionSuccessCodes.CONVENTION_DELETED]: 'Convention supprimée avec succès.',
  [ConventionSuccessCodes.CONVENTION_DELETE_SUCCESS]: 'Convention supprimée avec succès.',
  [ConventionSuccessCodes.CONVENTION_LIST_SUCCESS]:
    'Liste des conventions récupérée avec succès.',
  [ConventionSuccessCodes.CONVENTION_SHOW_SUCCESS]:
    'Détails de la convention récupérés avec succès.',
  [ConventionSuccessCodes.CONVENTION_UPDATE_SUCCESS]: 'Convention mise à jour avec succès.',
  [ConventionSuccessCodes.CONVENTION_CAMPAIGN_ASSOCIATE_SUCCESS]:
    'Convention associée à la campagne avec succès.',
  [ConventionSuccessCodes.CONVENTION_CAMPAIGN_DISSOCIATE_SUCCESS]:
    'Convention dissociée de la campagne avec succès.',
  [ConventionSuccessCodes.CONVENTION_ACTIVATE_TO_CAMPAIGN_SUCCESS]:
    'Convention activée à la campagne en cours avec succès.',
  [ConventionSuccessCodes.CONVENTION_SYNC_SUCCESS]:
    'Conventions synchronisées avec succès.',
}
