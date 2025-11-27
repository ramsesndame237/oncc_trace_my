"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuditLogTable } from "@/features/auditLog";
import { DocumentTable } from "@/features/document";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { showError } from "@/lib/notifications/toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useActorModal } from "../../hooks/useActorModal";
import { useGetActorById } from "../../hooks/useGetActorById";

export const TransformerViewContent: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");
  const isOnline = useOnlineStatus();

  // Validation de l'ID
  const id = entityId || "";
  const editOffline = entityType ? true : false;

  // Data fetching hooks
  const { actor, isLoading, error, refetch } = useGetActorById(id);

  // Actor store hook
  const { updateActorStatus } = useActorStore();

  // Actor modal hook
  const { confirmActorActivation, confirmActorDeactivation } = useActorModal();

  // Rafraîchir les données quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);

  // Handle actor activation
  const handleActivate = async () => {
    if (!actor?.id) return;

    try {
      const confirmed = await confirmActorActivation(actor.id, async () => {
        await updateActorStatus(actor.id, "active");
        await refetch();
      });

      if (confirmed) {
        console.log("Transformer activé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("actor:errors.activationFailed")
      );
    }
  };

  // Handle actor deactivation
  const handleDeactivate = async () => {
    if (!actor?.id) return;

    try {
      const confirmed = await confirmActorDeactivation(actor.id, async () => {
        await updateActorStatus(actor.id, "inactive");
        await refetch();
      });

      if (confirmed) {
        console.log("Transformer désactivé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("actor:errors.deactivationFailed")
      );
    }
  };

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={t("transformer.viewTitle")}
        icon={<Icon name="TransformerIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("transformer.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/actors/transformers">
              {t("transformer.backToList")}
            </Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // 2. Loading state
  if (isLoading) {
    return <LoadingFallback message={t("transformer.loadingDetails")} />;
  }

  // 3. Error state
  if (error) {
    return (
      <AppContent
        title={t("transformer.viewTitle")}
        icon={<Icon name="TransformerIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("common:actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/actors/transformers">
                {t("transformer.backToList")}
              </Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!actor) {
    return (
      <AppContent
        title={t("transformer.notFound")}
        icon={<Icon name="TransformerIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("transformer.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/actors/transformers">
              {t("transformer.backToList")}
            </Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Validate that this is actually a Transformer
  if (actor.actorType !== "TRANSFORMER") {
    return (
      <AppContent
        title={t("transformer.viewTitle")}
        icon={<Icon name="TransformerIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("transformer.notATransformer")}</p>
          <Button asChild className="mt-4">
            <Link href="/actors/transformers">
              {t("transformer.backToList")}
            </Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Format full name
  const fullName =
    [actor.givenName, actor.familyName].filter(Boolean).join(" ") ||
    actor.onccId ||
    actor.identifiantId ||
    "---";

  interface MetadataRecord {
    metaKey: string;
    metaValue: string;
  }

  // Metadata peut être soit un Record soit un tableau selon la source
  const metadataArray: MetadataRecord[] = Array.isArray(actor.metadata)
    ? actor.metadata
    : actor.metadata
    ? Object.entries(actor.metadata).map(([key, value]) => ({
        metaKey: key,
        metaValue: value as string,
      }))
    : [];

  // Transformer-specific metadata
  const creationDate =
    metadataArray.find((r) => r.metaKey === "creationDate")?.metaValue || "---";
  const headquarters =
    metadataArray.find((r) => r.metaKey === "headquarters")?.metaValue || "---";

  // Main content display
  return (
    <div className="space-y-8">
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {fullName}
            </Heading>
            {actor.status === "active" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {t("options.actorStatus.active")}
              </Badge>
            ) : actor.status === "pending" ? (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {t("options.actorStatus.pending")}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {t("options.actorStatus.inactive")}
              </Badge>
            )}
          </div>
        }
        icon={<Icon name="TransformerIcon" />}
        topActionButton={[
          // Edit button
          isOnline ? (
            <Button key="edit" asChild>
              <Link
                href={`/actors/transformers/edit?entityId=${actor.id}${
                  editOffline ? `&editOffline=true` : ""
                }`}
              >
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("common:actions.edit")}
              </Link>
            </Button>
          ) : (
            <Button key="edit" disabled>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("common:actions.edit")}
            </Button>
          ),
          // Activation/Deactivation button
          // pending → validate info | active → deactivate | inactive → activate
          actor.status === "active" ? (
            <Button
              key="deactivate"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={!isOnline}
            >
              <Icon name="PowerOffIcon" className="h-4 w-4" />
              {t("actor:actions.deactivate")}
            </Button>
          ) : actor.status === "pending" ? (
            <Button
              key="validate"
              variant="default"
              onClick={handleActivate}
              disabled={!isOnline}
            >
              <Icon name="CheckCircleIcon" className="h-4 w-4" />
              {t("actor:actions.validateInformation")}
            </Button>
          ) : (
            <Button key="activate" variant="default" onClick={handleActivate} disabled={!isOnline}>
              <Icon name="PowerIcon" className="h-4 w-4" />
              {t("actor:actions.activate")}
            </Button>
          ),
        ].filter(Boolean)}
      >
        {/* Section: Informations du Transformer */}
        <div className="space-y-6">
          <div>
            <Heading size="h3" className="mb-6">
              {t("transformer.sections.transformerInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("transformer.fields.familyName")}
                value={actor.familyName || "---"}
                noBorder
              />
              <DetailRow
                label={t("transformer.fields.givenName")}
                value={actor.givenName || "---"}
                noBorder
              />

              <DetailRow
                label={t("transformer.fields.headquarters")}
                value={headquarters}
                noBorder
              />
              <DetailRow
                label={t("transformer.fields.creationDate")}
                value={creationDate}
                noBorder
              />
              <DetailRow
                label={t("transformer.fields.locationCode")}
                value={<HierarchyDisplay code={actor.locationCode || ""} />}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Identifications */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("transformer.sections.identifications")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("transformer.fields.onccId")}
                value={actor.onccId || "---"}
                noBorder
              />
              <DetailRow
                label={t("transformer.fields.identifiantId")}
                value={actor.identifiantId || "---"}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Déclaration d'existence */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("transformer.sections.existenceDeclaration")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("transformer.fields.existenceDeclarationDate")}
                value={
                  actor.existenceDeclarationDate
                    ? dayjs(actor.existenceDeclarationDate).format(
                        "D MMMM YYYY"
                      )
                    : "---"
                }
                noBorder
              />
              <DetailRow
                label={t("transformer.fields.existenceDeclarationCode")}
                value={actor.existenceDeclarationCode || "---"}
                noBorder
              />
              <DetailRow
                label={t("transformer.fields.existenceExpiryDate")}
                value={
                  actor.existenceExpiryDate
                    ? dayjs(actor.existenceExpiryDate).format("D MMMM YYYY")
                    : "---"
                }
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Informations du compte */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("transformer.accountInfo")}
            </Heading>
            <div className="space-y-2">
              {actor.createdAt && (
                <DetailRow
                  label={t("transformer.createdAt")}
                  value={dayjs(actor.createdAt).format("D MMMM YYYY à HH:mm")}
                  noBorder
                />
              )}
              {actor.updatedAt && (
                <DetailRow
                  label={t("transformer.updatedAt")}
                  value={dayjs(actor.updatedAt).format("D MMMM YYYY à HH:mm")}
                  noBorder
                />
              )}
            </div>
          </div>
        </div>
      </AppContent>

      {/* Section: Documents */}
      <AppContent
        title={t("transformer.documents")}
        topActionButton={[
          isOnline ? (
            <Button key="manage" asChild>
              <Link
                href={`/actors/transformers/edit/documents?entityId=${actor.id}`}
              >
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("transformer.manageDocuments")}
              </Link>
            </Button>
          ) : (
            <Button key="manage" disabled>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("transformer.manageDocuments")}
            </Button>
          ),
        ].filter(Boolean)}
      >
        <DocumentTable documentableType="Actor" documentableId={actor.id} />
      </AppContent>

      {/* Section: Autres informations */}
      <AppContent
        title={t("view.otherInfo")}
        defautValue="history"
        tabContent={[
          {
            title: t("view.history"),
            key: "history",
            content: (
              <AuditLogTable auditableType="Actor" auditableId={actor.id} />
            ),
          },
        ]}
      />
    </div>
  );
};
