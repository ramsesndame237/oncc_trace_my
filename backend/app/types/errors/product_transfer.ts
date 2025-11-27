/**
 * Codes d'erreur et de succès pour les transferts de produits
 */

export enum ProductTransferErrorCodes {
  PRODUCT_TRANSFER_NOT_FOUND = 'PRODUCT_TRANSFER_NOT_FOUND',
  PRODUCT_TRANSFER_LIST_FAILED = 'PRODUCT_TRANSFER_LIST_FAILED',
  PRODUCT_TRANSFER_CREATE_FAILED = 'PRODUCT_TRANSFER_CREATE_FAILED',
  PRODUCT_TRANSFER_UPDATE_FAILED = 'PRODUCT_TRANSFER_UPDATE_FAILED',
  PRODUCT_TRANSFER_DELETE_FAILED = 'PRODUCT_TRANSFER_DELETE_FAILED',
  PRODUCT_TRANSFER_SHOW_FAILED = 'PRODUCT_TRANSFER_SHOW_FAILED',
  PRODUCT_TRANSFER_STATUS_UPDATE_FAILED = 'PRODUCT_TRANSFER_STATUS_UPDATE_FAILED',
  PRODUCT_TRANSFER_CODE_EXISTS = 'PRODUCT_TRANSFER_CODE_EXISTS',
  PRODUCT_TRANSFER_NOT_AUTHORIZED = 'PRODUCT_TRANSFER_NOT_AUTHORIZED',
  PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND = 'PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND',
  PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND = 'PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND',
  PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND = 'PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND',
  PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND = 'PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND',
  PRODUCT_TRANSFER_SENDER_STORE_REQUIRED = 'PRODUCT_TRANSFER_SENDER_STORE_REQUIRED',
  PRODUCT_TRANSFER_NO_ACTIVE_CAMPAIGN = 'PRODUCT_TRANSFER_NO_ACTIVE_CAMPAIGN',
  PRODUCT_TRANSFER_CAMPAIGN_NOT_FOUND = 'PRODUCT_TRANSFER_CAMPAIGN_NOT_FOUND',
  PRODUCT_TRANSFER_SENDER_ACTOR_NOT_ACTIVE = 'PRODUCT_TRANSFER_SENDER_ACTOR_NOT_ACTIVE',
  PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_ACTIVE = 'PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_ACTIVE',
  PRODUCT_TRANSFER_SENDER_STORE_NOT_ACTIVE = 'PRODUCT_TRANSFER_SENDER_STORE_NOT_ACTIVE',
  PRODUCT_TRANSFER_RECEIVER_STORE_NOT_ACTIVE = 'PRODUCT_TRANSFER_RECEIVER_STORE_NOT_ACTIVE',
  PRODUCT_TRANSFER_PRODUCTS_REQUIRED = 'PRODUCT_TRANSFER_PRODUCTS_REQUIRED',
  PRODUCT_TRANSFER_NOT_EDITABLE = 'PRODUCT_TRANSFER_NOT_EDITABLE',
  PRODUCT_TRANSFER_VALIDATED_LIMITED_EDIT = 'PRODUCT_TRANSFER_VALIDATED_LIMITED_EDIT',
  PRODUCT_TRANSFER_INVALID_STATUS_TRANSITION = 'PRODUCT_TRANSFER_INVALID_STATUS_TRANSITION',
  PRODUCT_TRANSFER_VALIDATED_NOT_DELETABLE = 'PRODUCT_TRANSFER_VALIDATED_NOT_DELETABLE',
}

export enum ProductTransferSuccessCodes {
  PRODUCT_TRANSFER_LIST_SUCCESS = 'PRODUCT_TRANSFER_LIST_SUCCESS',
  PRODUCT_TRANSFER_CREATE_SUCCESS = 'PRODUCT_TRANSFER_CREATE_SUCCESS',
  PRODUCT_TRANSFER_UPDATE_SUCCESS = 'PRODUCT_TRANSFER_UPDATE_SUCCESS',
  PRODUCT_TRANSFER_DELETE_SUCCESS = 'PRODUCT_TRANSFER_DELETE_SUCCESS',
  PRODUCT_TRANSFER_SHOW_SUCCESS = 'PRODUCT_TRANSFER_SHOW_SUCCESS',
  PRODUCT_TRANSFER_STATUS_UPDATE_SUCCESS = 'PRODUCT_TRANSFER_STATUS_UPDATE_SUCCESS',
}

export const ProductTransferErrorMessages: Record<ProductTransferErrorCodes, string> = {
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_FOUND]: 'Transfert de produit non trouvé',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_LIST_FAILED]:
    'Échec de la récupération de la liste des transferts',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_CREATE_FAILED]:
    'Échec de la création du transfert de produit',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_UPDATE_FAILED]:
    'Échec de la mise à jour du transfert de produit',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_DELETE_FAILED]:
    'Échec de la suppression du transfert de produit',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_SHOW_FAILED]:
    'Échec de la récupération du transfert de produit',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_STATUS_UPDATE_FAILED]:
    'Échec de la mise à jour du statut du transfert',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_CODE_EXISTS]:
    'Un transfert avec ce code existe déjà',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_AUTHORIZED]:
    'Non autorisé à effectuer cette action sur le transfert',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND]:
    'Acteur expéditeur non trouvé',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND]:
    'Acteur destinataire non trouvé',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND]:
    'Magasin expéditeur non trouvé',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND]:
    'Magasin destinataire non trouvé',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_REQUIRED]:
    'Magasin expéditeur requis pour un transfert STANDARD',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_NO_ACTIVE_CAMPAIGN]:
    'Aucune campagne active trouvée',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_CAMPAIGN_NOT_FOUND]:
    'Campagne non trouvée',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_ACTIVE]:
    "L'acteur expéditeur n'est pas actif",
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_ACTIVE]:
    "L'acteur destinataire n'est pas actif",
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_ACTIVE]:
    "Le magasin expéditeur n'est pas associé à la campagne en cours",
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_ACTIVE]:
    "Le magasin destinataire n'est pas associé à la campagne en cours",
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_PRODUCTS_REQUIRED]:
    'Les produits sont requis pour un transfert',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_EDITABLE]:
    'Les transferts annulés ne peuvent pas être modifiés',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_VALIDATED_LIMITED_EDIT]:
    'Pour un transfert validé, seuls les produits peuvent être modifiés',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_INVALID_STATUS_TRANSITION]:
    'Un transfert validé peut seulement être annulé',
  [ProductTransferErrorCodes.PRODUCT_TRANSFER_VALIDATED_NOT_DELETABLE]:
    'Un transfert validé ne peut pas être supprimé',
}

export const ProductTransferSuccessMessages: Record<ProductTransferSuccessCodes, string> = {
  [ProductTransferSuccessCodes.PRODUCT_TRANSFER_LIST_SUCCESS]:
    'Liste des transferts récupérée avec succès',
  [ProductTransferSuccessCodes.PRODUCT_TRANSFER_CREATE_SUCCESS]:
    'Transfert de produit créé avec succès',
  [ProductTransferSuccessCodes.PRODUCT_TRANSFER_UPDATE_SUCCESS]:
    'Transfert de produit mis à jour avec succès',
  [ProductTransferSuccessCodes.PRODUCT_TRANSFER_DELETE_SUCCESS]:
    'Transfert de produit supprimé avec succès',
  [ProductTransferSuccessCodes.PRODUCT_TRANSFER_SHOW_SUCCESS]:
    'Transfert de produit récupéré avec succès',
  [ProductTransferSuccessCodes.PRODUCT_TRANSFER_STATUS_UPDATE_SUCCESS]:
    'Statut du transfert mis à jour avec succès',
}
