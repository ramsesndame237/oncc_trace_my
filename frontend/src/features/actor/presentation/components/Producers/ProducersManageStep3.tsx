"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { useActorStore } from "@/features/actor/infrastructure/store/actorStore";
import { useOPAManageFormStore } from "@/features/actor/infrastructure/store/opaManageFormStore";
import ProducersFormLayout from "@/features/actor/presentation/components/Producers/ProducersFormLayout";
import { useOPAManageFormNavigation } from "@/features/actor/presentation/hooks/useOPAManageFormNavigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ProducersManageStep3() {
  const { t } = useTranslation(["actor", "common"]);

  const { formData, setCurrentStep, resetForm } = useOPAManageFormStore();
  const { navigateToPrevious, handleFinish } = useOPAManageFormNavigation();
  const { addProducersToOpaBulk, isLoading: isSaving } = useActorStore();

  const [selectedOPA, setSelectedOPA] = useState<OfflineActorData | null>(null);
  const [selectedProducers, setSelectedProducers] = useState<
    OfflineActorData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(3);
    setIsConfirmed(false);
  }, [setCurrentStep]);

  // Charger les données pour le récapitulatif
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const selectedOPAId = formData.step1.selectedOPAId;
        const selectedProducerIds = formData.step2.selectedProducerIds;

        if (!selectedOPAId) {
          console.error("Aucun OPA sélectionné");
          setIsLoading(false);
          return;
        }

        // Charger l'OPA par serverId OU localId
        let opa = await db.actors
          .where("serverId")
          .equals(selectedOPAId)
          .first();

        if (!opa) {
          // Essayer de chercher par localId
          opa = await db.actors.where("localId").equals(selectedOPAId).first();
        }

        setSelectedOPA(opa || null);

        // Charger les producteurs sélectionnés
        if (selectedProducerIds && selectedProducerIds.length > 0) {
          const producers = await Promise.all(
            selectedProducerIds.map(async (id) => {
              // Chercher par serverId d'abord
              let producer = await db.actors
                .where("serverId")
                .equals(id)
                .first();

              if (!producer) {
                // Essayer de chercher par localId
                producer = await db.actors.where("localId").equals(id).first();
              }

              return producer;
            })
          );

          setSelectedProducers(
            producers.filter((p): p is OfflineActorData => p !== undefined)
          );
        } else {
          setSelectedProducers([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error(t("common:messages.error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [formData.step1.selectedOPAId, formData.step2.selectedProducerIds, t]);

  const handleSubmit = async () => {
    if (!isConfirmed || !selectedOPA) return;

    try {
      const newProducerIds = formData.step2.selectedProducerIds;
      const opaId = selectedOPA.serverId || selectedOPA.localId;

      if (!opaId) {
        toast.error("ID de l'OPA introuvable");
        return;
      }

      // Utiliser addProducersToOpaBulk pour gérer l'ajout
      await addProducersToOpaBulk({
        type: "add_producer_opa",
        opaId,
        producerIds: newProducerIds,
        opaInfo: {
          familyName: selectedOPA.familyName || "",
          givenName: selectedOPA.givenName || "",
          onccId: selectedOPA.onccId,
        },
      });

      toast.success(
        t("producers.manage.updateSuccess", {
          count: newProducerIds.length,
        })
      );

      // Réinitialiser le formulaire et rediriger
      resetForm();
      handleFinish();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(t("common:messages.error"));
    }
  };

  const handlePrevious = () => {
    navigateToPrevious();
  };

  if (isLoading) {
    return (
      <ProducersFormLayout title={t("producers.manage.title")}>
        <div className="text-center py-8">
          <Icon
            name="Loader2"
            className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin"
          />
          <p className="text-sm text-muted-foreground">
            {t("form.loadingData")}
          </p>
        </div>
      </ProducersFormLayout>
    );
  }

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("common:form.summary")}
      </h1>
    </div>
  );

  const footerButtons = [
    <Button
      key="submit"
      onClick={handleSubmit}
      disabled={!isConfirmed || isSaving}
      className="flex items-center space-x-2"
    >
      {isSaving && <Icon name="Loader2" className="h-4 w-4 animate-spin" />}
      <span>{t("common:actions.confirm")}</span>
    </Button>,
  ];

  return (
    <ProducersFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={t("producers.manage.title")}
    >
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
        {/* Affichage du nom de l'OPA en haut (comme dans ProducerAddStep2) */}
        <div className="mb-6">
          <h1 className="font-medium mb-2">
            {t("producers.manage.managingProducersFor")}
          </h1>
          {selectedOPA && (
            <p className="text-sm">
              {selectedOPA.familyName} {selectedOPA.givenName}
              {selectedOPA.onccId && (
                <span className="text-muted-foreground ml-2">
                  ({t("producersTable.columns.onccId")}: {selectedOPA.onccId})
                </span>
              )}
            </p>
          )}
          <Separator className="my-4" />
        </div>

        {/* Liste des producteurs sélectionnés */}
        <div className="space-y-6">
          <div>
            <Heading size="h3" className="mb-4">
              {t("producers.manage.selectedProducers")} (
              {selectedProducers.length})
            </Heading>

            {selectedProducers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("producers.manage.noProducersSelected")}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedProducers.map((producer) => (
                  <div
                    key={producer.serverId || producer.localId}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
                  >
                    <Icon name="UserIcon" className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {producer.familyName} {producer.givenName}
                      </p>
                      {producer.onccId && (
                        <p className="text-xs text-gray-500">
                          {t("producersTable.columns.onccId")}:{" "}
                          {producer.onccId}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Confirmation */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t("producers.manage.confirmUpdate")}
            </label>
          </div>
        </div>
      </BaseCard>
    </ProducersFormLayout>
  );
}
