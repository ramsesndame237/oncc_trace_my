/**
 * Hook pour obtenir les options de formulaire pour les conventions
 */

import { useTranslation } from "react-i18next";
import {
  conventionDocumentTypes,
  productQualityOptions,
  productStandardOptions,
} from "../../domain/constants";

export const useConventionOptions = () => {
  const { t } = useTranslation("convention");

  return {
    // Options pour la qualité du cacao
    qualityOptions: productQualityOptions.map((option) => ({
      value: option.value,
      label: t(`form.step2.qualityOptions.${option.key}` as never),
    })),

    // Options pour le standard du cacao
    standardOptions: productStandardOptions.map((option) => ({
      value: option.value,
      label: t(`form.step2.standardOptions.${option.key}` as never),
    })),

    // Options pour les types de documents - Contrat
    // doc.label contient la clé complète avec namespace (document:types.xxx)
    conventionDocuments: conventionDocumentTypes.conventionDocuments.map(
      (doc) => ({
        value: doc.value,
        label: t(doc.label as never),
      })
    ),

    // Options pour les types de documents - Documents complémentaires
    // doc.label contient la clé complète avec namespace (document:types.xxx)
    complementDocuments: conventionDocumentTypes.complementDocuments.map(
      (doc) => ({
        value: doc.value,
        label: t(doc.label as never),
      })
    ),
  };
};
