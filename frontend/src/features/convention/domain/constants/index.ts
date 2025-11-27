/**
 * Constantes pour la feature Convention
 */

import {
  PRODUCT_QUALITIES_CONSTANTS,
  PRODUCT_STANDARDS_CONSTANTS,
} from "@/core/domain/generated/cacao-types.types";
import type {
  ProductQuality,
  ProductStandard,
} from "../types/convention.types";

/**
 * Options pour la qualité des produits
 */
export const productQualityOptions: Array<{
  value: ProductQuality;
  key: string;
}> = [
  { value: PRODUCT_QUALITIES_CONSTANTS.GRADE_1, key: "grade1" },
  { value: PRODUCT_QUALITIES_CONSTANTS.GRADE_2, key: "grade2" },
  { value: PRODUCT_QUALITIES_CONSTANTS.HS, key: "hs" },
];

/**
 * Options pour le standard des produits
 */
export const productStandardOptions: Array<{
  value: ProductStandard;
  key: string;
}> = [
  { value: PRODUCT_STANDARDS_CONSTANTS.CERTIFIE, key: "certifie" },
  { value: PRODUCT_STANDARDS_CONSTANTS.EXCELLENT, key: "excellent" },
  { value: PRODUCT_STANDARDS_CONSTANTS.FIN, key: "fin" },
  { value: PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL, key: "conventionnel" },
];

/**
 * Types de documents pour les conventions
 */
export const conventionDocumentTypes = {
  conventionDocuments: [
    { value: "contract", label: "document:types.contract" },
  ],
  complementDocuments: [
    {
      value: "licence_exportation",
      label: "document:types.licence_exportation",
    },
    {
      value: "certificat_conformite",
      label: "document:types.certificat_conformite",
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
  ],
} as const;
