export type ActorTypes =
  | "PRODUCER"
  | "TRANSFORMER"
  | "PRODUCERS"
  | "BUYER"
  | "EXPORTER";

export type ActorStatus = "active" | "inactive" | "pending";

// Constantes pour les types d'acteur (pour éviter les erreurs de frappe)
export const ACTOR_TYPES = {
  PRODUCER: "PRODUCER" as const,
  TRANSFORMER: "TRANSFORMER" as const,
  PRODUCERS: "PRODUCERS" as const,
  BUYER: "BUYER" as const,
  EXPORTER: "EXPORTER" as const,
} as const;

// Array des types pour validation
export const ACTOR_TYPES_ARRAY: ActorTypes[] = [
  ACTOR_TYPES.PRODUCER,
  ACTOR_TYPES.TRANSFORMER,
  ACTOR_TYPES.PRODUCERS,
  ACTOR_TYPES.BUYER,
  ACTOR_TYPES.EXPORTER,
];

// Labels pour l'affichage
export const ACTOR_TYPE_LABELS = {
  [ACTOR_TYPES.PRODUCER]: "Producteur",
  [ACTOR_TYPES.TRANSFORMER]: "Transformateur",
  [ACTOR_TYPES.PRODUCERS]: "Producteurs",
  [ACTOR_TYPES.BUYER]: "Acheteur",
  [ACTOR_TYPES.EXPORTER]: "Exportateur",
} as const;

// Constantes pour les statuts d'acteur
export const ACTOR_STATUS = {
  ACTIVE: "active" as const,
  INACTIVE: "inactive" as const,
  PENDING: "pending" as const,
} as const;

// Array des statuts pour validation
export const ACTOR_STATUS_ARRAY: ActorStatus[] = [
  ACTOR_STATUS.ACTIVE,
  ACTOR_STATUS.INACTIVE,
  ACTOR_STATUS.PENDING,
];

// Labels pour l'affichage des statuts
export const ACTOR_STATUS_LABELS = {
  [ACTOR_STATUS.ACTIVE]: "Actif",
  [ACTOR_STATUS.INACTIVE]: "Inactif",
  [ACTOR_STATUS.PENDING]: "En attente",
} as const;
