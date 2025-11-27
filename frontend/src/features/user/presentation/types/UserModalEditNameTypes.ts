// Types pour le modal de modification du nom

export interface UserEditNameModalData {
  // État de validation
  isValid: boolean;
  isLoading: boolean;

  handleConfirm: (givenName?: string, familyName?: string) => Promise<void>;
  handleCancel: () => void;

  // Référence interne pour mutations (ajoutée par le provider)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}
