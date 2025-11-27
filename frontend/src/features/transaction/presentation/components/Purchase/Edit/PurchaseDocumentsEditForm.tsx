"use client";

import FormDocumentUploadWithOption from "@/components/forms/form-documentUploadWithOption";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { useDocumentModal } from "@/features/document";
import type { Document } from "@/features/document/domain/document.types";
import { blobToBase64 } from "@/lib/blobToBase64";
import type { IFileValue } from "@/types/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useGetTransactionById } from "../../../hooks/useGetTransactionById";
import { usePurchaseOptions } from "../../../hooks/usePurchaseOptions";
import {
  createPurchaseStep3DocumentsSchema,
  type PurchaseStep3DocumentsData,
} from "../../../schemas/purchase-validation-schemas";
import { PurchaseFormLayout } from "../PurchaseFormLayout";

export function PurchaseDocumentsEditForm() {
  const { t } = useTranslation(["transaction", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("entityId");

  const { purchaseContractDocuments } = usePurchaseOptions();
  const { showDocumentPreview } = useDocumentModal();

  // Créer le schéma de validation dynamique
  const validationSchema = createPurchaseStep3DocumentsSchema(t);

  // Form setup
  const form = useForm<PurchaseStep3DocumentsData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      purchaseContractDocuments: [],
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const documentsLoadedRef = useRef(false);

  // Récupérer les informations de la transaction
  const { transaction, isLoading: isLoadingTransaction, error } = useGetTransactionById(
    transactionId || "",
    true
  );

  // Vérifier si la transaction peut être éditée
  const canEdit = transaction?.status === "pending";

  // Construire le titre de la transaction
  const transactionTitle = transaction
    ? `${t("transaction:view.title")} - ${transaction.buyer?.familyName || ""} ${
        transaction.buyer?.givenName || ""
      } / ${transaction.seller?.familyName || ""} ${
        transaction.seller?.givenName || ""
      }`
    : t("transaction:purchaseAdd.steps.documents");

  // Fonction pour obtenir la taille réelle d'un fichier depuis son URL
  const getFileSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentLength = response.headers.get("Content-Length");
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  };

  // Charger les documents existants
  useEffect(() => {
    const loadDocuments = async () => {
      // Ne charger qu'une seule fois
      if (!transactionId || documentsLoadedRef.current) return;
      documentsLoadedRef.current = true;

      try {
        const getDocumentsUseCase =
          ServiceProvider.Document.getGetDocumentsUseCase();
        const result = await getDocumentsUseCase.execute(
          {
            documentableType: "Transaction",
            documentableId: transactionId,
          },
          true // isOnline
        );

        // Stocker les documents existants
        setExistingDocuments(result.documents);

        // Convertir les documents existants au format du formulaire
        const purchaseContractDocTypes = new Set<string>(
          purchaseContractDocuments.map((d) => d.value)
        );

        const contractDocs: IFileValue[] = [];

        // Charger les documents avec leur taille réelle
        for (const doc of result.documents) {
          const docType = doc.documentType || "";

          // Construire l'URL du document
          const documentUrl =
            doc.publicUrl ||
            (doc.storagePath ? `/storage/${doc.storagePath}` : null);

          if (!documentUrl) {
            continue;
          }

          // Obtenir la taille réelle du fichier
          let fileSize =
            typeof doc.size === "string"
              ? parseInt(doc.size, 10)
              : doc.size || 0;
          if (!fileSize || fileSize === 0) {
            fileSize = await getFileSize(documentUrl);
          }

          // Créer un objet IFileValue
          const fileValue: IFileValue = {
            optionValues: ["", docType],
            type: doc.mimeType || "application/octet-stream",
            data: documentUrl,
            fileSize: fileSize,
            name: doc.originalName || docType,
            id: doc.id,
          };

          if (purchaseContractDocTypes.has(docType)) {
            contractDocs.push(fileValue);
          }
        }

        // Pré-remplir le formulaire avec les documents existants
        form.reset(
          {
            purchaseContractDocuments: contractDocs,
          },
          {
            keepErrors: false,
            keepDirty: false,
            keepIsSubmitted: false,
            keepTouched: false,
            keepIsValid: false,
            keepSubmitCount: false,
          }
        );

        // Forcer la revalidation après le reset
        setTimeout(async () => {
          await form.trigger();
        }, 200);
      } catch {
        toast.error(t("common:messages.error"));
      }
    };

    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, t]);

  const handleSubmit = useCallback(
    async (data: PurchaseStep3DocumentsData) => {
      if (!transactionId) {
        toast.error(t("transaction:view.invalidId"));
        return;
      }

      if (!canEdit) {
        toast.error(t("transaction:messages.cannotEditNonPending"));
        return;
      }

      setIsLoading(true);
      try {
        // Préparer les données pour le sync
        const allDocuments = [...(data.purchaseContractDocuments || [])];

        const documentsToKeep: string[] = [];
        const documentsToAdd: Array<{ file: File; documentType: string }> = [];

        // Traiter les documents de manière asynchrone pour gérer la conversion Blob
        for (const doc of allDocuments) {
          // Vérifier si c'est un document existant (son data est une URL HTTP/HTTPS)
          const isExistingDocument =
            typeof doc.data === "string" &&
            (doc.data.startsWith("http://") ||
              doc.data.startsWith("https://") ||
              doc.data.startsWith("/storage/"));

          if (isExistingDocument) {
            // Document existant - trouver son ID et le conserver
            const existingDoc = existingDocuments.find(
              (d) =>
                (d.publicUrl === doc.data || d.storagePath === doc.data) &&
                d.documentType === doc.optionValues[1]
            );
            if (existingDoc) {
              documentsToKeep.push(existingDoc.id);
            }
          } else {
            // Nouveau document - à ajouter
            let base64Data: string;

            // Si c'est un Blob, le convertir en base64
            if (doc.data instanceof Blob) {
              base64Data = await blobToBase64(doc.data);
            } else {
              // C'est déjà une string base64
              base64Data = doc.data as string;
            }

            const mimeType = doc.type;
            const documentType = String(doc.optionValues[1]);

            // Extraire les données base64
            const base64String = base64Data.split(",")[1] || base64Data;
            const byteCharacters = atob(base64String);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File(
              [blob],
              `document_${Date.now()}.${mimeType.split("/")[1]}`,
              {
                type: mimeType,
              }
            );

            documentsToAdd.push({ file, documentType });
          }
        }

        // Calculer les documents à supprimer
        const documentsToDelete: string[] = existingDocuments
          .map((doc) => doc.id)
          .filter((id) => !documentsToKeep.includes(id));

        // Appeler le use case de synchronisation
        const syncDocumentsUseCase =
          ServiceProvider.Document.getSyncDocumentsUseCase();
        await syncDocumentsUseCase.execute(
          {
            documentableType: "Transaction",
            documentableId: transactionId,
            documentsToKeep,
            documentsToAdd,
            documentsToDelete,
          },
          true // isOnline
        );

        toast.success(t("common:messages.success"));
        router.replace(`/transactions/view?entityId=${transactionId}`);
      } catch {
        toast.error(t("common:messages.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [transactionId, router, existingDocuments, t, canEdit]
  );

  const handleCancel = useCallback(() => {
    if (!transactionId) return;
    router.push(`/transactions/view?entityId=${transactionId}`);
  }, [transactionId, router]);

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

  // Affichage pendant le chargement
  if (isLoadingTransaction) {
    return <LoadingFallback />;
  }

  // Affichage si erreur
  if (error || !transaction) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          {error || t("transaction:view.invalidId")}
        </p>
      </div>
    );
  }

  // Affichage si la transaction ne peut pas être éditée
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          {t("transaction:messages.cannotEditNonPending")}
        </p>
      </div>
    );
  }

  // Vérifier si le bouton enregistrer doit être activé
  const isSaveButtonEnabled = form.formState.isValid && !isLoading;

  // Boutons du footer
  const footerButtons = [
    <Button
      key="save"
      type="submit"
      onClick={form.handleSubmit(handleSubmit)}
      disabled={!isSaveButtonEnabled}
      className="flex items-center space-x-2"
    >
      {isLoading ? (
        <>
          <Icon name="Loader2" className="animate-spin" />
          <span>{t("common:messages.saving")}</span>
        </>
      ) : (
        <span>{t("common:actions.save")}</span>
      )}
    </Button>,
  ];

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:purchaseAdd.steps.documents")}
      </h1>
    </div>
  );

  if (!transactionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("transaction:view.invalidId")}</p>
      </div>
    );
  }

  return (
    <PurchaseFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={transactionTitle}
      onHandleCancel={handleCancel}
    >
      {/* Bouton Retour AVANT le BaseCard */}
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>

      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
        classNameFooter="!justify-between"
      >
        <Form {...form}>
          <form className="space-y-8">
            {/* Upload du contrat d'achat */}
            <div className="lg:w-2/3">
              <FormDocumentUploadWithOption
                form={form}
                name="purchaseContractDocuments"
                label={t("transaction:purchaseAdd.fields.purchaseContract")}
                description={
                  <span className="text-sm text-amber-600 mt-1">
                    {t("transaction:purchaseAdd.fields.purchaseContractDescription")}
                  </span>
                }
                placeholder={t("transaction:purchaseAdd.fields.purchaseContract")}
                options={purchaseContractDocuments}
                required
                maxSizeMB={10}
                labelButton={t("common:actions.upload")}
                defaultFiles={form.getValues("purchaseContractDocuments") || []}
                onPreviewClick={handlePreviewClick}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </PurchaseFormLayout>
  );
}
