"use client";

import FormDocumentUploadWithOption from "@/components/forms/form-documentUploadWithOption";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
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
import { useProducerOptions } from "../../hooks/useActorOptions";
import { useGetActorById } from "../../hooks/useGetActorById";
import {
  createStep3DocumentsSchemaWithValidation,
  type Step3DocumentsData,
} from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerEditDocuments() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const actorId = searchParams.get("entityId");

  const {
    pictureProducerDocuments,
    landProducerDocuments,
    complementDocuments,
  } = useProducerOptions();

  // Créer le schéma de validation dynamique avec les documents requis
  const validationSchema = createStep3DocumentsSchemaWithValidation(
    t,
    pictureProducerDocuments
  );

  // Form setup
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      producerDocuments: [],
      landProofDocuments: [],
      complementaryDocuments: [],
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true); // Commence à true pour éviter les erreurs de validation pendant le chargement
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const documentsLoadedRef = useRef(false); // Track if documents have been loaded

  // Récupérer les informations du producteur
  const { actor } = useGetActorById(actorId || "");

  // Construire le nom complet du producteur
  const producerName = actor
    ? [actor.givenName, actor.familyName].filter(Boolean).join(" ") ||
      actor.onccId ||
      actor.identifiantId ||
      t("form.producer")
    : t("form.producer");

  // Fonction pour obtenir la taille réelle d'un fichier depuis son URL
  const getFileSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentLength = response.headers.get("Content-Length");
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      console.warn(`Impossible d'obtenir la taille du fichier: ${url}`, error);
      return 0;
    }
  };

  // Charger les documents existants
  useEffect(() => {
    const loadDocuments = async () => {
      // Ne charger qu'une seule fois
      if (!actorId || documentsLoadedRef.current) return;
      documentsLoadedRef.current = true;

      setIsLoadingDocuments(true);
      try {
        const getDocumentsUseCase =
          ServiceProvider.Document.getGetDocumentsUseCase();
        const result = await getDocumentsUseCase.execute(
          {
            documentableType: "Actor",
            documentableId: actorId,
          },
          true // isOnline
        );

        // Stocker les documents existants
        setExistingDocuments(result.documents);

        // Convertir les documents existants au format du formulaire
        const pictureDocTypes = new Set<string>(
          pictureProducerDocuments.map((d) => d.value)
        );
        const landDocTypes = new Set<string>(
          landProducerDocuments.map((d) => d.value)
        );
        const complementDocTypes = new Set<string>(
          complementDocuments.map((d) => d.value)
        );

        const producerDocs: IFileValue[] = [];
        const landDocs: IFileValue[] = [];
        const complementDocs: IFileValue[] = [];

        // Charger les documents avec leur taille réelle
        for (const doc of result.documents) {
          const docType = doc.documentType || "";

          // Construire l'URL du document
          const documentUrl =
            doc.publicUrl ||
            (doc.storagePath ? `/storage/${doc.storagePath}` : null);

          if (!documentUrl) {
            console.warn(`Document ${doc.id} n'a pas d'URL disponible`);
            continue;
          }

          // Obtenir la taille réelle du fichier (convertir en number si c'est une string)
          let fileSize =
            typeof doc.size === "string"
              ? parseInt(doc.size, 10)
              : doc.size || 0;
          if (!fileSize || fileSize === 0) {
            // Si le backend ne fournit pas la taille, on la récupère via une requête HEAD
            fileSize = await getFileSize(documentUrl);
          }

          // Créer directement un objet IFileValue
          const fileValue: IFileValue = {
            optionValues: ["", docType],
            type: doc.mimeType || "application/octet-stream",
            data: documentUrl,
            fileSize: fileSize,
            name: doc.originalName || docType,
            id: doc.id,
          };

          if (pictureDocTypes.has(docType)) {
            producerDocs.push(fileValue);
          } else if (landDocTypes.has(docType)) {
            landDocs.push(fileValue);
          } else if (complementDocTypes.has(docType)) {
            complementDocs.push(fileValue);
          }
        }

        // Pré-remplir le formulaire avec les documents existants
        form.reset(
          {
            producerDocuments: producerDocs,
            landProofDocuments: landDocs,
            complementaryDocuments: complementDocs,
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
      } catch (error) {
        console.error("Erreur lors du chargement des documents:", error);
        toast.error(t("documents.loadError"));
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId, t]); // Uniquement actorId pour éviter la boucle infinie

  const handleSubmit = useCallback(
    async (data: Step3DocumentsData) => {
      if (!actorId) {
        toast.error(t("documents.missingActorId"));
        return;
      }

      setIsLoading(true);
      try {
        // Préparer les données pour le sync
        const allDocuments = [
          ...(data.producerDocuments || []),
          ...(data.landProofDocuments || []),
          ...(data.complementaryDocuments || []),
        ];

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

        // Calculer les documents à supprimer (existants qui ne sont plus dans le formulaire)
        const documentsToDelete: string[] = existingDocuments
          .map((doc) => doc.id)
          .filter((id) => !documentsToKeep.includes(id));

        // Appeler le use case de synchronisation via le ServiceProvider
        const syncDocumentsUseCase =
          ServiceProvider.Document.getSyncDocumentsUseCase();
        await syncDocumentsUseCase.execute(
          {
            documentableType: "Actor",
            documentableId: actorId,
            documentsToKeep,
            documentsToAdd,
            documentsToDelete,
          },
          true // isOnline
        );

        toast.success(t("documents.saveSuccess"));
        router.replace(`/actors/producer/view?entityId=${actorId}`);
      } catch (error) {
        console.error("Erreur lors de l'enregistrement des documents:", error);
        toast.error(t("documents.saveError"));
      } finally {
        setIsLoading(false);
      }
    },
    [actorId, router, existingDocuments, t]
  );

  const handleCancel = useCallback(() => {
    if (!actorId) return;
    router.push(`/actors/producer/view?entityId=${actorId}`);
  }, [actorId, router]);

  const { showDocumentPreview } = useDocumentModal();

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

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

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("documents.pageTitle")}
      </h1>
    </div>
  );

  if (!actorId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("documents.missingActorId")}</p>
      </div>
    );
  }

  return (
    <ProducerFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={t("documents.title", { name: producerName })}
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("form.back")}</span>
        </Button>
      </div>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
      >
        {isLoadingDocuments ? (
          <div className="p-4 text-center text-muted-foreground">
            {t("documents.loading")}
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-8" id="producer-documents-form">
              {/* Section 1: Informations sur le producteur */}
              <div className="lg:w-2/3">
                <FormDocumentUploadWithOption
                  form={form}
                  name="producerDocuments"
                  label={t("documents.producerDocuments")}
                  options={pictureProducerDocuments}
                  labelButton={t("documents.uploadButton")}
                  placeholder={t("documents.producerDocumentsPlaceholder")}
                  maxSizeMB={2}
                  defaultFiles={form.getValues("producerDocuments") || []}
                  required
                  description={
                    <span className="text-sm text-amber-600 mt-1">
                      {t("documents.allDocumentsRequired")}
                    </span>
                  }
                  onPreviewClick={handlePreviewClick}
                />
              </div>

              <Separator className="my-4 lg:hidden" />

              {/* Section 2: Preuves de terrain */}
              <div className="lg:w-2/3">
                <FormDocumentUploadWithOption
                  form={form}
                  name="landProofDocuments"
                  label={t("documents.landProofDocuments")}
                  options={landProducerDocuments}
                  placeholder={t("documents.landProofDocumentsPlaceholder")}
                  labelButton={t("documents.uploadButton")}
                  defaultFiles={form.getValues("landProofDocuments") || []}
                  onPreviewClick={handlePreviewClick}
                />
              </div>

              <Separator className="my-4 lg:hidden" />

              {/* Section 3: Autres documents (pleine largeur) */}
              <div className="lg:w-2/3">
                <FormDocumentUploadWithOption
                  form={form}
                  name="complementaryDocuments"
                  label={t("documents.complementaryDocuments")}
                  options={complementDocuments}
                  placeholder={t("documents.complementaryDocumentsPlaceholder")}
                  labelButton={t("documents.uploadButton")}
                  defaultFiles={form.getValues("complementaryDocuments") || []}
                  onPreviewClick={handlePreviewClick}
                />
              </div>
            </form>
          </Form>
        )}
      </BaseCard>
    </ProducerFormLayout>
  );
}
