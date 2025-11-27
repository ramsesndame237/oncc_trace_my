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
import { DocumentTable } from "@/features/document";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ProductItem } from "../../domain";
import { useProductTransferStore } from "../../infrastructure/store/productTransferStore";
import { useGetProductTransferById } from "../hooks/useGetProductTransferById";
import { useProductTransferModal } from "../hooks/useProductTransferModal";

export const ProductTransferViewContent: React.FC = () => {
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const { t } = useTranslation("productTransfer");
  const { t: tCommon } = useTranslation("common");
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager
  const isActorManager = user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER;

  // ⭐ Vérifier si l'utilisateur est un field_agent (ne peut pas modifier les transferts)
  const isFieldAgent = user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT;

  // ⭐ L'utilisateur peut gérer les transferts (créer/modifier/supprimer)
  const canManageTransfers = !isFieldAgent;

  // Validation de l'ID
  const id = entityId || "";

  // Data fetching hook
  const { productTransfer, isLoading, error, refetch } =
    useGetProductTransferById(id, isOnline);

  // Store et modal
  const { updateTransferStatus } = useProductTransferStore();
  const { confirmCancelTransfer } = useProductTransferModal();

  // Handler pour annuler le transfert
  const handleCancelTransfer = async () => {
    if (!productTransfer) return;

    try {
      await updateTransferStatus(productTransfer.id, "cancelled");
      toast.success(t("messages.cancelSuccess"));
      refetch();
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      throw error;
    }
  };

  // Handler pour ouvrir le modal d'annulation
  const handleOpenCancelModal = async () => {
    if (!productTransfer) return;

    try {
      const confirmed = await confirmCancelTransfer(
        productTransfer.code,
        handleCancelTransfer
      );

      if (confirmed) {
        console.log("Transfer cancelled");
      }
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      toast.error(t("messages.cancelError"));
    }
  };

  // Colonnes pour le tableau des produits
  const productColumns = useMemo<ColumnDef<ProductItem>[]>(
    () => [
      {
        accessorKey: "quality",
        header: t("view.products.quality"),
        cell: ({ row }) => {
          const qualityKey = row.original.quality;
          const qualityMap: Record<string, string> = {
            grade_1: t("form.step2.qualityOptions.grade1"),
            grade_2: t("form.step2.qualityOptions.grade2"),
            hs: t("form.step2.qualityOptions.hs"),
          };
          return (
            <span className="font-medium">
              {qualityMap[qualityKey] || qualityKey}
            </span>
          );
        },
      },
      {
        accessorKey: "weight",
        header: t("view.products.weight"),
        cell: ({ row }) => (
          <span>
            {row.original.weight.toLocaleString("fr-FR")}{" "}
            {t("view.products.kg")}
          </span>
        ),
      },
      {
        accessorKey: "numberOfBags",
        header: t("view.products.numberOfBags"),
        cell: ({ row }) => <span>{row.original.numberOfBags}</span>,
      },
    ],
    [t]
  );

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={tCommon("messages.error")}
        icon={<Icon name="PackageIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/product-transfers">{t("view.backToList")}</Link>
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
        title={tCommon("messages.error")}
        icon={<Icon name="PackageIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {tCommon("actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/product-transfers">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!productTransfer) {
    return (
      <AppContent title={t("view.notFound")} icon={<Icon name="PackageIcon" />}>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/product-transfers">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Status badge
  const getStatusBadge = () => {
    const status = productTransfer.status;

    if (status === "validated") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          {t("statuses.validated")}
        </Badge>
      );
    } else if (status === "cancelled") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          {t("statuses.cancelled")}
        </Badge>
      );
    } else if (status === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          {t("statuses.pending")}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
        {t("statuses.pending")}
      </Badge>
    );
  };

  // Main content display
  return (
    <div className="space-y-8">
      {/* Section principale: Détails du transfert */}
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {t("view.transferTitle")} {productTransfer.code}
            </Heading>
            {getStatusBadge()}
          </div>
        }
        icon={<Icon name="TransfertIcon" />}
        topActionButton={[
          // Edit button (for GROUPAGE and STANDARD transfers) - caché pour field_agent
          canManageTransfers &&
            (productTransfer.transferType === "GROUPAGE" ||
              productTransfer.transferType === "STANDARD") &&
            (isOnline ? (
              <Button key="edit" asChild>
                <Link
                  href={
                    productTransfer.transferType === "GROUPAGE"
                      ? `/product-transfers/groupage/edit?entityId=${productTransfer.id}`
                      : `/product-transfers/standard/edit?entityId=${productTransfer.id}`
                  }
                >
                  <Icon name="EditIcon" className="h-4 w-4" />
                  {tCommon("actions.edit")}
                </Link>
              </Button>
            ) : (
              <Button key="edit" disabled>
                <Icon name="EditIcon" className="h-4 w-4" />
                {tCommon("actions.edit")}
              </Button>
            )),
          // Cancel button (only for validated transfers) - caché pour field_agent
          canManageTransfers &&
            productTransfer.status === "validated" &&
            (isOnline ? (
              <Button
                key="cancel"
                variant="destructive"
                onClick={handleOpenCancelModal}
              >
                <Icon name="XCircle" className="h-4 w-4" />
                {t("actions.cancel")}
              </Button>
            ) : (
              <Button key="cancel" variant="destructive" disabled>
                <Icon name="XCircle" className="h-4 w-4" />
                {t("actions.cancel")}
              </Button>
            )),
        ].filter(Boolean)}
      >
        <div className="space-y-6">
          {/* Informations de base */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.basicInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.code")}
                value={productTransfer.code}
                noBorder
              />
              <DetailRow
                label={t("view.transferType")}
                value={t(`types.${productTransfer.transferType}`)}
                noBorder
              />
              <DetailRow
                label={t("view.transferDate")}
                value={dayjs(productTransfer.transferDate).format(
                  "DD MMMM YYYY"
                )}
                noBorder
              />
              <DetailRow
                label={t("view.campaignName")}
                value={productTransfer.campaign?.code || "---"}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Expéditeur */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.sender")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.actor")}
                value={
                  productTransfer.senderActor
                    ? `${productTransfer.senderActor.familyName} ${
                        productTransfer.senderActor.givenName
                      }${
                        productTransfer.senderActor.onccId
                          ? ` (${productTransfer.senderActor.onccId})`
                          : ""
                      }`
                    : "---"
                }
                noBorder
              />
              {productTransfer.transferType === "STANDARD" && (
                <DetailRow
                  label={t("view.store")}
                  value={
                    productTransfer.senderStore
                      ? `${productTransfer.senderStore.name} (${productTransfer.senderStore.code})`
                      : "---"
                  }
                  noBorder
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Destinataire */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.receiver")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.actor")}
                value={
                  productTransfer.receiverActor
                    ? `${productTransfer.receiverActor.familyName} ${
                        productTransfer.receiverActor.givenName
                      }${
                        productTransfer.receiverActor.onccId
                          ? ` (${productTransfer.receiverActor.onccId})`
                          : ""
                      }`
                    : "---"
                }
                noBorder
              />
              <DetailRow
                label={t("view.store")}
                value={
                  productTransfer.receiverStore
                    ? `${productTransfer.receiverStore.name} (${productTransfer.receiverStore.code})`
                    : "---"
                }
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Informations du chauffeur (si disponibles) */}
          {productTransfer.driverInfo &&
            productTransfer.driverInfo.fullName && (
              <>
                <div>
                  <Heading size="h3" className="mb-6">
                    {t("view.driverInfo.title")}
                  </Heading>
                  <div className="space-y-2">
                    <DetailRow
                      label={t("view.driverInfo.fullName")}
                      value={productTransfer.driverInfo.fullName}
                      noBorder
                    />
                    <DetailRow
                      label={t("view.driverInfo.vehicleRegistration")}
                      value={productTransfer.driverInfo.vehicleRegistration}
                      noBorder
                    />
                    <DetailRow
                      label={t("view.driverInfo.drivingLicenseNumber")}
                      value={productTransfer.driverInfo.drivingLicenseNumber}
                      noBorder
                    />
                    <DetailRow
                      label={t("view.driverInfo.routeSheetCode")}
                      value={productTransfer.driverInfo.routeSheetCode}
                      noBorder
                    />
                  </div>
                </div>
                <Separator />
              </>
            )}

          {/* Produits */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.products.title")} ({productTransfer.products.length})
            </Heading>
            {productTransfer.products.length > 0 ? (
              <DataTable
                columns={productColumns}
                data={productTransfer.products}
                isMobile={isMobile}
                pageSize={10}
                emptyMessage={t("view.products.empty")}
              />
            ) : (
              <p className="text-sm text-gray-500">
                {t("view.products.empty")}
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
                value={dayjs(productTransfer.createdAt).format(
                  "DD MMMM YYYY [à] HH:mm"
                )}
                noBorder
              />
              <DetailRow
                label={t("view.updatedAt")}
                value={dayjs(productTransfer.updatedAt).format(
                  "DD MMMM YYYY [à] HH:mm"
                )}
                noBorder
              />
            </div>
          </div>
        </div>
      </AppContent>

      {/* Section: Documents */}
      {productTransfer.transferType === "STANDARD" && (
        <AppContent
          title={t("view.documents")}
          topActionButton={[
            canManageTransfers && isOnline ? (
              <Button key="manage-documents" asChild>
                <Link
                  href={`/product-transfers/edit/documents?entityId=${productTransfer.id}`}
                >
                  <Icon name="EditIcon" className="h-4 w-4" />
                  {tCommon("actions.manage")}
                </Link>
              </Button>
            ) : canManageTransfers ? (
              <Button key="manage-documents" disabled>
                <Icon name="EditIcon" className="h-4 w-4" />
                {tCommon("actions.manage")}
              </Button>
            ) : null,
          ]}
        >
          <DocumentTable
            documentableType="ProductTransfer"
            documentableId={productTransfer.id}
          />
        </AppContent>
      )}

      {/* Section: Autres informations (caché pour actor_manager) */}
      {!isActorManager && (
        <AppContent
          title={t("view.otherInfo")}
          defautValue="history"
          tabContent={[
            {
              title: t("view.history"),
              key: "history",
              content: (
                <AuditLogTable
                  auditableType="product_transfer"
                  auditableId={productTransfer.id}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};
