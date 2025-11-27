import { type NiceModalHandler } from "@ebay/nice-modal-react";

/**
 * Helper pour intégrer NiceModal avec Radix UI Dialog
 */
export const radixDialog = (
  modal: NiceModalHandler,
  onDismiss?: () => void
) => ({
  open: modal.visible,
  onOpenChange: (open: boolean) => {
    if (!open) {
      modal.hide();
      // Appeler le callback onDismiss si fourni
      if (onDismiss) {
        onDismiss();
      }
    }
  },
});

/**
 * Helper pour intégrer NiceModal avec Radix UI Dialog avec remove automatique
 */
export const radixDialogWithRemove = (
  modal: NiceModalHandler,
  onDismiss?: () => void
) => ({
  ...radixDialog(modal, onDismiss),
  onAnimationEnd: () => {
    if (!modal.visible) modal.remove();
  },
});

/**
 * Helper pour intégrer NiceModal avec Radix UI Dialog avec gestion des touches
 */
export const radixDialogWithKeyboard = (
  modal: NiceModalHandler,
  closable = true,
  onDismiss?: () => void
) => ({
  ...radixDialog(modal, onDismiss),
  onEscapeKeyDown: (e: KeyboardEvent) => {
    if (!closable) {
      e.preventDefault();
      return;
    }
    modal.hide();
  },
  onPointerDownOutside: (e: PointerEvent) => {
    if (!closable) {
      e.preventDefault();
      return;
    }
  },
});