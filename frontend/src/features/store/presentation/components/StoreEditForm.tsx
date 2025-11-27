"use client";

import { FormInput, FormSelect } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth";
import { LocationSelectorForm } from "@/features/location/presentation/components";
import { showError } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getStoreTypeOptions } from "../../domain/constants";
import { UpdateStoreRequest } from "../../domain/types/request";
import { useStoreStore } from "../../infrastructure/store/storeStore";
import { createStoreSchema, type CreateStoreFormData } from "../schemas";

export interface StoreEditFormProps {
  entityId: string;
  editOffline: boolean;
}

export const StoreEditForm: React.FC<StoreEditFormProps> = ({
  entityId,
  editOffline,
}) => {
  const router = useRouter();
  const { t } = useTranslation("store");
  const { user } = useAuth();
  const { isLoading, fetchStoreById, createStore, updateStore } =
    useStoreStore();

  const productionBasinId =
    user?.productionBasin?.id ?? user?.productionBasinId;

  // Store type options traduits
  const storeTypeOptions = getStoreTypeOptions(t);

  // Determine if we're in edit mode
  const isEditMode = Boolean(entityId);

  const form = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      code: "",
      storeType: "EXPORT",
      capacity: "",
      surfaceArea: "",
      locationCode: "",
    },
    mode: "onBlur",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  // LocationSelectorForm gère maintenant son propre chargement de données
  // Suppression du double chargement

  // Load existing store data in edit mode
  useEffect(() => {
    if (isEditMode && entityId) {
      // Si editOffline est true, on est en mode offline
      const isOnline = !editOffline;
      fetchStoreById(entityId, isOnline)
        .then((store) => {
          if (store) {
            form.reset({
              name: store.name || "",
              code: store.code || "",
              storeType:
                (store.storeType as
                  | "EXPORT"
                  | "GROUPING"
                  | "GROUPING_AND_MACHINING") || "EXPORT",
              capacity: store.capacity || "",
              surfaceArea: store.surfaceArea || "",
              locationCode: store.locationCode || "",
            });
          }
        })
        .catch(console.error);
    }
  }, [isEditMode, entityId, editOffline, fetchStoreById, form]);

  const onSubmit: SubmitHandler<CreateStoreFormData> = async (
    data
  ): Promise<void> => {
    try {
      if (entityId) {
        // Mode modification - transform the data to UpdateStoreRequest format
        const updateData: Omit<UpdateStoreRequest, "id"> = {
          name: data.name,
          code: data.code,
          storeType: data.storeType,
          capacity: data.capacity === "" ? undefined : data.capacity,
          surfaceArea: data.surfaceArea === "" ? undefined : data.surfaceArea,
          locationCode: data.locationCode,
        };
        // Si editOffline est true, on est en mode offline
        const isOnline = !editOffline;
        await updateStore(entityId, updateData, isOnline);

        if (editOffline) {
          await router.replace(`/outbox`);
        } else {
          await router.replace(`/stores/view?entityId=${entityId}`);
        }
      } else {
        // Mode création
        await createStore({
          ...data,
          capacity: data.capacity === "" ? undefined : data.capacity,
          surfaceArea: data.surfaceArea === "" ? undefined : data.surfaceArea,
        });
        form.reset();
        await router.replace("/stores");
      }
    } catch (error) {
      const errorMessage = isEditMode
        ? t("messages.updateError")
        : t("messages.createError");

      showError(errorMessage);
      console.error(
        `Erreur lors de la ${
          isEditMode ? "modification" : "création"
        } du magasin:`,
        error
      );
    }
  };

  return (
    <BaseCard
      title={isEditMode ? t("form.editStore") : t("form.createStore")}
      footer={[
        <Button
          key="save-store"
          type="submit"
          disabled={form.formState.isSubmitting || isLoading}
          form="store-form"
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
        <SyncErrorAlert entityId={entityId} entityType="store" />
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          id="store-form"
        >
          <div className="lg:w-1/2">
            <FormInput
              form={form}
              name="name"
              label={t("form.storeName")}
              required
            />
          </div>

          <div className="lg:w-1/2">
            <FormInput form={form} name="code" label={t("form.storeCode")} />
          </div>

          <div className="lg:w-1/2">
            <FormSelect
              form={form}
              name="storeType"
              label={t("form.storeType")}
              placeholder={t("form.selectStoreType")}
              options={storeTypeOptions}
              emptyMessage={t("form.noTypesAvailable")}
              required
            />
          </div>

          <div className="lg:w-1/2">
            <FormInput
              form={form}
              name="capacity"
              label={t("form.capacity")}
              type="number"
              unit={t("units.tons")}
              showUnit={true}
              unitPosition="right"
            />
          </div>

          <div className="lg:w-1/2">
            <FormInput
              form={form}
              name="surfaceArea"
              label={t("form.surfaceArea")}
              type="number"
              unit={t("units.squareMeters")}
              showUnit={true}
              unitPosition="right"
            />
          </div>

          <Separator />

          <div className="lg:w-1/2">
            <LocationSelectorForm
              form={form}
              name="locationCode"
              label={t("form.location")}
              isEditMode={isEditMode}
              onlyInProductionBasin
              productionBasinId={productionBasinId}
              required
            />
          </div>
        </form>
      </Form>
    </BaseCard>
  );
};
