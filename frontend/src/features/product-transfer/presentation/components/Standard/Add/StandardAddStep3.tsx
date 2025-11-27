"use client";

import { FormInput } from "@/components/forms";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useStandardAddFormStore } from "../../../../infrastructure/store/standardAddFormStore";
import { useStandardAddFormNavigation } from "../../../hooks/useStandardAddFormNavigation";
import {
  step3Schema,
  type Step3Data,
} from "../../../schemas/standard-validation-schemas";
import { StandardFormLayout } from "./StandardFormLayout";

export function StandardAddStep3() {
  const { t } = useTranslation(["productTransfer", "common"]);

  const {
    formData,
    updateStep3Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
    entityId,
    editOffline,
  } = useStandardAddFormStore();

  const { navigateToNext, navigateToPrevious } = useStandardAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  const [hasNoDriver, setHasNoDriver] = useState(!formData.step3.hasDriver);

  // Vérifier si l'expéditeur et le destinataire sont identiques
  const isSameActor =
    formData.step1.senderActorId === formData.step1.receiverActorId &&
    formData.step1.senderActorId !== "";

  // Form setup
  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData.step3,
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Charger les données offline si en mode editOffline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!entityId || !editOffline) return;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(entityId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          // Pré-remplir le formulaire avec les données du payload
          const hasDriverValue = (payload.hasDriver as boolean) || false;
          setHasNoDriver(!hasDriverValue);

          form.reset({
            hasDriver: hasDriverValue,
            driverInfo: payload.driverInfo as Step3Data["driverInfo"],
          });
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form]);

  // Auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep3Data(data as Step3Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep3Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step3", isValid);
  }, [isValid, setStepValidation]);

  // Observer le changement du checkbox hasNoDriver
  const handleHasNoDriverChange = (checked: boolean) => {
    setHasNoDriver(checked);
    // Inverser la logique: si "n'a pas de chauffeur" est coché, hasDriver = false
    form.setValue("hasDriver", !checked);

    // Si on coche "n'a pas de chauffeur", réinitialiser les champs du chauffeur
    if (checked) {
      form.setValue("driverInfo", undefined);
    }
  };

  // Variable pour savoir si on doit afficher les champs
  // Si même acteur : afficher uniquement si checkbox NON cochée
  // Si acteurs différents : toujours afficher
  const shouldShowDriverFields = isSameActor ? !hasNoDriver : true;

  const handleNext = useCallback(async () => {
    const isFormValid = await form.trigger();
    if (isFormValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [form, navigateToNext, isNavigating]);

  const handleBack = useCallback(() => {
    navigateToPrevious();
  }, [navigateToPrevious]);

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button onClick={handleNext} disabled={!isValid || isNavigating}>
        {t("common:actions.next")}
      </Button>
    </div>
  );

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("productTransfer:form.step1.driverSection")}
      </h1>
    </div>
  );

  return (
    <StandardFormLayout>
      <div className="lg:flex items-start lg:space-x-4">
        {/* Bouton Retour AVANT le BaseCard */}
        <div className="py-3">
          <Button variant="link" onClick={handleBack}>
            <Icon name="ArrowLeft" />
            <span>{t("common:actions.back")}</span>
          </Button>
        </div>

        <BaseCard
          title={headerContent}
          footer={footerButtons}
          className="w-full"
        >
          <Form {...form}>
            <form className="space-y-6">
              {/* Checkbox: Le transfert n'a pas de chauffeur - visible uniquement si même acteur */}
              {isSameActor && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasNoDriver"
                    checked={hasNoDriver}
                    onCheckedChange={handleHasNoDriverChange}
                  />
                  <Label
                    htmlFor="hasNoDriver"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("productTransfer:form.step1.hasNoDriver")}
                  </Label>
                </div>
              )}

              {/* Afficher les champs du chauffeur selon la logique */}
              {shouldShowDriverFields && (
                <>
                  {isSameActor && <Separator />}

                  {/* Nom complet du chauffeur */}
                  <div className="lg:w-1/2">
                    <FormInput
                      form={form}
                      name="driverInfo.fullName"
                      label={t("productTransfer:form.step1.driverFullName")}
                      placeholder=""
                      required={shouldShowDriverFields}
                    />
                  </div>

                  {/* Immatriculation du véhicule */}
                  <div className="lg:w-1/2">
                    <FormInput
                      form={form}
                      name="driverInfo.vehicleRegistration"
                      label={t(
                        "productTransfer:form.step1.driverVehicleRegistration"
                      )}
                      placeholder=""
                      required={shouldShowDriverFields}
                    />
                  </div>

                  {/* Numéro de permis de conduire */}
                  <div className="lg:w-1/2">
                    <FormInput
                      form={form}
                      name="driverInfo.drivingLicenseNumber"
                      label={t(
                        "productTransfer:form.step1.driverDrivingLicenseNumber"
                      )}
                      placeholder=""
                      required={shouldShowDriverFields}
                    />
                  </div>

                  {/* Code feuille de route */}
                  <div className="lg:w-1/2">
                    <FormInput
                      form={form}
                      name="driverInfo.routeSheetCode"
                      label={t("productTransfer:form.step1.driverRouteSheetCode")}
                      placeholder=""
                      required={shouldShowDriverFields}
                    />
                  </div>
                </>
              )}
            </form>
          </Form>
        </BaseCard>
      </div>
    </StandardFormLayout>
  );
}
