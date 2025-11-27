export interface CalendarModalUpdateExpectedSalesCountData {
  isValid: boolean;
  isLoading: boolean;
  calendarCode: string;
  expectedSalesCount: number;
  _updateExpectedSalesCount?: (value: number) => void;
  handleConfirm: () => void;
  handleCancel: () => void;
  onDismiss?: () => void;
}
