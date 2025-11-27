export interface ConventionDissociateCampaignModalData {
  isValid: boolean;
  isLoading: boolean;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  conventionId: string;
  campaignName: string;
  onDismiss?: () => void;
  _setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}
