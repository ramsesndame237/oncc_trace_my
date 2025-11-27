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
import { useParcelStore } from "@/features/parcel";
import type {
  CoordinateData,
  CreateParcelData,
  ParcelType,
  UpdateParcelData,
} from "@/features/parcel/domain/parcel.types";
import { ParcelServiceProvider } from "@/features/parcel/infrastructure/di/parcelServiceProvider";
import { useLocale } from "@/hooks/useLocale";
import { showError } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useProducerOptions } from "../../hooks/useActorOptions";
import { useGetActorById } from "../../hooks/useGetActorById";
import {
  createStep2ParcelInfoSchema,
  type Step2ParcelInfoData,
} from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerEditParcels() {
  const { t } = useTranslation(["actor", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const parcelId = searchParams.get("parcelId");
  const editOffline = searchParams.has("editOffline");

  const { parcelTypes } = useProducerOptions();
  const { user } = useAuth();
  const { createParcelsBulk, updateParcel } = useParcelStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);
  const [isLoadingParcel, setIsLoadingParcel] = useState(false);

  // S'assurer qu'il y a toujours au moins une parcelle par défaut
  const getDefaultParcels = () => {
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

  // Déterminer si on est en mode édition d'une seule parcelle
  const isSingleParcelEditMode = !!parcelId;

  // État pour stocker les informations du producteur et le vrai actorId
  const [producerInfo, setProducerInfo] = useState<{
    givenName?: string;
    familyName?: string;
    onccId?: string;
    identifiantId?: string;
  } | null>(null);
  const [realActorId, setRealActorId] = useState<string | null>(null);

  // Récupérer les informations du producteur (seulement si pas en mode offline)
  const { actor } = useGetActorById(entityId || "");

  // Charger les infos du producteur depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadProducerInfo = async () => {
      if (entityId && editOffline) {
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;
            setProducerInfo({
              givenName: payload.givenName as string | undefined,
              familyName: payload.familyName as string | undefined,
              onccId: payload.onccId as string | undefined,
              identifiantId: payload.identifiantId as string | undefined,
            });
            // Récupérer le vrai actorId depuis le payload
            setRealActorId((payload.actorId as string) || null);
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des infos du producteur:",
            error
          );
        }
      }
    };

    loadProducerInfo();
  }, [entityId, editOffline]);

  // Construire le nom complet du producteur
  const producerName =
    editOffline && producerInfo
      ? [producerInfo.givenName, producerInfo.familyName]
          .filter(Boolean)
          .join(" ") ||
        producerInfo.onccId ||
        producerInfo.identifiantId ||
        t("form.producer")
      : actor
      ? [actor.givenName, actor.familyName].filter(Boolean).join(" ") ||
        actor.onccId ||
        actor.identifiantId ||
        t("form.producer")
      : t("form.producer");

  // Titre dynamique basé sur le mode
  const pageTitle = isSingleParcelEditMode
    ? t("parcels.pageTitleSingle", { name: producerName })
    : t("parcels.pageTitle", { name: producerName });

  // Charger les données d'une parcelle spécifique si parcelId est présent
  useEffect(() => {
    const loadParcelData = async () => {
      if (parcelId) {
        setIsLoadingParcel(true);
        try {
          const getParcelByIdUseCase =
            ParcelServiceProvider.getGetParcelByIdUseCase();

          // Si editOffline, passer entityId pour charger depuis IndexedDB
          // Sinon, charger depuis l'API
          const parcelData = await getParcelByIdUseCase.execute(
            parcelId,
            editOffline && entityId ? entityId : undefined
          );

          const coordinates =
            parcelData.coordinates?.map((coord: CoordinateData) => ({
              latitude: coord.latitude,
              longitude: coord.longitude,
            })) || [];

          const step2Data: Step2ParcelInfoData = {
            parcels: [
              {
                locationCode: parcelData.locationCode,
                parcelType: parcelData.parcelType,
                surfaceArea: parcelData.surfaceArea || 0,
                parcelCreationDate: parcelData.parcelCreationDate || "",
                identificationId: parcelData.identificationId || "",
                onccId: parcelData.onccId || "",
                hasCoordinates: coordinates.length > 0,
                coordinates: coordinates,
              },
            ],
          };

          // Réinitialiser le formulaire avec les données de la parcelle
          form.reset(step2Data);
          form.trigger();
        } catch (error) {
          console.error("Erreur lors du chargement de la parcelle:", error);
          showError(t("parcels.errorLoadingParcel"));
        } finally {
          setIsLoadingParcel(false);
        }
      }
    };

    loadParcelData();
  }, [parcelId, editOffline, entityId, form, t]);

  // Charger les données depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (entityId && editOffline && !parcelId) {
        setIsLoadingOfflineData(true);
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;

            console.log("payload", payload);

            // Pré-remplir le formulaire avec les données des parcelles du payload
            const loadedParcels =
              (payload?.parcels as Step2ParcelInfoData["parcels"]) ||
              getDefaultParcels();

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
  }, [entityId, editOffline, parcelId, form]);

  // S'assurer qu'il y a toujours au moins une parcelle (sauf en mode édition d'une seule parcelle)
  useEffect(() => {
    if (parcels.length === 0 && !parcelId) {
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
  }, [parcels.length, addParcel, parcelId]);

  const handleSubmit = useCallback(
    async (data: Step2ParcelInfoData) => {
      if (!entityId || isSaving) return;

      setIsSaving(true);
      try {
        // Mode édition d'une seule parcelle
        if (isSingleParcelEditMode && parcelId) {
          const parcel = data.parcels[0]; // Il n'y a qu'une seule parcelle

          console.log("parcel submit", parcel);

          // Préparer les données de la parcelle
          const parcelData: UpdateParcelData = {
            locationCode: parcel.locationCode,
            surfaceArea: parcel.surfaceArea,
            parcelType: parcel.parcelType as ParcelType,
            parcelCreationDate: parcel.parcelCreationDate,
            identificationId: parcel.identificationId,
            onccId: parcel.onccId,
          };

          // Ajouter les coordonnées seulement si elles existent et ne sont pas vides
          if (parcel.coordinates && parcel.coordinates.length > 0) {
            parcelData.coordinates = parcel.coordinates.map((coord, index) => ({
              latitude: coord.latitude,
              longitude: coord.longitude,
              pointOrder: index + 1,
            }));
          }

          await updateParcel(
            parcelId,
            parcelData,
            editOffline ? entityId : undefined
          );

          if (editOffline) {
            router.replace(`/outbox`);
          } else {
            router.replace(`/actors/producer/view?entityId=${entityId}`);
          }
        } else {
          // Mode ajout de parcelles en groupe
          // Préparer les données pour l'API
          const parcelsData = data.parcels.map((parcel) => {
            const parcelData: CreateParcelData = {
              locationCode: parcel.locationCode,
              surfaceArea: parcel.surfaceArea,
              parcelType: parcel.parcelType as ParcelType,
              parcelCreationDate: parcel.parcelCreationDate,
              identificationId: parcel.identificationId,
              onccId: parcel.onccId,
            };

            // Ajouter les coordonnées seulement si elles existent et ne sont pas vides
            if (parcel.coordinates && parcel.coordinates.length > 0) {
              parcelData.coordinates = parcel.coordinates.map(
                (coord, index) => ({
                  latitude: coord.latitude,
                  longitude: coord.longitude,
                  pointOrder: index + 1,
                })
              );
            }

            return parcelData;
          });

          // Déterminer l'actorId à utiliser
          // En mode offline, utiliser realActorId (le vrai ID du producteur)
          // Sinon, utiliser entityId
          const actorIdToUse =
            editOffline && realActorId ? realActorId : entityId;

          // Utiliser le store pour créer les parcelles
          // Si editOffline est true, on passe l'entityId pour mettre à jour l'opération existante
          await createParcelsBulk(
            {
              actorId: actorIdToUse,
              parcels: parcelsData,
            },
            editOffline ? entityId : undefined
          );

          if (editOffline) {
            router.replace(`/outbox`);
          } else {
            router.replace(`/actors/producer/view?entityId=${entityId}`);
          }
        }
      } catch (error) {
        console.error(
          isSingleParcelEditMode
            ? "Erreur lors de la modification de la parcelle:"
            : "Erreur lors de l'ajout des parcelles:",
          error
        );
        showError(
          isSingleParcelEditMode
            ? t("parcels.errorSavingParcel")
            : t("parcels.errorAddingParcels")
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      entityId,
      isSaving,
      isSingleParcelEditMode,
      parcelId,
      createParcelsBulk,
      updateParcel,
      router,
      editOffline,
      realActorId,
      t,
    ]
  );

  const handleCancel = useCallback(() => {
    if (editOffline) {
      router.push(`/outbox`);
    } else {
      router.push(`/actors/producer/view?entityId=${entityId}`);
    }
  }, [entityId, router, editOffline]);

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
      key="submit"
      type="submit"
      form="producer-parcels-form"
      disabled={!isValid || isSaving}
      className="flex items-center space-x-2"
    >
      <>
        <span>
          {isSaving ? t("common:messages.saving") : t("common:actions.save")}
        </span>
      </>
    </Button>,
    // Masquer le bouton "Ajouter un autre terrain" en mode édition d'une seule parcelle
    ...(!isSingleParcelEditMode
      ? [
          <Button
            key="add"
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={addNewParcel}
          >
            {t("parcels.addAnotherParcel")}
          </Button>,
        ]
      : []),
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {isSingleParcelEditMode
          ? t("parcels.editParcelTitle")
          : t("parcels.addParcelsTitle")}
      </h1>
    </div>
  );

  if (!entityId) {
    router.push("/actors/producer");
    return null;
  }

  return (
    <ProducerFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={pageTitle}
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
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

        {(isLoadingOfflineData || isLoadingParcel) && (
          <div className="p-4 text-center text-muted-foreground">
            {t("form.loadingData")}
          </div>
        )}

        <Form {...form}>
          <form
            id="producer-parcels-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {parcels.map((parcel, parcelIndex) => (
              <div key={parcel.id}>
                {parcelIndex > 0 && <Separator className="my-8" />}

                {!isSingleParcelEditMode && (
                  <Label className="text-lg mb-6">
                    {t("parcels.parcelNumber", { number: parcelIndex + 1 })}
                  </Label>
                )}

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
                      isEditMode={editOffline || isSingleParcelEditMode}
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

                      // Si on décoche, vider les coordonnées
                      if (!isChecked) {
                        form.setValue(
                          `parcels.${parcelIndex}.coordinates`,
                          [],
                          {
                            shouldValidate: true,
                          }
                        );
                      } else {
                        // Si on coche, ajouter une coordonnée par défaut si vide
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
                            isSaving ||
                            (form.watch(`parcels.${parcelIndex}.surfaceArea`) <=
                              4000 &&
                              (form.watch(`parcels.${parcelIndex}.coordinates`)
                                ?.length || 0) >= 1)
                          }
                          onClick={() => addCoordinate(parcelIndex)}
                        >
                          <Icon name="Plus" className="h-4 w-4 mr-1" />
                          {t("parcels.addCoordinate")}
                        </Button>
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
                                  disabled={isSaving}
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

                {/* Bouton pour supprimer la parcelle si plus d'une et pas en mode édition d'une seule parcelle */}
                {parcels.length > 1 && !isSingleParcelEditMode && (
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
