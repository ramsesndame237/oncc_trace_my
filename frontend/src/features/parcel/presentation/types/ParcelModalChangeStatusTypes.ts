export interface ParcelModalChangeStatusData {
  isValid: boolean;
  isLoading: boolean;
  parcelId: string;
  action: "activate" | "deactivate";
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  _setData: (data: Partial<ParcelModalChangeStatusData>) => void;
}
