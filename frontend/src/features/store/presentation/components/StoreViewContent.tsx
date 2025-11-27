"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { AuditLogTable } from "@/features/auditLog";
import { useAuth } from "@/features/auth";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { showError } from "@/lib/notifications/toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useStoreStore } from "../../infrastructure/store/storeStore";
import { useGetStoreById } from "../hooks/useGetStoreById";
import { useStoreModal } from "../hooks/useStoreModal";
import { StoreOccupantsTable } from "./StoreOccupantsTable";

export const StoreViewContent: React.FC = () => {
  const { t } = useTranslation("store");
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager
  const isActorManager = user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER;

  // ⭐ Vérifier si l'utilisateur est un field_agent (ne peut pas gérer les stores)
  const isFieldAgent = user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT;

  // ⭐ L'utilisateur peut gérer les stores (créer/modifier/supprimer/gérer occupants)
  const canManageStores = !isFieldAgent && !isActorManager;

  // Validation de l'ID
  const id = entityId || "";

  // Data fetching hook
  const { store, isLoading, error, refetch } = useGetStoreById(id);

  // Store hooks
  const { activateStore, deactivateStore } = useStoreStore();
  const { confirmStoreActivation, confirmStoreDeactivation } = useStoreModal();

  // Handle store activation
  const handleActivate = async () => {
    if (!store?.code) return;

    try {
      const confirmed = await confirmStoreActivation(store.code, async () => {
        await activateStore(id);
        await refetch();
      });

      if (confirmed) {
        console.log("Magasin activé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
      showError(
        error instanceof Error ? error.message : t("messages.activationError")
      );
    }
  };

  // Handle store deactivation
  const handleDeactivate = async () => {
    if (!store?.code) return;

    try {
      const confirmed = await confirmStoreDeactivation(store.code, async () => {
        await deactivateStore(id);
        await refetch();
      });

      if (confirmed) {
        console.log("Magasin désactivé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      showError(
        error instanceof Error ? error.message : t("messages.deactivationError")
      );
    }
  };

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={t("view.error")}
        icon={<Icon name="CustomWareHouse" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/stores">{t("view.backToList")}</Link>
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
        title={t("view.error")}
        icon={<Icon name="CustomWareHouse" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/stores">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!store) {
    return (
      <AppContent
        title={t("view.notFound")}
        icon={<Icon name="CustomWareHouse" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/stores">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Main content display
  return (
    <div className="space-y-8">
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {store.name}
            </Heading>
            {store.status === "active" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {t("table.statusLabels.active")}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {t("table.statusLabels.inactive")}
              </Badge>
            )}
          </div>
        }
        icon={<Icon name="CustomWareHouse" />}
        topActionButton={[
          // Edit button - Caché pour field_agent et actor_manager
          canManageStores &&
            (isOnline ? (
              <Button key="edit" asChild>
                <Link href={`/stores/edit?entityId=${store.id}`}>
                  <Icon name="EditIcon" className="h-4 w-4" />
                  {t("actions.edit")}
                </Link>
              </Button>
            ) : (
              <Button key="edit" disabled>
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("actions.edit")}
              </Button>
            )),
          // Activate/Deactivate button - Caché pour field_agent et actor_manager
          canManageStores &&
            (store.status === "active" ? (
              <Button
                key="deactivate"
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!isOnline}
                title={
                  !isOnline
                    ? t("actions.deactivateTooltipOffline")
                    : t("actions.deactivateTooltip")
                }
              >
                <Icon name="PowerOffIcon" className="h-4 w-4" />
                {t("actions.deactivate")}
              </Button>
            ) : (
              <Button
                key="activate"
                variant="default"
                onClick={handleActivate}
                disabled={!isOnline}
                title={
                  !isOnline
                    ? t("actions.activateTooltipOffline")
                    : t("actions.activateTooltip")
                }
              >
                <Icon name="PowerIcon" className="h-4 w-4" />
                {t("actions.activate")}
              </Button>
            )),
        ].filter(Boolean)}
      >
        {/* Section: Informations générales */}
        <div className="space-y-6">
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.generalInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.storeName")}
                value={store.name}
                noBorder
              />
              <DetailRow
                label={t("view.code")}
                value={store.code || "---"}
                noBorder
              />
              <DetailRow
                label={t("view.storeType")}
                value={
                  store.storeType ? t(`storeTypes.${store.storeType}`) : "---"
                }
                noBorder
              />
              <DetailRow
                label={t("view.location")}
                value={<HierarchyDisplay code={store.locationCode} />}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Caractéristiques */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.characteristics")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.capacity")}
                value={
                  store.capacity
                    ? `${store.capacity} ${t("units.tons")}`
                    : "---"
                }
                noBorder
              />
              <DetailRow
                label={t("view.surfaceArea")}
                value={
                  store.surfaceArea
                    ? `${store.surfaceArea} ${t("units.squareMeters")}`
                    : "---"
                }
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Informations système */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.systemInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("view.createdAt")}
                value={dayjs(store.createdAt).format("D MMMM YYYY à HH:mm")}
                noBorder
              />
              <DetailRow
                label={t("view.updatedAt")}
                value={dayjs(store.updatedAt).format("D MMMM YYYY à HH:mm")}
                noBorder
              />
            </div>
          </div>
        </div>
      </AppContent>

      {/* Section: Occupants */}
      <AppContent
        title={t("view.occupants")}
        topActionButton={[
          // Manage occupants button - Caché pour field_agent et actor_manager
          canManageStores &&
            (isOnline ? (
              <Button key="manage" asChild>
                <Link href={`/stores/edit/occupants?entityId=${store.id}`}>
                  <Icon name="UsersIcon" className="h-4 w-4" />
                  {t("occupants.manageButton")}
                </Link>
              </Button>
            ) : (
              <Button key="manage" disabled>
                <Icon name="UsersIcon" className="h-4 w-4" />
                {t("occupants.manageButton")}
              </Button>
            )),
        ].filter(Boolean)}
      >
        <StoreOccupantsTable storeId={store.id} canManage={canManageStores} />
      </AppContent>

      {/* Section: Historique */}
      {/* Section: Autres informations */}
      <AppContent
        title={t("view.otherInfo")}
        defautValue="history"
        tabContent={[
          {
            title: t("view.history"),
            key: "history",
            content: (
              <AuditLogTable auditableType="Store" auditableId={store.id} />
            ),
          },
        ]}
      />
    </div>
  );
};
