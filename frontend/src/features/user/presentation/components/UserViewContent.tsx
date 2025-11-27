"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { UserRoles } from "@/core/domain";
import { UserRole } from "@/core/domain/user-role.value-object";
import { AuditLogTable } from "@/features/auditLog";
import { useAuth } from "@/features/auth/presentation/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { showError } from "@/lib/notifications/toast";
import { formatPhoneDisplay } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../../infrastructure/store/userStore";
import { useGetUserById } from "../hooks/useGetUserById";
import { useUserModal } from "../hooks/useUserModal";

export const UserViewContent: React.FC = () => {
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const { t } = useTranslation(["user", "common"]);
  const isOnline = useOnlineStatus();

  // Get current authenticated user
  const { user: currentUser } = useAuth();

  // Validation de l'ID
  const id = entityId || "";

  // Data fetching hook
  const { user, isLoading, error, refetch } = useGetUserById(id);

  // State for action buttons
  const [isActionPending, setIsActionPending] = useState(false);
  const { updateUserStatus, resetUserPassword } = useUserStore();

  // Helper function to format language using i18n
  const formatLanguage = (language: string | undefined): string => {
    if (!language) return "---";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`languages.${language}` as any) || language;
  };

  // User modal hook
  const {
    confirmUserActivation,
    confirmUserDeactivation,
    confirmUserPasswordReset,
  } = useUserModal();

  // Handle user activation
  const handleActivate = async () => {
    if (!user?.username) return;

    try {
      setIsActionPending(true);
      const confirmed = await confirmUserActivation(user.username, async () => {
        await updateUserStatus(user.id, "active");
        await refetch();
      });

      if (confirmed) {
        console.log("Utilisateur activé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
      showError(
        error instanceof Error ? error.message : "Erreur lors de l'activation"
      );
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle user deactivation
  const handleDeactivate = async () => {
    if (!user?.username) return;

    try {
      setIsActionPending(true);
      const confirmed = await confirmUserDeactivation(
        user.username,
        async (reason?: string) => {
          await updateUserStatus(user.id, "inactive", reason);
          await refetch();
        }
      );

      if (confirmed) {
        console.log("Utilisateur désactivé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la désactivation"
      );
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!user?.username) return;

    try {
      setIsActionPending(true);
      const confirmed = await confirmUserPasswordReset(
        user.username,
        fullName,
        async () => {
          await resetUserPassword(user.id);
          await refetch();
        }
      );

      if (confirmed) {
        console.log("Mot de passe réinitialisé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la réinitialisation du mot de passe"
      );
    } finally {
      setIsActionPending(false);
    }
  };

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={t("common:messages.error")}
        icon={<Icon name="UsersIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/users">{t("view.backToList")}</Link>
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
        icon={<Icon name="UsersIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/users">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!user) {
    return (
      <AppContent title={t("view.notFound")} icon={<Icon name="UsersIcon" />}>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/users">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Format full name
  const fullName =
    [user.givenName, user.familyName].filter(Boolean).join(" ") ||
    user.username;

  const userRole = user.role ? new UserRole(user.role as UserRoles) : null;

  // Map actor type to route
  const getActorRoute = (actorType: string): string => {
    const routeMap: Record<string, string> = {
      PRODUCERS: "producers",
      BUYER: "buyers",
      EXPORTER: "exporters",
      TRANSFORMER: "transformers",
    };
    return routeMap[actorType] || actorType.toLowerCase();
  };

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === user.id;

  // Main content display
  return (
    <div className="space-y-8">
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {fullName}
            </Heading>
            {user.status === "active" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {t("table.statusLabels.active")}
              </Badge>
            ) : user.status === "inactive" ? (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {t("table.statusLabels.inactive")}
              </Badge>
            ) : (
              user.status === "blocked" && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {t("table.statusLabels.blocked")}
                </Badge>
              )
            )}
          </div>
        }
        icon={<Icon name="UsersIcon" />}
        topActionButton={[
          // Edit button - hide if viewing own profile
          !isOwnProfile &&
            (isOnline ? (
              <Button key="edit" asChild>
                <Link href={`/users/edit?entityId=${user.id}`}>
                  <Icon name="EditIcon" className="h-4 w-4" />
                  {t("common:actions.edit")}
                </Link>
              </Button>
            ) : (
              <Button key="edit" disabled>
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("common:actions.edit")}
              </Button>
            )),

          // Activate/Deactivate button - hide if viewing own profile
          !isOwnProfile &&
            (user.status === "active" ? (
              <Button
                key="deactivate"
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isActionPending || !isOnline}
              >
                <Icon name="PowerOffIcon" className="h-4 w-4" />
                {t("actions.deactivate")}
              </Button>
            ) : (
              <Button
                key="activate"
                variant="default"
                onClick={handleActivate}
                disabled={isActionPending || !isOnline}
              >
                <Icon name="PowerIcon" className="h-4 w-4" />
                {t("actions.activate")}
              </Button>
            )),

          // Reset account button - hide if viewing own profile
          !isOwnProfile && (
            <Button
              key="reset"
              variant="outline"
              onClick={handleResetPassword}
              disabled={isActionPending || !isOnline}
            >
              <Icon name="RotateCcwIcon" className="h-4 w-4" />
              {t("actions.resetPassword")}
            </Button>
          ),
        ].filter(Boolean)}
      >
        {/* Section: Informations personnelles */}
        <div className="space-y-6">
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.personalInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("form.username")}
                value={user.username}
                noBorder
              />
              <DetailRow
                label={t("form.givenName")}
                value={user.givenName || "---"}
                noBorder
              />
              <DetailRow
                label={t("form.familyName")}
                value={user.familyName || "---"}
                noBorder
              />
              <DetailRow
                label={t("form.preferredLanguage")}
                value={formatLanguage(user.lang)}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Informations de contact */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.contactInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow label={t("form.email")} value={user.email} noBorder />
              <DetailRow
                label={t("form.phone")}
                value={formatPhoneDisplay(user.phone)}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Rôle et permissions */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.rolePermissions")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("form.role")}
                value={userRole?.getDisplayName() || "---"}
                noBorder
              />
              <DetailRow
                label={t("form.position")}
                value={user.position || "---"}
                noBorder
              />
              {user.productionBasin && (
                <DetailRow
                  label={t("form.productionBasin")}
                  value={user.productionBasin?.name || "---"}
                  noBorder
                />
              )}
            </div>
          </div>

          {/* Section: Acteur associé (pour actor_manager uniquement) */}
          {user.role === "actor_manager" && user.actor && (
            <>
              <Separator />
              <div>
                <Heading size="h3" className="mb-6">
                  {t("view.associatedActor")}
                </Heading>
                <div className="space-y-2">
                  <DetailRow
                    label={t("view.actorType")}
                    value={user.actor.actorType || "---"}
                    noBorder
                  />
                  <DetailRow
                    label={t("view.actorName")}
                    value={
                      [user.actor.familyName, user.actor.givenName]
                        .filter(Boolean)
                        .join(" ") || "---"
                    }
                    noBorder
                  />
                  <DetailRow
                    label=""
                    value={
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/actors/${getActorRoute(
                            user.actor.actorType
                          )}/view?entityId=${user.actor.id}`}
                        >
                          <Icon name="ExternalLinkIcon" className="h-4 w-4" />
                          {t("view.viewActorDetails")}
                        </Link>
                      </Button>
                    }
                    noBorder
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Section: Informations du compte */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.accountInfo")}
            </Heading>
            <div className="space-y-2">
              {user.lastLoginAt && (
                <DetailRow
                  label={t("view.lastLogin")}
                  value={dayjs(user.lastLoginAt).format("D MMMM YYYY à HH:mm")}
                  noBorder
                />
              )}
              <DetailRow
                label={t("view.createdAt")}
                value={dayjs(user.createdAt).format("D MMMM YYYY à HH:mm")}
                noBorder
              />
              {user.updatedAt && (
                <DetailRow
                  label={t("view.updatedAt")}
                  value={dayjs(user.updatedAt).format("D MMMM YYYY à HH:mm")}
                  noBorder
                />
              )}
            </div>
          </div>
        </div>
      </AppContent>
      <AppContent title={t("view.history")}>
        <AuditLogTable auditableType="User" auditableId={user.id} />
      </AppContent>
    </div>
  );
};
