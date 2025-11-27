/**
 * Hook pour obtenir les options de formulaire pour les ventes de transaction
 */

import { useTranslation } from "react-i18next";
import { saleDocumentTypes } from "../../domain/constants";

export const useSaleOptions = () => {
  const { t } = useTranslation("document");

  return {
    // Options pour les types de documents - Contrat de vente
    saleContractDocuments: saleDocumentTypes.saleContractDocuments.map(
      (doc) => ({
        value: doc.value,
        label: t(doc.label as never),
      })
    ),
  };
};
