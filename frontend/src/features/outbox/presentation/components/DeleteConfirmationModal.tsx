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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectableText } from "@/components/ui/selectable-text";
import { db } from "@/core/infrastructure/database/db";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { OutboxOperationDetails } from "../../domain/outbox.types";
import { useOutboxStore } from "../../infrastructure/store/outboxStore";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operations: OutboxOperationDetails[];
  onConfirm?: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  operations,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const { t } = useTranslation(["outbox", "common"]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { deleteOperation } = useOutboxStore();

  const isSingleOperation = operations.length === 1;
  const operation = operations[0];

  const expectedValue = isSingleOperation
    ? operation.entityId
    : t("deleteModal.operationsCount", { count: operations.length });

  const handleConfirm = async () => {
    if (inputValue !== expectedValue) return;

    setIsLoading(true);
    try {
      if (onConfirm) {
        onConfirm();
      } else if (isSingleOperation) {
        // ✅ Si l'entité est un acteur, supprimer l'acteur local avec le localId
        if (operation.entityType === "actor") {
          const payload = operation.payload as Record<string, unknown>;
          const localId = payload.localId as string | undefined;

          if (localId) {
            console.log(
              `[DeleteModal] 🗑️ Suppression acteur avec localId: ${localId}`
            );

            // Supprimer l'acteur de la table actors
            const actorToDelete = await db.actors
              .where("localId")
              .equals(localId)
              .first();

            if (actorToDelete) {
              await db.actors.delete(actorToDelete.id!);
              console.log(
                `[DeleteModal] ✅ Acteur supprimé: ${actorToDelete.familyName} ${actorToDelete.givenName}`
              );
            } else {
              console.warn(
                `[DeleteModal] ⚠️ Acteur non trouvé avec localId: ${localId}`
              );
            }
          }
        }

        // Supprimer le pendingOperation
        await deleteOperation(operation.id!);
      }
      handleClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  const isValid = inputValue === expectedValue;

  if (operations.length === 0) {
    return null;
  }

  const title = isSingleOperation
    ? t("deleteModal.titleSingle")
    : t("deleteModal.titleMultiple");

  const descriptionContent = isSingleOperation ? (
    <Trans
      i18nKey="deleteModal.descriptionSingle"
      ns="outbox"
      values={{
        name: operation.entityName || operation.entityId,
        entityId: operation.entityId,
      }}
      components={{
        b: <b />,
        SelectableText: <SelectableText>{""}</SelectableText>,
      }}
    />
  ) : (
    <Trans
      i18nKey="deleteModal.descriptionMultiple"
      ns="outbox"
      values={{ count: operations.length }}
      components={{
        b: <b />,
        SelectableText: <SelectableText>{""}</SelectableText>,
      }}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionContent}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              {t("deleteModal.confirmLabel")}
            </Label>
            <Input
              id="confirmation"
              placeholder={t("deleteModal.confirmPlaceholder", {
                value: expectedValue,
              })}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className={!isValid && inputValue ? "border-red-500" : ""}
            />
            {!isValid && inputValue && (
              <p className="text-sm text-red-500">
                {t("deleteModal.confirmError")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? t("deleteModal.deleting")
              : t("deleteModal.deleteButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
