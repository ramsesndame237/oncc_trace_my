/**
 * Constants for the actor feature
 */

// Import des types de documents depuis la feature document
export {
  allDocumentTypes,
  complementDocument,
  documentTypeCategories,
  landProveMentData,
  landProveMentData2,
  pictureData,
} from "@/features/document/domain";

// Types de parcelles (synchronisés avec le backend)
export const parcelTypeOptions = [
  { value: "national", label: "National" },
  { value: "public", label: "Public" },
  { value: "state_private", label: "Privé d'État" },
  { value: "individual_private", label: "Privé individuel" },
];

// Genres
export const genderOptions = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
];

// Types d'acteurs (synchronisés avec le backend)
export const actorTypes = [
  { value: "PRODUCER", label: "Producteur" },
  { value: "TRANSFORMER", label: "Transformateur" },
  { value: "PRODUCERS", label: "Groupement de Producteurs" },
  { value: "BUYER", label: "Acheteur" },
  { value: "EXPORTER", label: "Exportateur" },
] as const;

// Status des acteurs (synchronisés avec le backend)
export const actorStatusOptions = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
] as const;
