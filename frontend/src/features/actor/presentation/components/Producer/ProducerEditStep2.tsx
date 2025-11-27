"use client";

import { FormDatePicker, FormInput, FormSelect } from "@/components/forms";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { useAuth } from "@/features/auth";
import { LocationSelectorForm } from "@/features/location/presentation/components/forms/LocationSelectorForm";
import { useLocale } from "@/hooks/useLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useProducerFormStore } from "../../../infrastructure/store/producerFormStore";
import { useProducerOptions } from "../../hooks/useActorOptions";
import { useProducerFormNavigation } from "../../hooks/useProducerFormNavigation";
import {
  createStep2ParcelInfoSchema,
  type Step2ParcelInfoData,
} from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerEditStep2() {
  const { t } = useTranslation(["actor", "common"]);
  const { currentLocale } = useLocale();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep2Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    isEditMode,
  } = useProducerFormStore();

  const { navigateToNext, navigateToPrevious } = useProducerFormNavigation();
  const { parcelTypes } = useProducerOptions();
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // S'assurer qu'il y a toujours au moins une parcelle par défaut
  const getDefaultParcels = () => {
    const existingParcels = formData.step2?.parcels || [];
    if (existingParcels.length > 0) {
      return existingParcels;
    }
    // Retourner une parcelle vide par défaut
    return [
      {
        locationCode: "",
        parcelType: "",
        surfaceArea: 0,
        parcelCreationDate: "",
        identificationId: "",
        onccId: "",
        hasCoordinates: false,
        coordinates: [],
      },
    ];
  };

  // Form setup
  const form = useForm({
    resolver: zodResolver(createStep2ParcelInfoSchema(t)),
    defaultValues: {
      parcels: getDefaultParcels(),
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const {
    fields: parcels,
    append: addParcel,
    remove: removeParcel,
  } = useFieldArray({
    control: form.control,
    name: "parcels",
  });

  const { isValid } = form.formState;

  React.useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Charger les données depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (entityId && editOffline) {
        setIsLoadingOfflineData(true);
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;

            // Pré-remplir le formulaire avec les données des parcelles du payload
            // z.coerce.number() dans le schéma Zod s'occupe de la conversion automatique
            const loadedParcels =
              (payload?.parcels as Step2ParcelInfoData["parcels"]) || [];

            // Normaliser les données pour s'assurer que hasCoordinates est défini
            const normalizedParcels = loadedParcels.map((parcel) => ({
              ...parcel,
              hasCoordinates:
                parcel.hasCoordinates ??
                (parcel.coordinates && parcel.coordinates.length > 0),
              coordinates: parcel.coordinates || [],
            }));

            const step2Data: Step2ParcelInfoData = {
              parcels: normalizedParcels,
            };

            // Mettre à jour le store
            updateStep2Data(step2Data);

            // Réinitialiser le formulaire avec les nouvelles données
            form.reset(step2Data);
            form.trigger();
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données offline:",
            error
          );
        } finally {
          setIsLoadingOfflineData(false);
        }
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form, updateStep2Data]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep2Data(data as Step2ParcelInfoData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep2Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(2, isValid);
  }, [isValid, setStepValidation]);

  // S'assurer qu'il y a toujours au moins une parcelle
  useEffect(() => {
    if (parcels.length === 0) {
      addParcel({
        locationCode: "",
        parcelType: "",
        surfaceArea: 0,
        parcelCreationDate: "",
        identificationId: "",
        onccId: "",
        hasCoordinates: false,
        coordinates: [],
      });
    }
  }, [parcels.length, addParcel]);

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext(2, editOffline, entityId || undefined);
    }
  }, [form, navigateToNext, isNavigating, editOffline, entityId]);

  const handlePrevious = useCallback(() => {
    navigateToPrevious(editOffline, entityId || undefined);
  }, [navigateToPrevious, editOffline, entityId]);

  const addNewParcel = () => {
    addParcel({
      locationCode: "",
      parcelType: "",
      surfaceArea: 0,
      parcelCreationDate: "",
      identificationId: "",
      onccId: "",
      hasCoordinates: false,
      coordinates: [],
    });
  };

  const addCoordinate = (parcelIndex: number) => {
    const currentCoordinates =
      form.getValues(`parcels.${parcelIndex}.coordinates`) || [];
    form.setValue(
      `parcels.${parcelIndex}.coordinates`,
      [...currentCoordinates, { latitude: 0, longitude: 0 }],
      { shouldValidate: true }
    );
  };

  const removeCoordinate = (parcelIndex: number, coordIndex: number) => {
    const currentCoordinates =
      form.getValues(`parcels.${parcelIndex}.coordinates`) || [];
    if (currentCoordinates.length > 1) {
      const updatedCoordinates = currentCoordinates.filter(
        (_, index) => index !== coordIndex
      );
      form.setValue(`parcels.${parcelIndex}.coordinates`, updatedCoordinates, {
        shouldValidate: true,
      });
    }
  };

  // Boutons du footer
  const footerButtons = [
    <Button
      key="next"
      type="button"
      onClick={handleNext}
      disabled={!isValid || isNavigating}
      className="flex items-center space-x-2"
    >
      <span>{t("common:actions.next")}</span>
    </Button>,
    <Button
      key="add"
      type="button"
      variant="outline"
      disabled={isNavigating}
      onClick={addNewParcel}
    >
      {t("parcels.addAnotherParcel")}
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("parcels.title")}
      </h1>
    </div>
  );

  return (
    <ProducerFormLayout className="lg:flex items-start lg:space-x-4">
      <div className="py-3">
        <Button variant="link" onClick={handlePrevious}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
        classNameFooter="!justify-between"
      >
        {/* Alerte d'erreur de synchronisation */}
        {editOffline && entityId && (
          <SyncErrorAlert entityId={entityId} entityType="actor" step="2" />
        )}

        {isLoadingOfflineData && (
          <div className="p-4 text-center text-muted-foreground">
            {t("form.loadingData")}
          </div>
        )}

        <Form {...form}>
          <form className="space-y-8" id="producer-step2-form">
            {parcels.map((parcel, parcelIndex) => (
              <div key={parcel.id}>
                {parcelIndex > 0 && <Separator className="my-8" />}

                <Label className="text-lg mb-6">
                  {t("parcels.parcelNumber", { number: parcelIndex + 1 })}
                </Label>

                {/* Grille 2x3 selon le design */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Localisation complète */}
                  <div className="">
                    <LocationSelectorForm
                      form={form}
                      name={`parcels.${parcelIndex}.locationCode`}
                      required
                      productionBasinId={user?.productionBasin?.id}
                      showHeader={false}
                      isEditMode={
                        isEditMode ||
                        !!formData.step2.parcels[parcelIndex]?.locationCode
                      }
                    />
                  </div>

                  <Separator className="my-4 lg:hidden" />

                  <div className="space-y-8">
                    {/* Type de parcelles */}
                    <FormSelect
                      form={form}
                      name={`parcels.${parcelIndex}.parcelType`}
                      label={t("parcels.parcelType")}
                      placeholder=""
                      options={parcelTypes}
                      required
                    />

                    {/* Superficie */}
                    <FormInput
                      form={form}
                      name={`parcels.${parcelIndex}.surfaceArea`}
                      label={t("parcels.surfaceArea")}
                      type="number"
                      required
                      unit="m²"
                      showUnit
                    />

                    {/* Date de création */}
                    <FormDatePicker
                      form={form}
                      name={`parcels.${parcelIndex}.parcelCreationDate`}
                      label={t("parcels.creationDate")}
                      placeholder=""
                      typeCalendar="v2"
                      locale={currentLocale}
                    />

                    {/* Code d'identification unique */}
                    <FormInput
                      form={form}
                      name={`parcels.${parcelIndex}.identificationId`}
                      label={t("parcels.identificationCode")}
                    />

                    {/* Code ONCC */}
                    <FormInput
                      form={form}
                      name={`parcels.${parcelIndex}.onccId`}
                      label={t("form.onccId")}
                    />
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Checkbox pour indiquer si les coordonnées sont disponibles */}
                <div className="flex items-center space-x-2 mb-6">
                  <input
                    type="checkbox"
                    id={`hasCoordinates-${parcelIndex}`}
                    checked={
                      form.watch(`parcels.${parcelIndex}.hasCoordinates`) ||
                      false
                    }
                    onChange={async (e) => {
                      const isChecked = e.target.checked;
                      form.setValue(
                        `parcels.${parcelIndex}.hasCoordinates`,
                        isChecked,
                        { shouldValidate: true }
                      );

                      // Si on décoche, réinitialiser les coordonnées
                      if (!isChecked) {
                        form.setValue(
                          `parcels.${parcelIndex}.coordinates`,
                          [],
                          {
                            shouldValidate: true,
                          }
                        );
                      } else {
                        // Si on coche et qu'il n'y a pas de coordonnées, en ajouter une par défaut
                        const currentCoords = form.getValues(
                          `parcels.${parcelIndex}.coordinates`
                        );
                        if (!currentCoords || currentCoords.length === 0) {
                          form.setValue(
                            `parcels.${parcelIndex}.coordinates`,
                            [{ latitude: 0, longitude: 0 }],
                            { shouldValidate: true }
                          );
                        }
                      }

                      // Forcer la revalidation de toute la parcelle
                      await form.trigger(`parcels.${parcelIndex}`);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`hasCoordinates-${parcelIndex}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {t("parcels.hasCoordinates")}
                  </label>
                </div>

                {/* Section Coordonnées GPS - Visible seulement si hasCoordinates est true */}
                {form.watch(`parcels.${parcelIndex}.hasCoordinates`) && (
                  <div>
                    <div className="flex lg:flex-row flex-col lg:items-center justify-between mb-6 lg:space-y-0 space-y-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {t("parcels.gpsCoordinates")}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="default"
                          disabled={
                            isNavigating ||
                            (form.watch(`parcels.${parcelIndex}.surfaceArea`) <
                              4000 &&
                              (form.watch(`parcels.${parcelIndex}.coordinates`)
                                ?.length || 0) >= 1)
                          }
                          onClick={() => addCoordinate(parcelIndex)}
                        >
                          <Icon name="Plus" className="h-4 w-4 mr-1" />
                          {t("parcels.addCoordinate")}
                        </Button>
                        {/* <Button type="button" variant="outline">
                          <Icon name="Eye" className="h-4 w-4 mr-1" />
                          {t("parcels.viewOnMap")}
                        </Button> */}
                      </div>
                    </div>

                    {/* Message d'information pour les grandes superficies */}
                    {(() => {
                      const currentArea = form.watch(
                        `parcels.${parcelIndex}.surfaceArea`
                      );
                      const areaValue = currentArea || 0;
                      const currentCoordinatesCount =
                        form.watch(`parcels.${parcelIndex}.coordinates`)
                          ?.length || 0;

                      if (
                        !isNaN(areaValue) &&
                        areaValue >= 4000 &&
                        currentCoordinatesCount < 3
                      ) {
                        return (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Icon
                                name="Info"
                                className="h-4 w-4 text-blue-600 mt-0.5"
                              />
                              <div className="text-sm text-blue-800">
                                <p className="font-medium">
                                  {t("parcels.largeSurfaceWarning")}
                                </p>
                                <p className="mt-1">
                                  {t("parcels.currentlyEntered", {
                                    count: currentCoordinatesCount,
                                  })}
                                  {currentCoordinatesCount < 3 && (
                                    <span className="text-red-600 font-medium">
                                      {" "}
                                      {t("parcels.missing", {
                                        count: 3 - currentCoordinatesCount,
                                      })}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {form
                      .watch(`parcels.${parcelIndex}.coordinates`)
                      ?.map((_, coordIndex) => (
                        <div
                          key={coordIndex}
                          className="flex flex-wrap items-stretch space-x-4 mb-4 lg:space-y-0 space-y-4"
                        >
                          <div className="lg:flex-1 flex-1/2 w-full">
                            <FormInput
                              form={form}
                              name={`parcels.${parcelIndex}.coordinates.${coordIndex}.latitude`}
                              label={t("parcels.latitude")}
                              placeholder=""
                              type="number"
                              required
                            />
                          </div>
                          <div className="lg:flex-1 flex-1/2 w-full">
                            <FormInput
                              form={form}
                              name={`parcels.${parcelIndex}.coordinates.${coordIndex}.longitude`}
                              label={t("parcels.longitude")}
                              placeholder=""
                              type="number"
                              required
                            />
                          </div>
                          <div className="flex items-center lg:flex-none flex-1/2">
                            {(form.watch(`parcels.${parcelIndex}.coordinates`)
                              ?.length ?? 0) > 1 && (
                              <div className="w-full">
                                <div className="mb-6 lg:block hidden" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  disabled={isNavigating}
                                  onClick={() =>
                                    removeCoordinate(parcelIndex, coordIndex)
                                  }
                                  className="w-full flex justify-center items-center"
                                >
                                  <Icon name="Trash2" className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Bouton pour supprimer la parcelle si plus d'une */}
                {parcels.length > 1 && (
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeParcel(parcelIndex)}
                    >
                      {t("parcels.removeThisParcel")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </form>
        </Form>
      </BaseCard>
    </ProducerFormLayout>
  );
}
