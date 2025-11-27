/**
 * Hook pour obtenir les options de formulaire pour les achats de transaction
 */

import { useTranslation } from "react-i18next";
import { purchaseDocumentTypes } from "../../domain/constants";

export const usePurchaseOptions = () => {
  const { t } = useTranslation("document");

  return {
    // Options pour les types de documents - Contrat d'achat
    purchaseContractDocuments: purchaseDocumentTypes.purchaseContractDocuments.map(
      (doc) => ({
        value: doc.value,
        label: t(doc.label as never),
      })
    ),
  };
};
