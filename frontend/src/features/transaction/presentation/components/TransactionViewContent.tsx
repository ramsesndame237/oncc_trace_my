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
import { HierarchyDisplay } from "@/features/location/presentation/components/HierarchyDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  TransactionProduct,
  TransactionStatus,
} from "../../domain/Transaction";
import { TransactionServiceProvider } from "../../infrastructure/di/transactionServiceProvider";
import { usePurchaseAddFormStore } from "../../infrastructure/store/purchaseAddFormStore";
import { useSaleAddFormStore } from "../../infrastructure/store/saleAddFormStore";
import { useGetTransactionById } from "../hooks/useGetTransactionById";
import { useTransactionModal } from "../hooks/useTransactionModal";

export const TransactionViewContent: React.FC = () => {
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const { t } = useTranslation("transaction");
  const { t: tCommon } = useTranslation("common");
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();
  const { confirmStatusChange } = useTransactionModal();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Stores pour pré-remplir le formulaire de transaction inverse
  const saleAddFormStore = useSaleAddFormStore();
  const purchaseAddFormStore = usePurchaseAddFormStore();

  // ⭐ Vérifier si l'utilisateur peut voir la section "other information"
  const canViewOtherInfo =
    user?.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
    user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT ||
    user?.role === USER_ROLES_CONSTANTS.TECHNICAL_ADMIN;

  // ⭐ Vérifier si l'utilisateur peut gérer les transactions (valider/annuler)
  // basin_admin et field_agent peuvent toujours gérer les transactions
  // actor_manager ne peut gérer que ses propres transactions
  const canManageTransaction =
    user?.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
    user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT ||
    user?.role === USER_ROLES_CONSTANTS.TECHNICAL_ADMIN;

  // Validation de l'ID
  const id = entityId || "";

  // Data fetching hook
  const { transaction, isLoading, error, refetch } = useGetTransactionById(
    id,
    isOnline
  );

  // Handler pour changer le statut
  const handleStatusChange = async (newStatus: TransactionStatus) => {
    if (!transaction || !isOnline) return;

    const action = newStatus === "confirmed" ? "confirm" : "cancel";

    const confirmed = await confirmStatusChange(
      transaction.code,
      action,
      async () => {
        setIsUpdatingStatus(true);
        try {
          const updateStatusUseCase =
            TransactionServiceProvider.getUpdateTransactionStatusUseCase();
          await updateStatusUseCase.execute(transaction.id, newStatus);

          showSuccess(
            t(
              newStatus === "confirmed"
                ? "messages.confirmSuccess"
                : "messages.cancelSuccess"
            )
          );

          // Rafraîchir les données
          await refetch();
        } catch (err) {
          console.error("Error updating transaction status:", err);
          showError(
            err instanceof Error ? err.message : t("errors.statusUpdateFailed")
          );
          throw err;
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    );

    if (!confirmed) {
      // Status change cancelled by user
    }
  };

  // ⭐ Handler pour créer la transaction complémentaire (inverse)
  const handleCreateComplementaryTransaction = () => {
    if (!transaction) return;

    // Déterminer le type inverse
    const inverseType =
      transaction.transactionType === "SALE" ? "PURCHASE" : "SALE";

    if (inverseType === "PURCHASE") {
      // Pré-remplir le store d'achat
      purchaseAddFormStore.resetForm();
      purchaseAddFormStore.updateStep1Data({
        locationType: transaction.locationType,
        buyerId: transaction.buyerId, // L'acheteur devient l'acheteur (inverse)
        sellerId: transaction.sellerId, // Le vendeur devient le vendeur (inverse)
        principalExporterId: transaction.principalExporterId || null,
        calendarId: transaction.calendarId || null,
        conventionId: transaction.conventionId || null,
        transactionDate: transaction.transactionDate,
      });
      purchaseAddFormStore.setStepValidation("step1", true);
      purchaseAddFormStore.markStepCompleted(1);

      // Naviguer vers l'étape 2 avec directEntry pour indiquer qu'on vient directement
      router.push(
        `/transactions/purchase/create/products?directEntry=true&returnTo=${encodeURIComponent(
          `/transactions/view?entityId=${transaction.id}`
        )}`
      );
    } else {
      // Pré-remplir le store de vente
      saleAddFormStore.resetForm();
      saleAddFormStore.updateStep1Data({
        locationType: transaction.locationType,
        sellerId: transaction.sellerId, // Le vendeur devient le vendeur (inverse)
        buyerId: transaction.buyerId, // L'acheteur devient l'acheteur (inverse)
        principalExporterId: transaction.principalExporterId || null,
        calendarId: transaction.calendarId || null,
        conventionId: transaction.conventionId || null,
        transactionDate: transaction.transactionDate,
      });
      saleAddFormStore.setStepValidation("step1", true);
      saleAddFormStore.markStepCompleted(1);

      // Naviguer vers l'étape 2 avec directEntry pour indiquer qu'on vient directement
      router.push(
        `/transactions/sale/create/products?directEntry=true&returnTo=${encodeURIComponent(
          `/transactions/view?entityId=${transaction.id}`
        )}`
      );
    }
  };

  // Colonnes pour le tableau des produits
  const productColumns = useMemo<ColumnDef<TransactionProduct>[]>(() => {
    const columns: ColumnDef<TransactionProduct>[] = [];

    // Ajouter la colonne producteur seulement pour les VENTES (SALE) sur MARKET ou CONVENTION
    // Pas de colonne producteur pour :
    // - Les ACHATS (PURCHASE) - jamais
    // - Les VENTES sur BORD_CHAMP - jamais
    const shouldShowProducerColumn =
      transaction?.transactionType === "SALE" &&
      (transaction?.locationType === "MARKET" ||
        transaction?.locationType === "CONVENTION");

    if (shouldShowProducerColumn) {
      columns.push({
        accessorKey: "producer",
        header: t("saleAdd.fields.producer"),
        cell: ({ row }) => {
          const producer = row.original.producer;
          if (!producer) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span>
              {producer.familyName} {producer.givenName}
              {producer.onccId && (
                <span className="text-muted-foreground text-xs ml-1">
                  ({producer.onccId})
                </span>
              )}
            </span>
          );
        },
      });
    }

    // Colonnes communes
    columns.push(
      {
        accessorKey: "quality",
        header: t("view.products.quality"),
        cell: ({ row }) => {
          const qualityKey = row.original.quality;
          const qualityMap: Record<string, string> = {
            GRADE_1: t("saleAdd.qualityOptions.grade1"),
            GRADE_2: t("saleAdd.qualityOptions.grade2"),
            HS: t("saleAdd.qualityOptions.hs"),
            // Support pour les valeurs en minuscules du backend
            grade_1: t("saleAdd.qualityOptions.grade1"),
            grade_2: t("saleAdd.qualityOptions.grade2"),
            hs: t("saleAdd.qualityOptions.hs"),
          };
          return (
            <span className="font-medium">
              {qualityMap[qualityKey] || qualityKey}
            </span>
          );
        },
      },
      {
        accessorKey: "standard",
        header: t("view.products.standard"),
        cell: ({ row }) => {
          const standardKey = row.original.standard;
          const standardMap: Record<string, string> = {
            CERTIFIE: t("saleAdd.standardOptions.certifie"),
            EXCELLENT: t("saleAdd.standardOptions.excellent"),
            FIN: t("saleAdd.standardOptions.fin"),
            CONVENTIONNEL: t("saleAdd.standardOptions.conventionnel"),
            // Support pour les valeurs en minuscules du backend
            certifie: t("saleAdd.standardOptions.certifie"),
            excellent: t("saleAdd.standardOptions.excellent"),
            fin: t("saleAdd.standardOptions.fin"),
            conventionnel: t("saleAdd.standardOptions.conventionnel"),
          };
          return <span>{standardMap[standardKey] || standardKey}</span>;
        },
      },
      {
        accessorKey: "weight",
        header: t("view.products.weight"),
        cell: ({ row }) => (
          <span>{Number(row.original.weight).toLocaleString("fr-FR")} kg</span>
        ),
      },
      {
        accessorKey: "bagCount",
        header: t("view.products.bagCount"),
        cell: ({ row }) => <span>{row.original.bagCount}</span>,
      },
      {
        accessorKey: "pricePerKg",
        header: t("view.products.pricePerKg"),
        cell: ({ row }) => (
          <span>
            {Number(row.original.pricePerKg).toLocaleString("fr-FR")} FCFA
          </span>
        ),
      },
      {
        accessorKey: "totalPrice",
        header: t("view.products.totalPrice"),
        cell: ({ row }) => (
          <span className="font-semibold">
            {Number(row.original.totalPrice).toLocaleString("fr-FR")} FCFA
          </span>
        ),
      }
    );

    return columns;
  }, [t, transaction?.locationType, transaction?.transactionType]);

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={tCommon("messages.error")}
        icon={<Icon name="TransactionIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/transactions">{t("view.backToList")}</Link>
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
        icon={<Icon name="TransactionIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {tCommon("actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/transactions">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!transaction) {
    return (
      <AppContent
        title={t("view.notFound")}
        icon={<Icon name="TransactionIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/transactions">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Status badge
  const getStatusBadge = () => {
    const status = transaction.status;

    // ⭐ Si isPendingComplementary est true, afficher "À compléter"
    if (transaction.isPendingComplementary) {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          {t("statuses.pendingComplementary")}
        </Badge>
      );
    }

    if (status === "confirmed") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          {t("statuses.confirmed")}
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

  // Calculer les totaux
  const totalWeight = transaction.products.reduce(
    (sum, product) => sum + Number(product.weight),
    0
  );

  const totalPrice = transaction.products.reduce(
    (sum, product) => sum + Number(product.totalPrice),
    0
  );

  // Main content display
  return (
    <div className="space-y-8">
      {/* Section principale: Détails de la transaction */}
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {t("view.transactionTitle")} {transaction.code}
            </Heading>
            {getStatusBadge()}
          </div>
        }
        icon={<Icon name="TransactionIcon" />}
        topActionButton={[
          // ⭐ Bouton pour créer la transaction complémentaire (si isPendingComplementary)
          transaction.isPendingComplementary &&
            (isOnline ? (
              <Button
                key="create-complementary"
                onClick={handleCreateComplementaryTransaction}
              >
                <Icon name="PlusIcon" className="h-4 w-4" />
                {t("actions.createComplementary")}
              </Button>
            ) : (
              <Button key="create-complementary" disabled>
                <Icon name="PlusIcon" className="h-4 w-4" />
                {t("actions.createComplementary")}
              </Button>
            )),
          // ⭐ Edit button (only for pending transactions, not for pendingComplementary)
          // basin_admin/field_agent can always edit, actor_manager only their own
          transaction.status === "pending" &&
            !transaction.isPendingComplementary &&
            (canManageTransaction || transaction.isMyTransaction !== false) &&
            (isOnline ? (
              <Button key="edit" variant="outline" asChild>
                <Link
                  href={`/transactions/${transaction.transactionType.toLowerCase()}/edit?entityId=${
                    transaction.id
                  }`}
                >
                  <Icon name="EditIcon" className="h-4 w-4" />
                  {tCommon("actions.edit")}
                </Link>
              </Button>
            ) : (
              <Button key="edit" variant="outline" disabled>
                <Icon name="EditIcon" className="h-4 w-4" />
                {tCommon("actions.edit")}
              </Button>
            )),
          // ⭐ Confirm button (only for pending transactions, not for pendingComplementary)
          // basin_admin/field_agent can always confirm, actor_manager only their own
          transaction.status === "pending" &&
            !transaction.isPendingComplementary &&
            (canManageTransaction || transaction.isMyTransaction !== false) &&
            (isOnline ? (
              <Button
                key="confirm"
                onClick={() => handleStatusChange("confirmed")}
                disabled={isUpdatingStatus}
              >
                <Icon name="CheckIcon" className="h-4 w-4" />
                {t("actions.confirm")}
              </Button>
            ) : (
              <Button key="confirm" disabled>
                <Icon name="CheckIcon" className="h-4 w-4" />
                {t("actions.confirm")}
              </Button>
            )),
          // ⭐ Cancel button (only for pending transactions, not for pendingComplementary)
          // basin_admin/field_agent can always cancel, actor_manager only their own
          transaction.status === "confirmed" &&
            !transaction.isPendingComplementary &&
            (canManageTransaction || transaction.isMyTransaction !== false) &&
            (isOnline ? (
              <Button
                key="cancel"
                variant="destructive"
                onClick={() => handleStatusChange("cancelled")}
                disabled={isUpdatingStatus}
              >
                <Icon name="XIcon" className="h-4 w-4" />
                {t("actions.cancel")}
              </Button>
            ) : (
              <Button key="cancel" variant="destructive" disabled>
                <Icon name="XIcon" className="h-4 w-4" />
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
                value={transaction.code}
                noBorder
              />
              <DetailRow
                label={t("view.transactionType")}
                value={t(`transactionTypes.${transaction.transactionType}`)}
                noBorder
              />
              <DetailRow
                label={t("view.locationType")}
                value={t(`locationTypes.${transaction.locationType}`)}
                noBorder
              />
              <DetailRow
                label={t("view.transactionDate")}
                value={dayjs(transaction.transactionDate).format(
                  "DD MMMM YYYY"
                )}
                noBorder
              />
              <DetailRow
                label={t("view.campaignName")}
                value={transaction.campaign?.code || "---"}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Vendeur */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.seller")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.actor")}
                value={
                  transaction.seller
                    ? `${transaction.seller.familyName} ${
                        transaction.seller.givenName
                      }${
                        transaction.seller.onccId
                          ? ` (${transaction.seller.onccId})`
                          : ""
                      }`
                    : "---"
                }
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Acheteur */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.buyer")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.actor")}
                value={
                  transaction.buyer
                    ? `${transaction.buyer.familyName} ${
                        transaction.buyer.givenName
                      }${
                        transaction.buyer.onccId
                          ? ` (${transaction.buyer.onccId})`
                          : ""
                      }`
                    : "---"
                }
                noBorder
              />
            </div>
          </div>

          {/* Exportateur principal (si présent) */}
          {transaction.principalExporter && (
            <>
              <Separator />
              <div>
                <Heading size="h3" className="mb-6">
                  {t("view.principalExporter")}
                </Heading>
                <div className="space-y-2">
                  <DetailRow
                    label={t("view.actor")}
                    value={`${transaction.principalExporter.familyName} ${
                      transaction.principalExporter.givenName
                    }${
                      transaction.principalExporter.onccId
                        ? ` (${transaction.principalExporter.onccId})`
                        : ""
                    }`}
                    noBorder
                  />
                </div>
              </div>
            </>
          )}

          {/* Calendrier (si présent) */}
          {(transaction.calendar || transaction.calendarId) && (
            <>
              <Separator />
              <div>
                <Heading size="h3" className="mb-6">
                  {t("view.calendar")}
                </Heading>
                <div className="space-y-2">
                  <DetailRow
                    label={t("view.calendarCode")}
                    value={
                      transaction.calendar?.code ||
                      transaction.calendarId ||
                      "---"
                    }
                    noBorder
                  />
                  {transaction.calendar?.startDate && (
                    <DetailRow
                      label={t("view.calendarDate")}
                      value={dayjs(transaction.calendar.startDate).format(
                        "DD MMMM YYYY"
                      )}
                      noBorder
                    />
                  )}
                  {transaction.calendar?.location && (
                    <DetailRow
                      label={t("view.calendarLocation")}
                      value={transaction.calendar.location}
                      noBorder
                    />
                  )}
                  {transaction.calendar?.locationCode && (
                    <DetailRow
                      label={t("view.calendarLocationCode")}
                      value={
                        <HierarchyDisplay
                          code={transaction.calendar.locationCode}
                        />
                      }
                      noBorder
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Convention (si présent) */}
          {(transaction.convention || transaction.conventionId) && (
            <>
              <Separator />
              <div>
                <Heading size="h3" className="mb-6">
                  {t("view.convention")}
                </Heading>
                <div className="space-y-2">
                  <DetailRow
                    label={t("view.conventionCode")}
                    value={
                      transaction.convention?.code ||
                      transaction.conventionId ||
                      "---"
                    }
                    noBorder
                  />
                  {transaction.convention?.signatureDate && (
                    <DetailRow
                      label={t("view.conventionSignatureDate")}
                      value={dayjs(transaction.convention.signatureDate).format(
                        "DD MMMM YYYY"
                      )}
                      noBorder
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Produits - ⭐ Visible pour basin_admin/field_agent ou si le user est le créateur */}
          {(canManageTransaction || transaction.isMyTransaction !== false) && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Heading size="h3">
                    {t("view.products.title")} ({transaction.products.length})
                  </Heading>
                  {/* Bouton Edit pour modifier les produits (uniquement si transaction pending) */}
                  {transaction.status === "pending" && (
                    <Link
                      href={`/transactions/${transaction.transactionType.toLowerCase()}/edit/products?entityId=${
                        transaction.id
                      }`}
                    >
                      <Button variant="outline" size="sm">
                        <Icon name="EditIcon" className="h-4 w-4 mr-2" />
                        {t("actions.edit")}
                      </Button>
                    </Link>
                  )}
                </div>
                {transaction.products.length > 0 ? (
                  <>
                    <DataTable
                      columns={productColumns}
                      data={transaction.products}
                      isMobile={isMobile}
                      pageSize={10}
                      emptyMessage={t("view.products.empty")}
                    />
                    {/* Totaux */}
                    <div className="rounded-lg bg-gray-50 p-4 space-y-2 mt-4">
                      <DetailRow
                        label={t("view.products.totalWeight")}
                        value={`${totalWeight.toLocaleString("fr-FR")} kg`}
                      />
                      <DetailRow
                        label={t("view.products.totalAmount")}
                        value={`${totalPrice.toLocaleString("fr-FR")} FCFA`}
                        noBorder
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("view.products.empty")}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Métadonnées - ⭐ Visible pour basin_admin/field_agent ou si le user est le créateur */}
          {(canManageTransaction || transaction.isMyTransaction !== false) && (
            <>
              <Separator />
              <div>
                <Heading size="h3" className="mb-6">
                  {t("view.metadata")}
                </Heading>
                <div className="space-y-2">
                  <DetailRow
                    label={t("view.createdAt")}
                    value={dayjs(transaction.createdAt).format(
                      "DD MMMM YYYY [à] HH:mm"
                    )}
                    noBorder
                  />
                  <DetailRow
                    label={t("view.updatedAt")}
                    value={dayjs(transaction.updatedAt).format(
                      "DD MMMM YYYY [à] HH:mm"
                    )}
                    noBorder
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </AppContent>

      {/* Section: Documents - ⭐ Visible pour basin_admin/field_agent ou si le user est le créateur */}
      {(canManageTransaction || transaction.isMyTransaction !== false) && (
        <AppContent
          title={t("view.documents")}
          topActionButton={
            transaction.status === "pending" &&
            !transaction.isPendingComplementary
              ? [
                  isOnline ? (
                    <Button key="manage-documents" asChild>
                      <Link
                        href={`/transactions/${transaction.transactionType.toLowerCase()}/edit/documents?entityId=${
                          transaction.id
                        }`}
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
              : undefined
          }
        >
          <DocumentTable
            documentableType="Transaction"
            documentableId={transaction.id}
          />
        </AppContent>
      )}

      {/* Section: Historique - ⭐ Visible uniquement pour basin_admin, field_agent et technical_admin */}
      {canViewOtherInfo && (
        <AppContent
          title={t("view.otherInfo")}
          defautValue="history"
          tabContent={[
            {
              title: t("view.history"),
              key: "history",
              content: (
                <AuditLogTable
                  auditableType="transaction"
                  auditableId={transaction.id}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};
