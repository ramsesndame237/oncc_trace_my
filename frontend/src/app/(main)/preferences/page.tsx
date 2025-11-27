"use client";

import { AppContent } from "@/components/layout/app-content";
import LanguageSelector from "@/components/layout/language-selector";
import { useAppModal } from "@/components/modals/hooks/useAppModal";
import { DetailRow } from "@/components/modules/detail-row";
import { UserRole } from "@/core/domain/user-role.value-object";
import { useAuth } from "@/features/auth";
import { UserServiceProvider } from "@/features/user/infrastructure/di/userServiceProvider";
import { UserFooterModalEditName } from "@/features/user/presentation/components/Modal/UserFooterModalEditName";
import { UserFooterModalEditPassword } from "@/features/user/presentation/components/Modal/UserFooterModalEditPassword";
import { UserFooterModalEditPhone } from "@/features/user/presentation/components/Modal/UserFooterModalEditPhone";
import {
  UserModalEditName,
  createEditNameDescription,
} from "@/features/user/presentation/components/Modal/UserModalEditName";
import {
  UserModalEditPassword,
  createEditPasswordDescription,
} from "@/features/user/presentation/components/Modal/UserModalEditPassword";
import {
  UserModalEditPhone,
  createEditPhoneDescription,
} from "@/features/user/presentation/components/Modal/UserModalEditPhone";
import { useErrorTranslation } from "@/hooks/useErrorTranslation";
import { useLocale } from "@/hooks/useLocale";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { formatPhoneDisplay } from "@/lib/utils";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function PreferencesPage() {
  const { t } = useTranslation(["common", "user"]);
  const { user, refreshUser } = useAuth();
  const { currentLocale } = useLocale();
  const appModal = useAppModal();
  const { translateError } = useErrorTranslation();

  const userRole = user ? new UserRole(user.role) : null;

  const handleEditName = useCallback(async () => {
    if (!user) return Promise.resolve(false);

    return new Promise((resolve, reject) => {
      const handleCancel = () => appModal.hide();
      const handleResolve = (result: boolean) => {
        appModal.hide();
        resolve(result);
      };
      const handleReject = (error: unknown) => {
        reject(error);
        setTimeout(() => {
          appModal.hide();
        }, 200);
      };

      appModal.show({
        title: t("user:modals.editName.title"),
        description: createEditNameDescription(
          user.id,
          user.givenName,
          user.familyName,
          t
        ),
        variant: "default",

        content: React.createElement(UserModalEditName, {
          userId: user.id,
          currentGivenName: user.givenName,
          currentFamilyName: user.familyName,
        }),
        footer: React.createElement(UserFooterModalEditName),

        needsCommunication: true,
        contextType: "dynamic",
        contextData: {
          isValid: false,
          isLoading: false,

          handleConfirm: async (givenName?: string, familyName?: string) => {
            try {
              if (!givenName || !familyName) {
                throw new Error("Le prénom et le nom sont requis");
              }

              const updateSelfUseCase =
                UserServiceProvider.getUpdateSelfUseCase();
              await updateSelfUseCase.execute({
                type: "name",
                givenName,
                familyName,
              });

              // Rafraîchir les données utilisateur
              await refreshUser();

              showSuccess(t("user:messages.nameUpdated"));
              handleResolve(true);
            } catch (error) {
              console.error("Erreur lors de la modification du nom:", error);
              const errorMessage = translateError(
                error instanceof Error ? error.message : String(error)
              );
              showError(errorMessage);
              handleReject(error);
            }
          },

          handleCancel: () => {
            handleCancel();
            handleResolve(false);
          },
        },
      });
    });
  }, [user, appModal, t, translateError, refreshUser]);

  const handleEditPhone = useCallback(async () => {
    if (!user) return Promise.resolve(false);

    return new Promise((resolve, reject) => {
      const handleCancel = () => appModal.hide();
      const handleResolve = (result: boolean) => {
        appModal.hide();
        resolve(result);
      };
      const handleReject = (error: unknown) => {
        reject(error);
        setTimeout(() => {
          appModal.hide();
        }, 200);
      };

      appModal.show({
        title: t("user:modals.editPhone.title"),
        description: createEditPhoneDescription(user.id, user.phone, t),
        variant: "default",

        content: React.createElement(UserModalEditPhone, {
          userId: user.id,
          currentPhone: user.phone,
        }),
        footer: React.createElement(UserFooterModalEditPhone),

        needsCommunication: true,
        contextType: "dynamic",
        contextData: {
          isValid: false,
          isLoading: false,

          handleConfirm: async (phone?: string) => {
            try {
              const updateSelfUseCase =
                UserServiceProvider.getUpdateSelfUseCase();
              await updateSelfUseCase.execute({
                type: "other",
                phone: phone && phone.trim() !== "" ? phone : undefined,
              });

              // Rafraîchir les données utilisateur
              await refreshUser();

              showSuccess(t("user:messages.phoneUpdated"));
              handleResolve(true);
            } catch (error) {
              console.error(
                "Erreur lors de la modification du téléphone:",
                error
              );
              const errorMessage = translateError(
                error instanceof Error ? error.message : String(error)
              );
              showError(errorMessage);
              handleReject(error);
            }
          },

          handleCancel: () => {
            handleCancel();
            handleResolve(false);
          },
        },
      });
    });
  }, [user, appModal, t, translateError, refreshUser]);

  const handleEditPassword = useCallback(async () => {
    if (!user) return Promise.resolve(false);

    return new Promise((resolve, reject) => {
      const handleCancel = () => appModal.hide();
      const handleResolve = (result: boolean) => {
        appModal.hide();
        resolve(result);
      };
      const handleReject = (error: unknown) => {
        reject(error);
        setTimeout(() => {
          appModal.hide();
        }, 200);
      };

      appModal.show({
        title: t("user:modals.editPassword.title"),
        description: createEditPasswordDescription(user.id, t),
        variant: "default",

        content: React.createElement(UserModalEditPassword, {
          userId: user.id,
        }),
        footer: React.createElement(UserFooterModalEditPassword),

        needsCommunication: true,
        contextType: "dynamic",
        contextData: {
          isValid: false,
          isLoading: false,

          handleConfirm: async (
            currentPassword: string,
            newPassword: string
          ) => {
            try {
              const updateSelfUseCase =
                UserServiceProvider.getUpdateSelfUseCase();
              await updateSelfUseCase.execute({
                type: "password",
                currentPassword,
                newPassword,
              });

              showSuccess(t("user:messages.passwordUpdated"));
              handleResolve(true);
            } catch (error) {
              console.error(
                "Erreur lors de la modification du mot de passe:",
                error
              );
              const errorMessage = translateError(
                error instanceof Error ? error.message : String(error)
              );
              showError(errorMessage);
              handleReject(error);
            }
          },

          handleCancel: () => {
            handleCancel();
            handleResolve(false);
          },
        },
      });
    });
  }, [user, appModal, t, translateError]);

  if (!user) {
    return null;
  }

  return (
    <AppContent title={t("navigation.preferences")}>
      <div className="space-y-6">
        {/* Nom complet */}
        <DetailRow
          label={t("fields.name")}
          value={`${user.givenName} ${user.familyName}`}
          showChangeButton={true}
          onChangeClick={handleEditName}
          changeButtonText={t("actions.edit")}
        />

        {/* Rôle ou Poste */}
        <DetailRow
          label={t("fields.role")}
          value={user.position || userRole?.getDisplayName() || "-"}
          showChangeButton={false}
        />

        {/* Email */}
        <DetailRow
          label={t("fields.email")}
          value={user.email || "-"}
          showChangeButton={false}
        />

        {/* Téléphone */}
        <DetailRow
          label={t("fields.phone")}
          value={formatPhoneDisplay(user.phone) || "-"}
          showChangeButton={true}
          onChangeClick={handleEditPhone}
          changeButtonText={t("actions.edit")}
        />

        {/* Nom d'utilisateur */}
        <DetailRow
          label={t("fields.username")}
          value={user.username}
          showChangeButton={false}
        />

        {/* Langue */}
        <DetailRow
          label={t("fields.systemLanguage")}
          value={
            currentLocale === "en"
              ? t("user:languages.en")
              : t("user:languages.fr")
          }
          customAction={<LanguageSelector />}
          stackOnMobile={false}
        />

        {/* Mot de passe */}
        <DetailRow
          label={t("fields.password")}
          value="********"
          showChangeButton={true}
          onChangeClick={handleEditPassword}
          changeButtonText={t("actions.edit")}
        />

        {/* Code PIN */}
        <DetailRow label="PIN" value="****" showChangeButton={false} noBorder />
      </div>
    </AppContent>
  );
}
