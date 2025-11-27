/**
 * Types pour le modal d'annulation de transfert de produit
 */

export interface ProductTransferCancelModalData {
  isValid: boolean;
  isLoading: boolean;
  transferCode: string;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  onDismiss: () => void;
  _setData: (updates: Partial<ProductTransferCancelModalData>) => void;
}
