// Exports principaux du système modal
export { DefaultFooter, default as WrapperModal } from "./WrapperModal";

// Hooks
export { useAppModal } from "./hooks/useAppModal";

// Contexts (pour déclencher l'enregistrement)
export { useModalContext } from "./contexts/DynamicModalProvider";

// Types
export type {
  ModalAction,
  ModalActions,
  ModalProps,
  WrapperModalProps,
} from "./helpers/modal-types";

// Helpers
export {
  getButtonVariantClasses,
  getModalClasses,
} from "./helpers/modal-styles";
export {
  radixDialog,
  radixDialogWithKeyboard,
  radixDialogWithRemove,
} from "./helpers/radix-integration";
