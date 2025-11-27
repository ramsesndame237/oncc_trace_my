// Types pour le modal d'association de convention à la campagne active

export interface ConventionAssociateCampaignModalData {
  // État de validation
  isValid: boolean;
  isLoading: boolean;

  handleConfirm: () => Promise<void>;
  handleCancel: () => void;

  // Données spécifiques à la convention
  conventionId: string;

  // Callback appelé quand le modal se ferme (croix X ou ESC)
  onDismiss?: () => void;

  // Référence interne pour mutations (ajoutée par le provider)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}
