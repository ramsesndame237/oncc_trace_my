import React from "react";

export interface UserEditPhoneModalData {
  isValid: boolean;
  isLoading: boolean;
  handleConfirm: (phone?: string) => Promise<void>;
  handleCancel: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}
