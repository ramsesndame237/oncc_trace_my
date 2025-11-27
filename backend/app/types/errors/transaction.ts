/**
 * Codes d'erreur spécifiques aux transactions
 */
export enum TransactionErrorCodes {
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  TRANSACTION_CREATE_SELLER_NOT_FOUND = 'TRANSACTION_CREATE_SELLER_NOT_FOUND',
  TRANSACTION_CREATE_BUYER_NOT_FOUND = 'TRANSACTION_CREATE_BUYER_NOT_FOUND',
  TRANSACTION_CREATE_SELLER_BUYER_SAME = 'TRANSACTION_CREATE_SELLER_BUYER_SAME',
  TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND = 'TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND',
  TRANSACTION_CREATE_MARKET_NOT_FOUND = 'TRANSACTION_CREATE_MARKET_NOT_FOUND',
  TRANSACTION_CREATE_CONVENTION_NOT_FOUND = 'TRANSACTION_CREATE_CONVENTION_NOT_FOUND',
  TRANSACTION_CREATE_PRINCIPAL_EXPORTER_NOT_FOUND = 'TRANSACTION_CREATE_PRINCIPAL_EXPORTER_NOT_FOUND',
  TRANSACTION_CREATE_COMPLEMENTARY_LIMIT_REACHED = 'TRANSACTION_CREATE_COMPLEMENTARY_LIMIT_REACHED',
  TRANSACTION_CREATE_PRODUCER_NOT_FOUND = 'TRANSACTION_CREATE_PRODUCER_NOT_FOUND',
  TRANSACTION_CREATE_PRODUCER_REQUIRED_FOR_OPA = 'TRANSACTION_CREATE_PRODUCER_REQUIRED_FOR_OPA',
  TRANSACTION_CREATE_SELLER_NOT_ACTIVE = 'TRANSACTION_CREATE_SELLER_NOT_ACTIVE',
  TRANSACTION_CREATE_BUYER_NOT_ACTIVE = 'TRANSACTION_CREATE_BUYER_NOT_ACTIVE',
  TRANSACTION_CREATE_CALENDAR_NOT_FOUND = 'TRANSACTION_CREATE_CALENDAR_NOT_FOUND',
  TRANSACTION_CREATE_CALENDAR_NOT_ACTIVE = 'TRANSACTION_CREATE_CALENDAR_NOT_ACTIVE',
  TRANSACTION_CREATE_CONVENTION_NOT_ACTIVE = 'TRANSACTION_CREATE_CONVENTION_NOT_ACTIVE',
  TRANSACTION_CONFIRM_NOT_FOUND = 'TRANSACTION_CONFIRM_NOT_FOUND',
  TRANSACTION_CONFIRM_NOT_PENDING = 'TRANSACTION_CONFIRM_NOT_PENDING',
  TRANSACTION_CANCEL_NOT_FOUND = 'TRANSACTION_CANCEL_NOT_FOUND',
  TRANSACTION_UPDATE_NOT_FOUND = 'TRANSACTION_UPDATE_NOT_FOUND',
  TRANSACTION_UPDATE_NOT_PENDING = 'TRANSACTION_UPDATE_NOT_PENDING',
  TRANSACTION_UPDATE_SELLER_NOT_FOUND = 'TRANSACTION_UPDATE_SELLER_NOT_FOUND',
  TRANSACTION_UPDATE_BUYER_NOT_FOUND = 'TRANSACTION_UPDATE_BUYER_NOT_FOUND',
  TRANSACTION_UPDATE_CALENDAR_NOT_FOUND = 'TRANSACTION_UPDATE_CALENDAR_NOT_FOUND',
  TRANSACTION_UPDATE_CONVENTION_NOT_FOUND = 'TRANSACTION_UPDATE_CONVENTION_NOT_FOUND',
  TRANSACTION_DELETE_NOT_FOUND = 'TRANSACTION_DELETE_NOT_FOUND',
  TRANSACTION_LIST_FAILED = 'TRANSACTION_LIST_FAILED',
  TRANSACTION_CREATION_FAILED = 'TRANSACTION_CREATION_FAILED',
  TRANSACTION_UPDATE_FAILED = 'TRANSACTION_UPDATE_FAILED',
  TRANSACTION_CONFIRM_FAILED = 'TRANSACTION_CONFIRM_FAILED',
  TRANSACTION_CANCEL_FAILED = 'TRANSACTION_CANCEL_FAILED',
  TRANSACTION_DELETE_FAILED = 'TRANSACTION_DELETE_FAILED',
  TRANSACTION_UPDATE_PRODUCTS_NOT_FOUND = 'TRANSACTION_UPDATE_PRODUCTS_NOT_FOUND',
  TRANSACTION_UPDATE_PRODUCTS_NOT_PENDING = 'TRANSACTION_UPDATE_PRODUCTS_NOT_PENDING',
  TRANSACTION_UPDATE_PRODUCTS_FAILED = 'TRANSACTION_UPDATE_PRODUCTS_FAILED',
  TRANSACTION_UPDATE_PRODUCTS_PRODUCER_REQUIRED_FOR_OPA = 'TRANSACTION_UPDATE_PRODUCTS_PRODUCER_REQUIRED_FOR_OPA',
  TRANSACTION_UPDATE_PRODUCTS_PRODUCER_NOT_FOUND = 'TRANSACTION_UPDATE_PRODUCTS_PRODUCER_NOT_FOUND',
}

/**
 * Messages d'erreur en français pour les transactions
 */
export const TransactionErrorMessages: Record<TransactionErrorCodes, string> = {
  [TransactionErrorCodes.TRANSACTION_NOT_FOUND]: 'La transaction est introuvable.',
  [TransactionErrorCodes.TRANSACTION_CREATE_SELLER_NOT_FOUND]: "Le vendeur spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_BUYER_NOT_FOUND]: "L'acheteur spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_SELLER_BUYER_SAME]:
    "Le vendeur et l'acheteur ne peuvent pas être identiques.",
  [TransactionErrorCodes.TRANSACTION_CREATE_CAMPAIGN_NOT_FOUND]:
    "La campagne spécifiée n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_MARKET_NOT_FOUND]: "Le marché spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_FOUND]:
    "La convention spécifiée n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_PRINCIPAL_EXPORTER_NOT_FOUND]:
    "L'exportateur principal spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_COMPLEMENTARY_LIMIT_REACHED]:
    'La limite de transactions complémentaires est atteinte. Vous ne pouvez pas créer de nouvelle transaction complémentaire.',
  [TransactionErrorCodes.TRANSACTION_CREATE_PRODUCER_NOT_FOUND]:
    "Le producteur spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_PRODUCER_REQUIRED_FOR_OPA]:
    'Lorsque le vendeur est un OPA, tous les produits doivent avoir un producteur associé.',
  [TransactionErrorCodes.TRANSACTION_CREATE_SELLER_NOT_ACTIVE]:
    "Le vendeur sélectionné n'est pas actif.",
  [TransactionErrorCodes.TRANSACTION_CREATE_BUYER_NOT_ACTIVE]:
    "L'acheteur sélectionné n'est pas actif.",
  [TransactionErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_FOUND]:
    "Le calendrier spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_CREATE_CALENDAR_NOT_ACTIVE]:
    "Le calendrier sélectionné n'est pas actif.",
  [TransactionErrorCodes.TRANSACTION_CREATE_CONVENTION_NOT_ACTIVE]:
    "La convention sélectionnée n'est pas associée à la campagne en cours.",
  [TransactionErrorCodes.TRANSACTION_CONFIRM_NOT_FOUND]:
    'La transaction à confirmer est introuvable.',
  [TransactionErrorCodes.TRANSACTION_CONFIRM_NOT_PENDING]:
    'Seules les transactions en attente peuvent être confirmées.',
  [TransactionErrorCodes.TRANSACTION_CANCEL_NOT_FOUND]: 'La transaction à annuler est introuvable.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_NOT_FOUND]:
    'La transaction à mettre à jour est introuvable.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_NOT_PENDING]:
    'Seules les transactions en attente peuvent être modifiées.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_SELLER_NOT_FOUND]: "Le vendeur spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_UPDATE_BUYER_NOT_FOUND]: "L'acheteur spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_UPDATE_CALENDAR_NOT_FOUND]:
    "Le calendrier spécifié n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_UPDATE_CONVENTION_NOT_FOUND]:
    "La convention spécifiée n'existe pas.",
  [TransactionErrorCodes.TRANSACTION_DELETE_NOT_FOUND]:
    'La transaction à supprimer est introuvable.',
  [TransactionErrorCodes.TRANSACTION_LIST_FAILED]:
    'Échec de la récupération de la liste des transactions.',
  [TransactionErrorCodes.TRANSACTION_CREATION_FAILED]: 'Échec de la création de la transaction.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_FAILED]: 'Échec de la mise à jour de la transaction.',
  [TransactionErrorCodes.TRANSACTION_CONFIRM_FAILED]: 'Échec de la confirmation de la transaction.',
  [TransactionErrorCodes.TRANSACTION_CANCEL_FAILED]: "Échec de l'annulation de la transaction.",
  [TransactionErrorCodes.TRANSACTION_DELETE_FAILED]: 'Échec de la suppression de la transaction.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_FOUND]:
    'La transaction dont vous souhaitez modifier les produits est introuvable.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_PRODUCTS_NOT_PENDING]:
    'Seules les transactions en attente peuvent avoir leurs produits modifiés.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_PRODUCTS_FAILED]:
    'Échec de la mise à jour des produits de la transaction.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_REQUIRED_FOR_OPA]:
    'Lorsque le vendeur est un OPA, tous les produits doivent avoir un producteur associé.',
  [TransactionErrorCodes.TRANSACTION_UPDATE_PRODUCTS_PRODUCER_NOT_FOUND]:
    "Le producteur spécifié n'existe pas.",
}

/**
 * Codes de succès spécifiques aux transactions
 */
export enum TransactionSuccessCodes {
  TRANSACTION_LIST_SUCCESS = 'TRANSACTION_LIST_SUCCESS',
  TRANSACTION_CREATE_SUCCESS = 'TRANSACTION_CREATE_SUCCESS',
  TRANSACTION_SHOW_SUCCESS = 'TRANSACTION_SHOW_SUCCESS',
  TRANSACTION_UPDATE_SUCCESS = 'TRANSACTION_UPDATE_SUCCESS',
  TRANSACTION_CONFIRM_SUCCESS = 'TRANSACTION_CONFIRM_SUCCESS',
  TRANSACTION_CANCEL_SUCCESS = 'TRANSACTION_CANCEL_SUCCESS',
  TRANSACTION_DELETE_SUCCESS = 'TRANSACTION_DELETE_SUCCESS',
  TRANSACTION_COMPLEMENTARY_SUCCESS = 'TRANSACTION_COMPLEMENTARY_SUCCESS',
  TRANSACTION_UPDATE_PRODUCTS_SUCCESS = 'TRANSACTION_UPDATE_PRODUCTS_SUCCESS',
}

/**
 * Messages de succès en français pour les transactions
 */
export const TransactionSuccessMessages: Record<TransactionSuccessCodes, string> = {
  [TransactionSuccessCodes.TRANSACTION_LIST_SUCCESS]:
    'Liste des transactions récupérée avec succès.',
  [TransactionSuccessCodes.TRANSACTION_CREATE_SUCCESS]: 'Transaction créée avec succès.',
  [TransactionSuccessCodes.TRANSACTION_SHOW_SUCCESS]:
    'Détails de la transaction récupérés avec succès.',
  [TransactionSuccessCodes.TRANSACTION_UPDATE_SUCCESS]: 'Transaction mise à jour avec succès.',
  [TransactionSuccessCodes.TRANSACTION_CONFIRM_SUCCESS]: 'Transaction confirmée avec succès.',
  [TransactionSuccessCodes.TRANSACTION_CANCEL_SUCCESS]: 'Transaction annulée avec succès.',
  [TransactionSuccessCodes.TRANSACTION_DELETE_SUCCESS]: 'Transaction supprimée avec succès.',
  [TransactionSuccessCodes.TRANSACTION_COMPLEMENTARY_SUCCESS]:
    'Transactions complémentaires récupérées avec succès.',
  [TransactionSuccessCodes.TRANSACTION_UPDATE_PRODUCTS_SUCCESS]:
    'Produits de la transaction mis à jour avec succès.',
}
