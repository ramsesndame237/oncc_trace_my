/**
 * Constants pour les types de documents
 * Ce fichier est LA SOURCE UNIQUE pour les types de documents :
 * - value : identifiant unique du document
 * - label : clé de traduction i18n (à traduire avec t(label))
 */

// Types de documents pour les producteurs (photos)
export const pictureData = [
  { value: "producer_photo", label: "document:types.producer_photo" },
  { value: "producer_card", label: "document:types.producer_card" },
  { value: "producer_rccm", label: "document:types.producer_rccm" },
] as const;

export const opaDocuments = [
  {
    value: "cobget_registration_form",
    label: "document:types.cobget_registration_form",
  },
] as const;

// Documents pour les acheteurs (buyers)
export const buyerDocuments = [
  { value: "rccm", label: "document:types.rccm" },
  {
    value: "conformity_certificate_facilities",
    label: "document:types.conformity_certificate_facilities",
  },
  {
    value: "commercial_license",
    label: "document:types.commercial_license",
  },
] as const;

// Documents complémentaires
export const complementDocument = [
  {
    value: "national_identity_card",
    label: "document:types.national_identity_card",
  },
  { value: "cocoa_producer_card", label: "document:types.cocoa_producer_card" },
  {
    value: "conformity_certificate",
    label: "document:types.conformity_certificate",
  },
  {
    value: "cooperative_registration_number",
    label: "document:types.cooperative_registration_number",
  },
  {
    value: "organic_production_certificate",
    label: "document:types.organic_production_certificate",
  },
  {
    value: "residence_certificate",
    label: "document:types.residence_certificate",
  },
  {
    value: "agricultural_exploitation_permit",
    label: "document:types.agricultural_exploitation_permit",
  },
  {
    value: "plantation_declaration_receipt",
    label: "document:types.plantation_declaration_receipt",
  },
  {
    value: "commercialization_register",
    label: "document:types.commercialization_register",
  },
  {
    value: "cooperative_contract",
    label: "document:types.cooperative_contract",
  },
  { value: "passport", label: "document:types.passport" },
  { value: "driving_license", label: "document:types.driving_license" },
] as const;

export const complementDocument2 = [
  {
    label: "document:types.certificat_enregistrement",
    value: "certificat_enregistrement",
  },
  {
    label: "document:types.nif",
    value: "nif",
  },
  {
    label: "document:types.licence_exploitation",
    value: "licence_exploitation",
  },
  {
    label: "document:types.certificat_conformite",
    value: "certificat_conformite",
  },
  {
    label: "document:types.certificat_conformite_sanitaire",
    value: "certificat_conformite_sanitaire",
  },
  {
    label: "document:types.certificat_conformite_environnementale",
    value: "certificat_conformite_environnementale",
  },
  {
    label: "document:types.plan_affaires",
    value: "plan_affaires",
  },
  {
    label: "document:types.certificat_formation",
    value: "certificat_formation",
  },
  {
    label: "document:types.certificat_conformite_qualite",
    value: "certificat_conformite_qualite",
  },
  {
    label: "document:types.certificat_conformite_securite_alimentaire",
    value: "certificat_conformite_securite_alimentaire",
  },
] as const;

// Types de preuves foncières
export const landProveMentData = [
  {
    value: "land_ownership_certificate",
    label: "document:types.land_ownership_certificate",
  },
  { value: "sale_deed", label: "document:types.sale_deed" },
  { value: "land_title", label: "document:types.land_title" },
  {
    value: "temporary_occupation_authorization",
    label: "document:types.temporary_occupation_authorization",
  },
  {
    value: "non_opposition_certificate",
    label: "document:types.non_opposition_certificate",
  },
  {
    value: "transfer_certificate",
    label: "document:types.transfer_certificate",
  },
  { value: "cadastral_plan", label: "document:types.cadastral_plan" },
  {
    value: "legal_status_certificate",
    label: "document:types.legal_status_certificate",
  },
  {
    value: "customary_ownership_certificate",
    label: "document:types.customary_ownership_certificate",
  },
] as const;

export const landProveMentData2 = [
  {
    value: "certificat_propriete_fonciere",
    label: "document:types.certificat_propriete_fonciere",
  },
  {
    value: "acte_de_vente",
    label: "document:types.acte_de_vente",
  },
  {
    value: "titre_foncier",
    label: "document:types.titre_foncier",
  },
  {
    value: "autorisation_occupation_temporaire",
    label: "document:types.autorisation_occupation_temporaire",
  },
  {
    value: "certificat_non_opposition",
    label: "document:types.certificat_non_opposition",
  },
  {
    value: "certificat_mutation",
    label: "document:types.certificat_mutation",
  },
  {
    value: "plan_cadastral",
    label: "document:types.plan_cadastral",
  },
  {
    value: "certificat_situation_juridique",
    label: "document:types.certificat_situation_juridique",
  },
  {
    value: "attestation_propriete_coutumiere",
    label: "document:types.attestation_propriete_coutumiere",
  },
] as const;

// Documents pour les conventions
export const conventionDocuments = [
  { value: "contract", label: "document:types.contract" },
  {
    value: "licence_exportation",
    label: "document:types.licence_exportation",
  },
  {
    value: "certificat_sanitaire",
    label: "document:types.certificat_sanitaire",
  },
  {
    value: "certificat_phyto_sanitaire",
    label: "document:types.certificat_phyto_sanitaire",
  },
  {
    value: "facture_proforma",
    label: "document:types.facture_proforma",
  },
  {
    value: "registre_commerce",
    label: "document:types.registre_commerce",
  },
  {
    value: "carte_contribuant",
    label: "document:types.carte_contribuant",
  },
  {
    value: "attestation_fiscale",
    label: "document:types.attestation_fiscale",
  },
  {
    value: "certificat_origine",
    label: "document:types.certificat_origine",
  },
] as const;

// Documents pour les transferts de produits
export const productTransferDocuments = [
  { value: "route_sheet", label: "document:types.route_sheet" },
  { value: "delivery_note", label: "document:types.delivery_note" },
  { value: "waybill", label: "document:types.waybill" },
] as const;

// Documents pour les transactions
export const transactionDocuments = [
  { value: "sale_contract", label: "document:types.sale_contract" },
  { value: "purchase_contract", label: "document:types.purchase_contract" },
] as const;

// Combine tous les types de documents disponibles
export const allDocumentTypes = [
  ...pictureData,
  ...complementDocument,
  ...complementDocument2,
  ...landProveMentData,
  ...landProveMentData2,
  ...opaDocuments,
  ...buyerDocuments,
  ...conventionDocuments,
  ...productTransferDocuments,
  ...transactionDocuments,
] as const;

// Export par catégorie pour faciliter l'utilisation
export const documentTypeCategories = {
  picture: pictureData,
  complement: complementDocument,
  complement2: complementDocument2,
  landProof: landProveMentData,
  landProof2: landProveMentData2,
  opaDocuments: opaDocuments,
  buyerDocuments: buyerDocuments,
  conventionDocuments: conventionDocuments,
  productTransferDocuments: productTransferDocuments,
  transactionDocuments: transactionDocuments,
  all: allDocumentTypes,
} as const;

// Types TypeScript pour la validation
export type DocumentTypeCategory = keyof typeof documentTypeCategories;
export type DocumentTypeValue = (typeof allDocumentTypes)[number]["value"];
export type DocumentTypeLabel = (typeof allDocumentTypes)[number]["label"];
export type DocumentType = (typeof allDocumentTypes)[number];
