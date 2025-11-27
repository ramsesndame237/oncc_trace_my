import React from "react";

export interface UserEditPasswordModalData {
  isValid: boolean;
  isLoading: boolean;
  handleConfirm: (currentPassword: string, newPassword: string) => Promise<void>;
  handleCancel: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}
