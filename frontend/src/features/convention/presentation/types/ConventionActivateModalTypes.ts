// Types pour le modal d'activation de convention avec le système ultra-pur

export interface ConventionActivateModalData {
  // État de validation
  isValid: boolean;
  isLoading: boolean;

  handleConfirm: () => Promise<void>;
  handleCancel: () => void;

  // Données spécifiques à la convention
  conventionId: string;
  activeCampaignName?: string;

  // Callback appelé quand le modal se ferme (croix X ou ESC)
  onDismiss?: () => void;

  // Référence interne pour mutations (ajoutée par le provider)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}
