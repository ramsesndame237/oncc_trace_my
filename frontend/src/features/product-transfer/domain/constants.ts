/**
 * Constantes pour la feature Product Transfer
 */

import type { ProductQuality } from "@/core/domain/generated/cacao-types.types";
import { PRODUCT_QUALITIES_CONSTANTS } from "@/core/domain/generated/cacao-types.types";

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
 * Types de documents pour les transferts de produits
 */
export const productTransferDocumentTypes = {
  routeSheetDocuments: [
    {
      value: "route_sheet",
      label: "document:types.route_sheet",
    },
    {
      value: "delivery_note",
      label: "document:types.delivery_note",
    },
    {
      value: "waybill",
      label: "document:types.waybill",
    },
  ],
} as const;
