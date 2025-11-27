// Types pour le modal de réinitialisation de mot de passe avec le système ultra-pur

export interface UserResetPasswordModalData {
  // État de validation
  isValid: boolean;
  isLoading: boolean;

  handleConfirm: () => Promise<void>;
  handleCancel: () => void;

  // Données spécifiques à l'utilisateur
  username: string;
  userFullName: string;

  // Référence interne pour mutations (ajoutée par le provider)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}