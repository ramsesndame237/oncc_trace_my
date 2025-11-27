/**
 * Hook pour obtenir les options de formulaire pour les transferts de produits
 */

import { useTranslation } from 'react-i18next'
import {
  productTransferDocumentTypes,
  productQualityOptions
} from '@/features/product-transfer/domain/constants'

export const useProductTransferOptions = () => {
  const { t: tDoc } = useTranslation('document')
  const { t: tProduct } = useTranslation('productTransfer')

  return {
    // Options pour les types de documents - Bordereaux de route
    routeSheetDocuments: productTransferDocumentTypes.routeSheetDocuments.map((doc) => ({
      value: doc.value,
      // Extraire la clé après "document:" (ex: "document:types.route_sheet" -> "types.route_sheet")
      label: tDoc(doc.label.replace('document:', '') as never),
    })),

    // Options pour les qualités de produits
    qualityOptions: productQualityOptions.map((quality) => ({
      value: quality.value,
      label: tProduct(`form.step2.qualityOptions.${quality.key}` as never),
    })),
  }
}
