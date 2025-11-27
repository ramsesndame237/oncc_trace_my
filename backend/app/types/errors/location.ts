/**
 * Codes d'erreur spécifiques aux localisations
 */
export enum LocationErrorCodes {
  NOT_FOUND = 'LOCATION_NOT_FOUND',
  LIST_FAILED = 'LOCATION_LIST_FAILED',
  HIERARCHY_FAILED = 'LOCATION_HIERARCHY_FAILED',
  CHILDREN_FAILED = 'LOCATION_CHILDREN_FAILED',
}

/**
 * Codes de succès spécifiques aux localisations
 */
export enum LocationSuccessCodes {
  LIST_SUCCESS = 'LOCATION_LIST_SUCCESS',
  HIERARCHY_SUCCESS = 'LOCATION_HIERARCHY_SUCCESS',
  CHILDREN_SUCCESS = 'LOCATION_CHILDREN_SUCCESS',
}

/**
 * Messages d'erreur pour les localisations
 */
export const LocationErrorMessages: Record<LocationErrorCodes, string> = {
  [LocationErrorCodes.NOT_FOUND]: 'La localisation est introuvable',
  [LocationErrorCodes.LIST_FAILED]: 'Erreur lors de la récupération des localisations',
  [LocationErrorCodes.HIERARCHY_FAILED]:
    'Erreur lors de la récupération de la hiérarchie des localisations',
  [LocationErrorCodes.CHILDREN_FAILED]: 'Erreur lors de la récupération des sous-localisations',
}

/**
 * Messages de succès pour les localisations
 */
export const LocationSuccessMessages: Record<LocationSuccessCodes, string> = {
  [LocationSuccessCodes.LIST_SUCCESS]: 'Liste des localisations récupérée avec succès',
  [LocationSuccessCodes.HIERARCHY_SUCCESS]: 'Hiérarchie des localisations récupérée avec succès',
  [LocationSuccessCodes.CHILDREN_SUCCESS]: 'Sous-localisations récupérées avec succès',
}
