"use client";

import { FormInput, FormTextarea } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LocationMultiSelectorForm } from "@/features/location/presentation/components/forms/LocationMultiSelectorForm";
import { showError } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, type JSX } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useProductionBasinStore } from "../../infrastructure/store/productionBasinStore";
import { useGetProductionBasinById } from "../hooks";
import {
  productionBasinSchema,
  type ProductionBasinFormData,
} from "../schemas";

export interface ProductionBasinEditFormProps {
  entityId?: string;
  editOffline?: boolean;
}

export function ProductionBasinEditForm({
  entityId,
  editOffline,
}: ProductionBasinEditFormProps): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("productionBasin");
  const { createBasin, modifyBasin, isLoading } = useProductionBasinStore();

  // Mode édition : charger les données si entityId présent
  const { basin, isLoading: isLoadingBasin } = useGetProductionBasinById(
    entityId ?? "",
    !editOffline
  );

  // Determine if we're in edit mode
  const isEditMode = Boolean(entityId);

  const form = useForm<ProductionBasinFormData>({
    resolver: zodResolver(productionBasinSchema),
    defaultValues: {
      name: "",
      description: "",
      locationCodes: [],
    },
    mode: "onChange",
  });

  // Initialiser le formulaire en mode édition
  useEffect(() => {
    if (isEditMode && basin) {
      const formData = {
        name: basin.name,
        description: basin.description || "",
        locationCodes: basin.locations?.map((l) => l.code) || [],
      };
      form.reset(formData);
    }
  }, [isEditMode, basin, form]);

  const onSubmit: SubmitHandler<ProductionBasinFormData> = async (
    data
  ): Promise<void> => {
    try {
      if (entityId) {
        await modifyBasin(
          {
            id: entityId,
            name: data.name,
            description: data.description || "",
            locationCodes: data.locationCodes,
          },
          !editOffline
        );

        if (editOffline) {
          router.replace(`/outbox`);
        } else {
          router.replace(`/production-basin/view?entityId=${entityId}`);
        }
      } else {
        await createBasin({
          name: data.name,
          description: data.description || "",
          locationCodes: data.locationCodes,
        });
        form.reset();
        router.replace(`/production-basin`);
      }
    } catch (error) {
      showError(
        entityId ? t("messages.updateError") : t("messages.createError")
      );
      console.error("Erreur lors de la sauvegarde du bassin:", error);
    }
  };

  if (entityId && isLoadingBasin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingLoader />
          <p className="mt-4 text-muted-foreground">
            {t("view.loadingBasinInfo")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <BaseCard
      title={entityId ? t("form.editBasin") : t("form.createBasin")}
      footer={[
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isLoading}
          key="save-basin"
          form="edit-basin-form"
        >
          {form.formState.isSubmitting || isLoading
            ? t("actions.saving")
            : entityId
            ? t("actions.saveChanges")
            : t("actions.save")}
        </Button>,
      ]}
    >
      {/* Alerte d'erreur de synchronisation */}
      {editOffline && entityId && (
        <SyncErrorAlert entityId={entityId} entityType="productionBasin" />
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          id="edit-basin-form"
        >
          <div className="lg:w-1/2">
            <FormInput
              form={form}
              name="name"
              label={t("form.basinName")}
              required
            />
          </div>

          <div className="lg:w-1/2">
            <FormTextarea
              form={form}
              name="description"
              label={t("form.description")}
              className="min-h-[120px]"
            />
          </div>

          <LocationMultiSelectorForm
            form={form}
            name="locationCodes"
            label={t("form.associatedLocations")}
            description={t("form.selectLocationsDescription")}
          />
        </form>
      </Form>
    </BaseCard>
  );
}
