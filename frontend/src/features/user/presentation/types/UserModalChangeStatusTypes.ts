// Types pour le modal d'utilisateur avec le système ultra-pur

export interface UserModalChangeStatusData {
  // État de validation
  isValid: boolean;
  isLoading: boolean;

  handleConfirm: (reason?: string) => Promise<void>;
  handleCancel: () => void;

  // Données spécifiques à l'utilisateur
  username: string;
  action: "activate" | "deactivate";

  // Référence interne pour mutations (ajoutée par le provider)
  _setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}