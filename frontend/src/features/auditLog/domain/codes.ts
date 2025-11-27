/**
 * Codes d'actions d'audit
 * Ces codes doivent correspondre exactement aux types définis dans le backend
 * (backend/app/types/audit_types.ts)
 */
export const AUDIT_ACTION_CODES = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  VALIDATE: "validate",
  REJECT: "reject",
  ACTIVATE: "activate",
  DEACTIVATE: "deactivate",
  DRAFT: "draft",
  UPDATE_STATUS: "update_status",
  ADMIN_INFO_UPDATE: "admin_info_update",
  ADMIN_PASSWORD_RESET: "admin_password_reset",
  ADD_PARCEL: "add_parcel",
  UPDATE_PARCEL: "update_parcel",
  ACTIVATE_PARCEL: "activate_parcel",
  DEACTIVATE_PARCEL: "deactivate_parcel",
  ADD_DOCUMENT: "add_document",
  REMOVE_DOCUMENT: "remove_document",
  ADD_PRODUCER: "add_producer",
  REMOVE_PRODUCER: "remove_producer",
  ADD_BUYER: "add_buyer",
  REMOVE_BUYER: "remove_buyer",
  ADD_OCCUPANT: "add_occupant",
  REMOVE_OCCUPANT: "remove_occupant",
  ASSOCIATE_CAMPAIGN: "associate_campaign",
  DISSOCIATE_CAMPAIGN: "dissociate_campaign",
} as const;

/**
 * Type pour les actions d'audit
 */
export type AuditActionCode =
  (typeof AUDIT_ACTION_CODES)[keyof typeof AUDIT_ACTION_CODES];

/**
 * Array de toutes les actions d'audit (utile pour validation)
 */
export const AUDIT_ACTION_CODES_ARRAY: AuditActionCode[] = Object.values(
  AUDIT_ACTION_CODES
);
