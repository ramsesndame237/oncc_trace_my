/**
 * Codes d'erreur spécifiques aux acteurs
 */
export enum ActorErrorCodes {
  ACTOR_NOT_FOUND = 'ACTOR_NOT_FOUND',
  ACTOR_LIST_FAILED = 'ACTOR_LIST_FAILED',
  ACTOR_CREATION_FAILED = 'ACTOR_CREATION_FAILED',
  ACTOR_UPDATE_FAILED = 'ACTOR_UPDATE_FAILED',
  ACTOR_DELETION_FAILED = 'ACTOR_DELETION_FAILED',
  ACTOR_ACTIVATION_FAILED = 'ACTOR_ACTIVATION_FAILED',
  ACTOR_DEACTIVATION_FAILED = 'ACTOR_DEACTIVATION_FAILED',
  ACTOR_STATUS_UPDATE_FAILED = 'ACTOR_STATUS_UPDATE_FAILED',
  ACTOR_NOT_AUTHORIZED = 'ACTOR_NOT_AUTHORIZED',
  ACTOR_ONCC_ID_EXISTS = 'ACTOR_ONCC_ID_EXISTS',
  ACTOR_IDENTIFIANT_EXISTS = 'ACTOR_IDENTIFIANT_EXISTS',
  ACTOR_ALREADY_ACTIVE = 'ACTOR_ALREADY_ACTIVE',
  ACTOR_ALREADY_INACTIVE = 'ACTOR_ALREADY_INACTIVE',
  ACTOR_HAS_USERS = 'ACTOR_HAS_USERS',
  ACTOR_MANAGER_INFO_REQUIRED = 'ACTOR_MANAGER_INFO_REQUIRED',
  ACTOR_INVALID_STATUS = 'ACTOR_INVALID_STATUS',
  ACTOR_EMAIL_OR_PHONE_REQUIRED = 'ACTOR_EMAIL_OR_PHONE_REQUIRED',
  ACTOR_EMAIL_REQUIRED = 'ACTOR_EMAIL_REQUIRED',
  ACTOR_NOT_OPA = 'ACTOR_NOT_OPA',
  ACTOR_NOT_PRODUCER = 'ACTOR_NOT_PRODUCER',
  ACTOR_NOT_BUYER = 'ACTOR_NOT_BUYER',
  ACTOR_NOT_EXPORTER = 'ACTOR_NOT_EXPORTER',
  PRODUCER_ALREADY_IN_OPA = 'PRODUCER_ALREADY_IN_OPA',
  PRODUCER_NOT_IN_OPA = 'PRODUCER_NOT_IN_OPA',
  ADD_PRODUCER_TO_OPA_FAILED = 'ADD_PRODUCER_TO_OPA_FAILED',
  REMOVE_PRODUCER_FROM_OPA_FAILED = 'REMOVE_PRODUCER_FROM_OPA_FAILED',
  BUYER_ALREADY_IN_EXPORTER = 'BUYER_ALREADY_IN_EXPORTER',
  BUYER_ALREADY_ASSIGNED_TO_OTHER_EXPORTER = 'BUYER_ALREADY_ASSIGNED_TO_OTHER_EXPORTER',
  BUYER_NOT_IN_EXPORTER = 'BUYER_NOT_IN_EXPORTER',
  ADD_BUYER_TO_EXPORTER_FAILED = 'ADD_BUYER_TO_EXPORTER_FAILED',
  REMOVE_BUYER_FROM_EXPORTER_FAILED = 'REMOVE_BUYER_FROM_EXPORTER_FAILED',
  NO_ACTIVE_CAMPAIGN = 'NO_ACTIVE_CAMPAIGN',
  ACTOR_SYNC_FAILED = 'ACTOR_SYNC_FAILED',
  ACTOR_MISSING_REQUIRED_DOCUMENTS = 'ACTOR_MISSING_REQUIRED_DOCUMENTS',
}

/**
 * Messages d'erreur en français pour les acteurs
 */
export const ActorErrorMessages: Record<ActorErrorCodes, string> = {
  [ActorErrorCodes.ACTOR_NOT_FOUND]: "L'acteur est introuvable.",
  [ActorErrorCodes.ACTOR_LIST_FAILED]: 'Échec de la récupération de la liste des acteurs.',
  [ActorErrorCodes.ACTOR_CREATION_FAILED]: "Échec de la création de l'acteur.",
  [ActorErrorCodes.ACTOR_UPDATE_FAILED]: "Échec de la mise à jour de l'acteur.",
  [ActorErrorCodes.ACTOR_DELETION_FAILED]: "Échec de la suppression de l'acteur.",
  [ActorErrorCodes.ACTOR_ACTIVATION_FAILED]: "Échec de l'activation de l'acteur.",
  [ActorErrorCodes.ACTOR_DEACTIVATION_FAILED]: "Échec de la désactivation de l'acteur.",
  [ActorErrorCodes.ACTOR_STATUS_UPDATE_FAILED]: "Échec de la mise à jour du statut de l'acteur.",
  [ActorErrorCodes.ACTOR_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à effectuer cette action sur cet acteur.",
  [ActorErrorCodes.ACTOR_ONCC_ID_EXISTS]: 'Un acteur avec cet identifiant ONCC existe déjà.',
  [ActorErrorCodes.ACTOR_IDENTIFIANT_EXISTS]: 'Un acteur avec cet identifiant unique existe déjà.',
  [ActorErrorCodes.ACTOR_ALREADY_ACTIVE]: "L'acteur est déjà actif.",
  [ActorErrorCodes.ACTOR_ALREADY_INACTIVE]: "L'acteur est déjà inactif.",
  [ActorErrorCodes.ACTOR_HAS_USERS]:
    'Impossible de supprimer cet acteur car il a des utilisateurs associés.',
  [ActorErrorCodes.ACTOR_MANAGER_INFO_REQUIRED]:
    "Les informations du manager sont obligatoires pour ce type d'acteur.",
  [ActorErrorCodes.ACTOR_INVALID_STATUS]: "Statut d'acteur invalide.",
  [ActorErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED]:
    "Au moins l'email ou le numéro de téléphone doit être renseigné.",
  [ActorErrorCodes.ACTOR_EMAIL_REQUIRED]: "L'email est obligatoire pour un acheteur.",
  [ActorErrorCodes.ACTOR_NOT_OPA]: "L'acteur n'est pas un groupement de producteurs (OPA).",
  [ActorErrorCodes.ACTOR_NOT_PRODUCER]: "L'acteur n'est pas un producteur.",
  [ActorErrorCodes.ACTOR_NOT_BUYER]: "L'acteur n'est pas un acheteur.",
  [ActorErrorCodes.ACTOR_NOT_EXPORTER]: "L'acteur n'est pas un exportateur.",
  [ActorErrorCodes.PRODUCER_ALREADY_IN_OPA]: 'Ce producteur est déjà membre de cet OPA.',
  [ActorErrorCodes.PRODUCER_NOT_IN_OPA]: "Ce producteur n'est pas membre de cet OPA.",
  [ActorErrorCodes.ADD_PRODUCER_TO_OPA_FAILED]: "Échec de l'ajout du producteur à l'OPA.",
  [ActorErrorCodes.REMOVE_PRODUCER_FROM_OPA_FAILED]: "Échec du retrait du producteur de l'OPA.",
  [ActorErrorCodes.BUYER_ALREADY_IN_EXPORTER]: 'Cet acheteur est déjà mandataire de cet exportateur.',
  [ActorErrorCodes.BUYER_ALREADY_ASSIGNED_TO_OTHER_EXPORTER]: "Cet acheteur est déjà mandataire d'un autre exportateur pour la campagne en cours.",
  [ActorErrorCodes.BUYER_NOT_IN_EXPORTER]: "Cet acheteur n'est pas mandataire de cet exportateur.",
  [ActorErrorCodes.ADD_BUYER_TO_EXPORTER_FAILED]: "Échec de l'ajout de l'acheteur comme mandataire de l'exportateur.",
  [ActorErrorCodes.REMOVE_BUYER_FROM_EXPORTER_FAILED]: "Échec du retrait de l'acheteur comme mandataire de l'exportateur.",
  [ActorErrorCodes.NO_ACTIVE_CAMPAIGN]: "Aucune campagne active n'est disponible.",
  [ActorErrorCodes.ACTOR_SYNC_FAILED]: "Échec de la synchronisation des acteurs.",
  [ActorErrorCodes.ACTOR_MISSING_REQUIRED_DOCUMENTS]: "Documents justificatifs obligatoires manquants. Veuillez ajouter tous les documents requis avant de valider l'acteur.",
}

/**
 * Codes de succès spécifiques aux acteurs
 */
export enum ActorSuccessCodes {
  ACTOR_LIST_SUCCESS = 'ACTOR_LIST_SUCCESS',
  ACTOR_FETCH_SUCCESS = 'ACTOR_FETCH_SUCCESS',
  ACTOR_CREATED = 'ACTOR_CREATED',
  ACTOR_UPDATED = 'ACTOR_UPDATED',
  ACTOR_DELETED = 'ACTOR_DELETED',
  ACTOR_ACTIVATED = 'ACTOR_ACTIVATED',
  ACTOR_DEACTIVATED = 'ACTOR_DEACTIVATED',
  ACTOR_STATUS_UPDATED = 'ACTOR_STATUS_UPDATED',
  PRODUCER_ADDED_TO_OPA = 'PRODUCER_ADDED_TO_OPA',
  PRODUCER_REMOVED_FROM_OPA = 'PRODUCER_REMOVED_FROM_OPA',
  BUYER_ADDED_TO_EXPORTER = 'BUYER_ADDED_TO_EXPORTER',
  BUYER_REMOVED_FROM_EXPORTER = 'BUYER_REMOVED_FROM_EXPORTER',
  ACTOR_SYNC_SUCCESS = 'ACTOR_SYNC_SUCCESS',
}

/**
 * Messages de succès en français pour les acteurs
 */
export const ActorSuccessMessages: Record<ActorSuccessCodes, string> = {
  [ActorSuccessCodes.ACTOR_LIST_SUCCESS]: 'Liste des acteurs récupérée avec succès.',
  [ActorSuccessCodes.ACTOR_FETCH_SUCCESS]: "Détails de l'acteur récupérés avec succès.",
  [ActorSuccessCodes.ACTOR_CREATED]: 'Acteur créé avec succès.',
  [ActorSuccessCodes.ACTOR_UPDATED]: 'Acteur mis à jour avec succès.',
  [ActorSuccessCodes.ACTOR_DELETED]: 'Acteur supprimé avec succès.',
  [ActorSuccessCodes.ACTOR_ACTIVATED]: 'Acteur activé avec succès.',
  [ActorSuccessCodes.ACTOR_DEACTIVATED]: 'Acteur désactivé avec succès.',
  [ActorSuccessCodes.ACTOR_STATUS_UPDATED]: "Statut de l'acteur mis à jour avec succès.",
  [ActorSuccessCodes.PRODUCER_ADDED_TO_OPA]: "Producteur ajouté à l'OPA avec succès.",
  [ActorSuccessCodes.PRODUCER_REMOVED_FROM_OPA]: "Producteur retiré de l'OPA avec succès.",
  [ActorSuccessCodes.BUYER_ADDED_TO_EXPORTER]: "Acheteur ajouté comme mandataire de l'exportateur avec succès.",
  [ActorSuccessCodes.BUYER_REMOVED_FROM_EXPORTER]: "Acheteur retiré comme mandataire de l'exportateur avec succès.",
  [ActorSuccessCodes.ACTOR_SYNC_SUCCESS]: "Synchronisation des acteurs réussie.",
}
