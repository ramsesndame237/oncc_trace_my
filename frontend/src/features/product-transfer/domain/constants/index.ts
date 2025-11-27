/**
 * Constantes pour la feature Product Transfer
 */

/**
 * Types de documents pour les transferts de produits
 */
export const productTransferDocumentTypes = {
  routeSheetDocuments: [
    {
      value: 'route_sheet',
      label: 'document:types.route_sheet',
    },
    {
      value: 'delivery_note',
      label: 'document:types.delivery_note',
    },
    {
      value: 'waybill',
      label: 'document:types.waybill',
    },
  ],
} as const
