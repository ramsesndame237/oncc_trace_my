"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { getModalClasses } from "./helpers/modal-styles";
import {
  type ModalAction,
  type WrapperModalProps,
} from "./helpers/modal-types";
import { radixDialogWithKeyboard } from "./helpers/radix-integration";

interface DefaultFooterProps {
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  onClose: () => void;
}

export const DefaultFooter: React.FC<DefaultFooterProps> = ({
  primaryAction,
  secondaryAction,
  onClose,
}) => {
  const handlePrimaryAction = async () => {
    if (primaryAction?.onClick) {
      try {
        await primaryAction.onClick();
      } catch (error) {
        console.error("Error in primary action:", error);
      }
    }
  };

  const handleSecondaryAction = async () => {
    if (secondaryAction?.onClick) {
      try {
        await secondaryAction.onClick();
      } catch (error) {
        console.error("Error in secondary action:", error);
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
      {secondaryAction && (
        <Button
          type={secondaryAction.type || "button"}
          variant={
            secondaryAction.variant === "success"
              ? "secondary"
              : (secondaryAction.variant as
                  | "outline"
                  | "ghost"
                  | "default"
                  | "destructive") || "outline"
          }
          onClick={handleSecondaryAction}
          disabled={secondaryAction.disabled || secondaryAction.loading}
          className="w-full sm:w-auto"
          key={secondaryAction.key}
          form={secondaryAction.form}
        >
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button
          type={primaryAction.type || "button"}
          variant={
            primaryAction.variant === "success"
              ? "secondary"
              : (primaryAction.variant as
                  | "outline"
                  | "ghost"
                  | "default"
                  | "destructive") || "default"
          }
          onClick={handlePrimaryAction}
          disabled={primaryAction.disabled || primaryAction.loading}
          className="w-full sm:w-auto"
          key={primaryAction.key}
          form={primaryAction.form}
        >
          {primaryAction.loading ? "..." : primaryAction.label}
        </Button>
      )}
    </div>
  );
};

const WrapperModal = NiceModal.create<WrapperModalProps>((props) => {
  const modal = useModal();
  const closable = props.closable !== false;

  // Récupérer le callback onDismiss depuis contextData si disponible
  const onDismiss = props.contextData?.onDismiss as (() => void) | undefined;

  const dialogProps = radixDialogWithKeyboard(modal, closable, onDismiss);

  // ✅ Contenu du modal
  const modalContent = (
    <Dialog {...dialogProps}>
      <DialogContent className={getModalClasses(props)}>
        {/* Header avec titre et description optionnels */}
        {(props.title || props.description) && (
          <DialogHeader>
            {props.title && (
              <DialogTitle className="text-left">{props.title}</DialogTitle>
            )}
            {props.description ? (
              <DialogDescription className="text-left">
                {props.description}
              </DialogDescription>
            ) : (
              // ⭐ DialogDescription vide pour l'accessibilité (Radix UI requiert DialogDescription ou aria-describedby)
              <DialogDescription className="sr-only">
                {props.title || "Modal"}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {/* Contenu injecté */}
        <div className="modal-content py-2">{props.content}</div>

        {/* Footer avec actions ou contenu personnalisé */}
        {props.footer && <DialogFooter>{props.footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );

  // ✅ Wrapper avec contexte si nécessaire
  if (props.contextProvider && props.contextData) {
    const ContextProvider = props.contextProvider;
    return (
      <ContextProvider initialData={props.contextData}>
        {modalContent}
      </ContextProvider>
    );
  }

  // ✅ Modal normal sans contexte
  return modalContent;
});

export default WrapperModal;
