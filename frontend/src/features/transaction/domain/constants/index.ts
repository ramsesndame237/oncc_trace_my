/**
 * Constantes pour la feature Transaction
 */

/**
 * Types de documents pour les transactions de vente
 */
export const saleDocumentTypes = {
  saleContractDocuments: [
    { value: "sale_contract", label: "document:types.sale_contract" },
  ],
} as const;

/**
 * Types de documents pour les transactions d'achat
 */
export const purchaseDocumentTypes = {
  purchaseContractDocuments: [
    { value: "purchase_contract", label: "document:types.purchase_contract" },
  ],
} as const;
