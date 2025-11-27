"use client";

import { FormInput, FormPhoneInput, FormSelect } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { USER_ROLES, type UserRoles } from "@/core/domain";
import { UserRole } from "@/core/domain/user-role.value-object";
import { ApiError } from "@/core/infrastructure/api/client";
import { showError } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, type JSX } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../auth/presentation/hooks/useAuth";
import { useProductionBasinStore } from "../../../production-basin/infrastructure/store/productionBasinStore";
import type {
  CreateUserRequest,
  UpdateUserRequest,
} from "../../domain/types/request";
import { useUserStore } from "../../infrastructure/store/userStore";
import { useGetUserById } from "../hooks/useGetUserById";
import {
  createUpdateUserSchema,
  createUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "../schemas";

export interface UserEditFormProps {
  entityId?: string;
  editOffline?: boolean;
}

export default function UserEditForm({
  entityId,
  editOffline,
}: UserEditFormProps): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation(["user", "common"]);
  const { user: currentUser } = useAuth();
  const { createUser, updateUser, isLoading } = useUserStore();
  const {
    basins,
    fetchBasins,
    isLoading: isLoadingBasins,
  } = useProductionBasinStore();

  // Load existing user data in edit mode
  const { user } = useGetUserById(entityId ?? "", !editOffline);

  // Determine if we're in edit mode
  const isEditMode = Boolean(entityId);

  // Check if editing an actor_manager
  const isActorManager = isEditMode && user?.role === "actor_manager";

  // Use union type for form data to handle both modes
  type FormData = CreateUserFormData | UpdateUserFormData;

  const form = useForm<FormData>({
    resolver: zodResolver(
      isEditMode ? createUpdateUserSchema(t) : createUserSchema(t)
    ),
    defaultValues: {
      familyName: "",
      givenName: "",
      email: "",
      phone: "",
      role: "field_agent",
      position: "",
      productionBasinId: "",
    },
    mode: "onBlur",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  // Surveiller le rôle pour la validation conditionnelle du bassin
  const watchedRole = form.watch("role");

  // Charger les bassins de production au montage
  useEffect(() => {
    fetchBasins().catch(console.error);
  }, [fetchBasins]);

  // Initialize form with existing data in edit mode
  useEffect(() => {
    if (isEditMode && user) {
      form.reset({
        familyName: user.familyName || "",
        givenName: user.givenName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "field_agent",
        position: user.position || "",
        productionBasinId: user.productionBasinId || "",
      });
    }
  }, [isEditMode, user, form]);

  // Réinitialiser le bassin de production quand le rôle change
  useEffect(() => {
    if (watchedRole === "technical_admin" || watchedRole === "actor_manager") {
      form.setValue("productionBasinId", "", {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false,
      });
      // Clear any existing errors for this field
      form.clearErrors("productionBasinId");
    }
  }, [watchedRole, form]);

  // Présélectionner automatiquement le bassin de production pour les administrateurs de bassin
  useEffect(() => {
    if (
      currentUser?.role === "basin_admin" &&
      currentUser.productionBasin?.id &&
      basins.length > 0 &&
      !form.getValues("productionBasinId") // Seulement si aucun bassin n'est déjà sélectionné
    ) {
      form.setValue("productionBasinId", currentUser.productionBasin.id, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [isEditMode, currentUser, basins, form]);

  // Déterminer si le bassin de production doit être affiché
  const showBassinField =
    watchedRole === "basin_admin" || watchedRole === "field_agent";

  const onSubmit: SubmitHandler<FormData> = async (data): Promise<void> => {
    try {
      // S'assurer que le bassin de production est inclus pour les administrateurs de bassin
      const submitData = { ...data };
      if (
        currentUser?.role === "basin_admin" &&
        currentUser.productionBasin?.id
      ) {
        submitData.productionBasinId = currentUser.productionBasin.id;
      }

      if (entityId) {
        // Mode modification
        await updateUser(
          entityId,
          submitData as UpdateUserRequest,
          !editOffline
        );
        if (editOffline) {
          router.replace(`/outbox`);
        } else {
          router.replace(`/users/view?entityId=${entityId}`);
        }
      } else {
        // Mode création
        await createUser(submitData as CreateUserRequest);
        form.reset();
        router.replace("/users");
      }
    } catch (error) {
      let errorMessage: string;

      // Vérifier si c'est une erreur API avec un message spécifique
      if (error instanceof ApiError) {
        // Utiliser le message spécifique du backend
        errorMessage = error.message;

        // Gérer les erreurs de validation par champ
        const fieldErrors = error.getFieldErrors();
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof FormData, {
            type: "server",
            message,
          });
        });
      } else {
        // Message générique pour les autres erreurs
        errorMessage = isEditMode
          ? t("messages.updateError")
          : t("messages.createError");
      }

      showError(errorMessage);
      console.error(
        `Erreur lors de la ${
          isEditMode ? "modification" : "création"
        } de l'utilisateur:`,
        error
      );
    }
  };

  // Options pour les rôles - filtrer selon l'utilisateur connecté
  const roleOptions = Object.entries(USER_ROLES)
    .filter(([, value]) => {
      // En mode édition, inclure actor_manager pour affichage seulement
      if (isEditMode && value === "actor_manager") return true;

      // En mode création, exclure actor_manager
      if (!isEditMode && value === "actor_manager") return false;

      // Si l'utilisateur connecté est un administrateur de bassin,
      // il ne peut pas sélectionner technical_admin
      if (currentUser?.role === "basin_admin" && value === "technical_admin") {
        return false;
      }

      return true;
    })
    .map(([, value]) => {
      const userRole = new UserRole(value as UserRoles);

      return {
        value,
        label: userRole.getDisplayName(),
      };
    });

  // Options pour les bassins de production - filtrer selon l'utilisateur connecté
  const bassinOptions = basins
    .filter((basin) => {
      // Si l'utilisateur connecté est un administrateur de bassin,
      // il ne peut sélectionner que son propre bassin
      if (currentUser?.role === "basin_admin") {
        return basin.id === currentUser.productionBasin?.id;
      }

      // Les administrateurs techniques peuvent voir tous les bassins
      return true;
    })
    .map((basin) => ({
      value: basin.id || "",
      label: basin.name,
    }));

  return (
    <BaseCard
      title={isEditMode ? t("form.editUser") : t("form.createUser")}
      footer={[
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isLoading}
          key="save-user"
          form="user-form"
        >
          {form.formState.isSubmitting || isLoading
            ? t("actions.saving")
            : isEditMode
            ? t("actions.saveChanges")
            : t("actions.save")}
        </Button>,
      ]}
    >
      {/* Alerte d'erreur de synchronisation */}
      {editOffline && entityId && (
        <SyncErrorAlert entityId={entityId} entityType="user" />
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          id="user-form"
        >
          <div className="lg:w-1/2">
            {/* Nom de famille */}
            <FormInput
              form={form}
              name="familyName"
              label={t("form.familyName")}
              required
            />
          </div>
          <div className="lg:w-1/2">
            {/* Prénom */}
            <FormInput
              form={form}
              name="givenName"
              label={t("form.givenName")}
              required
            />
          </div>

          <div className="lg:w-1/2">
            {/* Email */}
            <FormInput
              form={form}
              name="email"
              label={t("form.email")}
              type="email"
              required
            />
          </div>

          <div className="lg:w-1/2">
            {/* Téléphone */}
            <FormPhoneInput form={form} name="phone" label={t("form.phone")} />
          </div>

          <div className="lg:w-1/2">
            {/* Rôle */}
            <FormSelect
              form={form}
              name="role"
              label={t("form.role")}
              options={roleOptions}
              emptyMessage={t("form.noRoles")}
              disabled={isActorManager}
              required
            />
          </div>

          {/* Bassin de production - Conditionnel */}
          {showBassinField && (
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="productionBasinId"
                label={t("form.productionBasin")}
                emptyMessage={t("form.noBasins")}
                options={bassinOptions}
                required
                disabled={
                  isLoadingBasins || currentUser?.role === "basin_admin"
                }
                placeholder={""}
              />
            </div>
          )}

          <div className="lg:w-1/2">
            {/* Poste */}
            <FormInput
              form={form}
              name="position"
              label={t("form.position")}
              disabled={isActorManager}
            />
          </div>
        </form>
      </Form>
    </BaseCard>
  );
}
