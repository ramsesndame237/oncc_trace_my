/**
 * Types pour le modal de changement de statut de transaction
 */

export type TransactionStatusAction = "confirm" | "cancel";

export interface TransactionStatusModalData {
  isValid: boolean;
  isLoading: boolean;
  transactionCode: string;
  action: TransactionStatusAction;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  onDismiss: () => void;
  _setData: (updates: Partial<TransactionStatusModalData>) => void;
}
