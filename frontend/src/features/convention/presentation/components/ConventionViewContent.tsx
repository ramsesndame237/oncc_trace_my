"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { AuditLogTable } from "@/features/auditLog";
import { useAuth } from "@/features/auth";
import { CampaignServiceProvider } from "@/features/campaign/infrastructure/di/campaignServiceProvider";
import { DocumentTable } from "@/features/document";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ConventionServiceProvider } from "../../infrastructure/di/conventionServiceProvider";
import { useConventionModal } from "../hooks/useConventionModal";
import { useGetConventionById } from "../hooks/useGetConventionById";
import { createProductColumns } from "./Columns";

export const ConventionViewContent: React.FC = () => {
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");
  const { t } = useTranslation(["convention", "common"]);
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();
  const { confirmAssociateCampaign, confirmDissociateCampaign } =
    useConventionModal();
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type BUYER ou EXPORTER
  const isActorManagerBE =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    ["BUYER", "EXPORTER"].includes(user?.actor?.actorType || "");

  // ⭐ Vérifier si l'utilisateur est un field_agent (ne peut pas modifier les conventions)
  const isFieldAgent = user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT;

  // ⭐ L'utilisateur peut gérer les conventions (créer/modifier/supprimer)
  const canManageConventions = !isFieldAgent && !isActorManagerBE;

  // Validation de l'ID
  const id = entityId || "";
  const editOffline = entityType ? true : false;

  // Data fetching hook
  const { convention, isLoading, error, refetch } = useGetConventionById(id);

  // État pour la campagne active
  const [activeCampaignName, setActiveCampaignName] = useState<string | null>(
    null
  );
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Charger la campagne active au montage
  useEffect(() => {
    const loadActiveCampaign = async () => {
      try {
        const getActiveCampaignUseCase =
          CampaignServiceProvider.getGetActiveCampaignUseCase();
        const activeCampaign = await getActiveCampaignUseCase.execute(isOnline);

        if (activeCampaign) {
          setActiveCampaignName(activeCampaign.code);
          setActiveCampaignId(activeCampaign.id);
        } else {
          setActiveCampaignName(null);
          setActiveCampaignId(null);
        }
      } catch (error) {
        console.error("Error loading active campaign:", error);
        setActiveCampaignName(null);
        setActiveCampaignId(null);
      }
    };

    loadActiveCampaign();
  }, [isOnline]);

  // Créer les colonnes pour le DataTable (sans actions)
  const columns = useMemo(
    () =>
      createProductColumns({
        t,
        showActions: false,
      }),
    [t]
  );

  // Gérer l'association à la campagne active
  const handleAssociateCampaign = async () => {
    if (!convention || !activeCampaignId) return;

    try {
      const associateUseCase =
        ConventionServiceProvider.getAssociateConventionToCampaignUseCase();
      await associateUseCase.execute(convention.id, activeCampaignId, isOnline);

      toast.success(t("messages.updateSuccess"));
      refetch();
    } catch (error) {
      console.error("Error associating convention to campaign:", error);
      throw error;
    }
  };

  // Ouvrir le modal d'association
  const handleOpenAssociateModal = async () => {
    if (!convention) return;

    if (!activeCampaignName) {
      toast.error(t("modals.associateCampaign.noCampaignError"));
      return;
    }

    try {
      const confirmed = await confirmAssociateCampaign(
        convention.id,
        activeCampaignName,
        handleAssociateCampaign
      );

      if (confirmed) {
        console.log("Convention associated to campaign");
      }
    } catch (error) {
      console.error("Error associating convention:", error);
      toast.error(t("messages.updateError"));
    }
  };

  // Gérer la dissociation de la campagne
  const handleDissociateCampaign = async () => {
    if (
      !convention ||
      !convention.campaigns ||
      convention.campaigns.length === 0
    )
      return;

    const campaign = convention.campaigns[0];

    try {
      const dissociateUseCase =
        ConventionServiceProvider.getDissociateConventionFromCampaignUseCase();
      await dissociateUseCase.execute(convention.id, campaign.id, isOnline);

      toast.success(t("messages.updateSuccess"));
      refetch();
    } catch (error) {
      console.error("Error dissociating convention from campaign:", error);
      throw error;
    }
  };

  // Ouvrir le modal de dissociation
  const handleOpenDissociateModal = async () => {
    if (
      !convention ||
      !convention.campaigns ||
      convention.campaigns.length === 0
    )
      return;

    const campaign = convention.campaigns[0];

    try {
      const confirmed = await confirmDissociateCampaign(
        convention.id,
        campaign.id,
        campaign.year.toString(),
        handleDissociateCampaign
      );

      if (confirmed) {
        console.log("Convention dissociated from campaign");
      }
    } catch (error) {
      console.error("Error dissociating convention:", error);
      toast.error(t("messages.updateError"));
    }
  };

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={t("common:messages.error")}
        icon={<Icon name="FileTextIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/conventions">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // 2. Loading state
  if (isLoading) {
    return <LoadingFallback message={t("view.loadingDetails")} />;
  }

  // 3. Error state
  if (error) {
    return (
      <AppContent
        title={t("common:messages.error")}
        icon={<Icon name="FileTextIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("common:actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/conventions">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!convention) {
    return (
      <AppContent
        title={t("view.notFound")}
        icon={<Icon name="FileTextIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/conventions">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Status badge
  const getStatusBadge = () => {
    const status = convention.status;

    if (status === "inactive") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          {t("status.inactive")}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        {t("status.active")}
      </Badge>
    );
  };

  // Main content display
  return (
    <div className="space-y-8">
      {/* Section principale: Détails de la convention */}
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {convention.code}
            </Heading>
            {getStatusBadge()}
          </div>
        }
        icon={<Icon name="ConventionIcon" />}
        topActionButton={[
          // ⭐ Bouton d'association/dissociation (caché pour field_agent et BUYER/EXPORTER)
          ...(canManageConventions
            ? convention.status === "inactive"
              ? [
                  <Button
                    key="associate"
                    variant="default"
                    onClick={handleOpenAssociateModal}
                    disabled={!activeCampaignName || !isOnline}
                  >
                    <Icon name="LinkIcon" className="h-4 w-4" />
                    {t("modals.associateCampaign.confirmButton")}
                  </Button>,
                ]
              : [
                  // Bouton de dissociation (si la convention est active)
                  <Button
                    key="dissociate"
                    variant="destructive"
                    onClick={handleOpenDissociateModal}
                    disabled={!isOnline}
                  >
                    <Icon name="UnlinkIcon" className="h-4 w-4" />
                    {t("modals.dissociateCampaign.confirmButton")}
                  </Button>,
                ]
            : []),
          // ⭐ Bouton Edit (caché pour field_agent et BUYER/EXPORTER)
          ...(canManageConventions
            ? [
                isOnline ? (
                  <Button key="edit" asChild>
                    <Link
                      href={`/conventions/edit?entityId=${convention.id}${
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
              ]
            : []),
        ]}
      >
        <div className="space-y-6">
          {/* Informations de base */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("form.summary.basicInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("form.step1.buyerExporter")}
                value={
                  convention.buyerExporter
                    ? `${convention.buyerExporter.familyName} ${
                        convention.buyerExporter.givenName
                      }${
                        convention.buyerExporter.onccId
                          ? ` (${convention.buyerExporter.onccId})`
                          : ""
                      }`
                    : "---"
                }
                noBorder
              />
              <DetailRow
                label={t("form.step1.opa")}
                value={
                  convention.producers
                    ? `${convention.producers.familyName} ${
                        convention.producers.givenName
                      }${
                        convention.producers.onccId
                          ? ` (${convention.producers.onccId})`
                          : ""
                      }`
                    : "---"
                }
                noBorder
              />
              <DetailRow
                label={t("form.step1.signatureDate")}
                value={dayjs(convention.signatureDate).format("DD MMMM YYYY")}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Produits */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <Heading size="h3">
                {t("form.summary.productsTitle")} ({convention.products.length})
              </Heading>
              {/* ⭐ Bouton Edit products (caché pour field_agent et BUYER/EXPORTER) */}
              {canManageConventions &&
                (isOnline ? (
                  <Link
                    href={`/conventions/edit-products?entityId=${convention.id}${
                      editOffline ? `&editOffline=true` : ""
                    }`}
                  >
                    <Button variant="outline" size="sm">
                      <Icon name="EditIcon" className="h-4 w-4 mr-2" />
                      {t("common:actions.edit")}
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <Icon name="EditIcon" className="h-4 w-4 mr-2" />
                    {t("common:actions.edit")}
                  </Button>
                ))}
            </div>
            {convention.products.length > 0 ? (
              <>
                <DataTable
                  columns={
                    columns as unknown as ColumnDef<
                      (typeof convention.products)[0]
                    >[]
                  }
                  data={convention.products}
                  isMobile={isMobile}
                  pageSize={10}
                  emptyMessage={t("form.step2.validation.atLeastOneProduct")}
                />
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {t("form.step2.validation.atLeastOneProduct")}
              </p>
            )}
          </div>

          <Separator />

          {/* Métadonnées */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.metadata")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.createdAt")}
                value={dayjs(convention.createdAt).format(
                  "DD MMMM YYYY [à] HH:mm"
                )}
                noBorder
              />
              <DetailRow
                label={t("view.updatedAt")}
                value={dayjs(convention.updatedAt).format(
                  "DD MMMM YYYY [à] HH:mm"
                )}
                noBorder
              />
            </div>
          </div>
        </div>
      </AppContent>

      {/* Section: Documents */}
      <AppContent
        title={t("form.summary.documents")}
        topActionButton={[
          // ⭐ Bouton Manage documents (caché pour field_agent et BUYER/EXPORTER)
          ...(canManageConventions
            ? [
                isOnline ? (
                  <Button key="manage-documents" asChild>
                    <Link
                      href={`/conventions/edit/documents?entityId=${convention.id}`}
                    >
                      <Icon name="EditIcon" className="h-4 w-4" />
                      {t("common:actions.manage")}
                    </Link>
                  </Button>
                ) : (
                  <Button key="manage-documents" disabled>
                    <Icon name="EditIcon" className="h-4 w-4" />
                    {t("common:actions.manage")}
                  </Button>
                ),
              ]
            : []),
        ]}
      >
        <DocumentTable
          documentableType="Convention"
          documentableId={convention.id}
        />
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
              <AuditLogTable
                auditableType="convention"
                auditableId={convention.id}
              />
            ),
          },
        ]}
      />
    </div>
  );
};
