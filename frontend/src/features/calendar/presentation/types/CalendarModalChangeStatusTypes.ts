export interface CalendarModalChangeStatusData {
  isValid: boolean;
  isLoading: boolean;
  transferCode: string;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  onDismiss: () => void;
  _setData: (updates: Partial<CalendarModalChangeStatusData>) => void;
}
