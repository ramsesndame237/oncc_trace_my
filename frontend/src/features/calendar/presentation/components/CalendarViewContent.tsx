"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES_CONSTANTS } from "@/core/domain/user.types";
import { USER_ROLES_CONSTANTS as GEN_USER_ROLES } from "@/core/domain/generated/user-roles.types";
import { AuditLogTable } from "@/features/auditLog";
import { useAuth } from "@/features/auth";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { showError, showSuccess } from "@/lib/notifications/toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCalendarStore } from "../../infrastructure/store/calendarStore";
import { useCalendarModal } from "../hooks/useCalendarModal";
import { useGetCalendarById } from "../hooks/useGetCalendarById";

export const CalendarViewContent: React.FC = () => {
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");
  const { t } = useTranslation(["calendar", "common"]);
  const isOnline = useOnlineStatus();
  const dayjs = useDayjsLocale();

  // Validation de l'ID
  const id = entityId || "";
  const editOffline = entityType ? true : false;

  // Data fetching hook
  const { calendar, isLoading, error, refetch } = useGetCalendarById(id);

  // Store and modal hooks
  const { updateStatus, updateExpectedSalesCount } = useCalendarStore();
  const {
    confirmCalendarActivation,
    confirmCalendarDeactivation,
    confirmUpdateExpectedSalesCount,
  } = useCalendarModal();

  // Auth store pour vérifier les rôles
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER
  const isActorManagerBET =
    user?.role === GEN_USER_ROLES.ACTOR_MANAGER &&
    ["BUYER", "EXPORTER", "TRANSFORMER"].includes(user?.actor?.actorType || "");

  // ⭐ Vérifier si l'utilisateur est un field_agent (ne peut pas modifier les calendriers)
  const isFieldAgent = user?.role === GEN_USER_ROLES.FIELD_AGENT;

  // ⭐ L'utilisateur peut gérer les calendriers (créer/modifier/supprimer)
  const canManageCalendars = !isFieldAgent && !isActorManagerBET;

  // Handle calendar activation
  const handleActivate = async () => {
    if (!calendar?.code) return;

    try {
      await confirmCalendarActivation(calendar.code, async () => {
        await updateStatus(id, calendar.code, "active");
        await refetch();
        showSuccess(t("modals.changeStatus.successActivated"));
      });
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("modals.changeStatus.errorActivation")
      );
    }
  };

  // Handle calendar deactivation
  const handleDeactivate = async () => {
    if (!calendar?.code) return;

    try {
      await confirmCalendarDeactivation(calendar.code, async () => {
        await updateStatus(id, calendar.code, "inactive");
        await refetch();
        showSuccess(t("modals.changeStatus.successDeactivated"));
      });
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("modals.changeStatus.errorDeactivation")
      );
    }
  };

  // Handle update expected sales count
  const handleUpdateExpectedSalesCount = async () => {
    if (!calendar?.code) return;

    try {
      await confirmUpdateExpectedSalesCount(
        calendar.code,
        calendar.expectedSalesCount,
        async (expectedSalesCount: number) => {
          await updateExpectedSalesCount(id, calendar.code, expectedSalesCount);
          await refetch();
          showSuccess(t("modals.updateExpectedSalesCount.success"));
        }
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("modals.updateExpectedSalesCount.error")
      );
    }
  };

  // Vérifier si la date de début est passée
  const isStartDatePassed = () => {
    if (!calendar) return false;
    return dayjs(calendar.startDate).isBefore(dayjs(), "day");
  };

  // Vérifier si l'utilisateur peut modifier le nombre de ventes
  const canUpdateExpectedSalesCount = () => {
    if (!calendar || !user || !isOnline) return false;
    if (calendar.type !== "MARCHE") return false;
    if (isStartDatePassed()) return false; // Désactiver si la date est passée

    const userRole = user.role;
    return userRole === "field_agent" || userRole === "basin_admin";
  };

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={t("common:messages.error")}
        icon={<Icon name="CalendarIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/calendars">{t("view.backToList")}</Link>
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
        icon={<Icon name="CalendarIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("common:actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/calendars">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!calendar) {
    return (
      <AppContent
        title={t("view.notFound")}
        icon={<Icon name="CalendarIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/calendars">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Status badge
  const getStatusBadge = () => {
    const status = calendar.status;

    if (status === "inactive") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          {t("statuses.inactive")}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        {t("statuses.active")}
      </Badge>
    );
  };

  // Type label (text only)
  const getTypeLabel = () => {
    return calendar.type === "MARCHE"
      ? t("types.MARCHE")
      : t("types.ENLEVEMENT");
  };

  // Main content display
  return (
    <div className="space-y-8">
      {/* Section principale: Détails du calendrier */}
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {calendar.code}
            </Heading>
            {getStatusBadge()}
          </div>
        }
        icon={<Icon name="IconCalendar" />}
        topActionButton={[
          // ⭐ Masquer bouton edit pour field_agent et actor_manager BUYER/EXPORTER/TRANSFORMER
          canManageCalendars && isOnline && !isStartDatePassed() ? (
            <Button key="edit" asChild>
              <Link
                href={`/calendars/${
                  calendar.type === "MARCHE" ? "market" : "pickup"
                }/edit?entityId=${calendar.id}${
                  editOffline ? `&editOffline=true` : ""
                }`}
              >
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("common:actions.edit")}
              </Link>
            </Button>
          ) : canManageCalendars ? (
            <Button key="edit" disabled>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("common:actions.edit")}
            </Button>
          ) : null,
          canManageCalendars && canUpdateExpectedSalesCount() ? (
            <Button
              key="updateExpectedSalesCount"
              variant="outline"
              onClick={handleUpdateExpectedSalesCount}
            >
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("actions.updateExpectedSalesCount")}
            </Button>
          ) : null,
          // ⭐ Masquer bouton activate/deactivate pour field_agent et actor_manager BUYER/EXPORTER/TRANSFORMER
          canManageCalendars && isOnline && !isStartDatePassed() ? (
            calendar.status === "active" ? (
              <Button
                key="deactivate"
                variant="destructive"
                onClick={handleDeactivate}
              >
                <Icon name="XCircleIcon" className="h-4 w-4" />
                {t("actions.deactivate")}
              </Button>
            ) : (
              <Button key="activate" onClick={handleActivate}>
                <Icon name="CheckCircleIcon" className="h-4 w-4" />
                {t("actions.activate")}
              </Button>
            )
          ) : null,
        ]}
      >
        <div className="space-y-6">
          {/* Informations de l'événement */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.eventInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("fields.type")}
                value={getTypeLabel()}
                noBorder
              />
              <DetailRow
                label={t("fields.startDate")}
                value={dayjs(calendar.startDate).format("DD MMMM YYYY")}
                noBorder
              />
              <DetailRow
                label={t("fields.endDate")}
                value={dayjs(calendar.endDate).format("DD MMMM YYYY")}
                noBorder
              />
              {calendar.eventTime && (
                <DetailRow
                  label={t("fields.eventTime")}
                  value={calendar.eventTime}
                  noBorder
                />
              )}
              {calendar.type === "MARCHE" &&
                (user?.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
                  user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT) && (
                  <DetailRow
                    label={t("fields.expectedSalesCount")}
                    value={
                      calendar.expectedSalesCount !== null
                        ? calendar.expectedSalesCount.toString()
                        : "N/A"
                    }
                    noBorder
                  />
                )}
            </div>
          </div>

          <Separator />

          {/* Informations de localisation */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.locationInfo")}
            </Heading>
            <div className="space-y-2">
              {calendar.location && (
                <DetailRow
                  label={t("fields.location")}
                  value={calendar.location}
                  noBorder
                />
              )}
              {calendar.locationCode && (
                <DetailRow
                  label={t("fields.locationCode")}
                  value={<HierarchyDisplay code={calendar.locationCode} />}
                  noBorder
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Relations */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.relationsInfo")}
            </Heading>
            <div className="space-y-2">
              {calendar.opa && (
                <DetailRow
                  label={t("fields.opa")}
                  value={`${calendar.opa.familyName} ${calendar.opa.givenName}${
                    calendar.opa.onccId ? ` (${calendar.opa.onccId})` : ""
                  }`}
                  noBorder
                />
              )}
              {calendar.campaign && (
                <DetailRow
                  label={t("fields.campaign")}
                  value={`${calendar.campaign.code}`}
                  noBorder
                />
              )}
              {calendar.convention && (
                <DetailRow
                  label={t("fields.convention")}
                  value={`${calendar.convention.code || "---"} (${dayjs(
                    calendar.convention.signatureDate
                  ).format("DD MMMM YYYY")})`}
                  noBorder
                />
              )}
            </div>
          </div>

          {/* ⭐ Masquer les métadonnées pour actor_manager BUYER/EXPORTER/TRANSFORMER */}
          {!isActorManagerBET && (
            <>
              <Separator />

              {/* Métadonnées */}
              <div>
                <Heading size="h3" className="mb-6">
                  {t("view.metadata")}
                </Heading>
                <div className="space-y-2">
                  <DetailRow
                    label={t("view.createdAt")}
                    value={dayjs(calendar.createdAt).format(
                      "DD MMMM YYYY [à] HH:mm"
                    )}
                    noBorder
                  />
                  <DetailRow
                    label={t("view.updatedAt")}
                    value={dayjs(calendar.updatedAt).format(
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

      {/* Section: Autres informations - Masquée pour actor_manager BUYER/EXPORTER/TRANSFORMER */}
      {!isActorManagerBET && (
        <AppContent
          title={t("view.otherInfo")}
          defautValue="history"
          tabContent={[
            {
              title: t("view.history"),
              key: "history",
              content: (
                <AuditLogTable
                  auditableType="calendar"
                  auditableId={calendar.id}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};
