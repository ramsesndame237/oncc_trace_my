/**
 * Constantes et options pour les types de magasins
 */

import { TranslateFn } from "@/i18n";
import { StoreType } from "./store.domain.types";

export interface StoreTypeOption {
  value: StoreType;
  label: string;
}

/**
 * Fonction pour créer les options traduites des types de magasins
 * @param t - Fonction de traduction i18next
 * @returns Options traduites pour le select
 */
export const getStoreTypeOptions = (t: TranslateFn): StoreTypeOption[] => [
  { value: "EXPORT", label: t("storeTypes.EXPORT") },
  { value: "GROUPING", label: t("storeTypes.GROUPING") },
  {
    value: "GROUPING_AND_MACHINING",
    label: t("storeTypes.GROUPING_AND_MACHINING"),
  },
];

/**
 * Options pour le select des types de magasins (legacy - pour compatibilité)
 * @deprecated Utiliser getStoreTypeOptions(t) pour les options traduites
 */
export const STORE_TYPE_OPTIONS: StoreTypeOption[] = [
  { value: "EXPORT", label: "Export" },
  { value: "GROUPING", label: "Groupage" },
  {
    value: "GROUPING_AND_MACHINING",
    label: "Groupage et usinage",
  },
];

/**
 * Mapping des types de magasins pour l'affichage
 * @deprecated Utiliser la traduction directe avec t(`storeTypes.${storeType}`)
 */
export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  EXPORT: "Export",
  GROUPING: "Groupage",
  GROUPING_AND_MACHINING: "Groupage et usinage",
};

/**
 * Fonction utilitaire pour obtenir le label d'un type de magasin
 * @param storeType - Le type de magasin
 * @returns Le label correspondant ou le type lui-même si non trouvé
 * @deprecated Utiliser la traduction directe avec t(`storeTypes.${storeType}`)
 */
export const getStoreTypeLabel = (storeType: StoreType): string => {
  return STORE_TYPE_LABELS[storeType] || storeType;
};
