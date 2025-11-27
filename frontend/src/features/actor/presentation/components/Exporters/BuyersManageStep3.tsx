"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { useActorStore } from "@/features/actor/infrastructure/store/actorStore";
import { useExporterManageFormStore } from "@/features/actor/infrastructure/store/exporterManageFormStore";
import ExportersFormLayout from "@/features/actor/presentation/components/Exporters/ExportersFormLayout";
import { useExporterManageFormNavigation } from "@/features/actor/presentation/hooks/useExporterManageFormNavigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function BuyersManageStep3() {
  const { t } = useTranslation(["actor", "common"]);

  const { formData, setCurrentStep, resetForm } = useExporterManageFormStore();
  const { navigateToPrevious, handleFinish } = useExporterManageFormNavigation();
  const { addBuyersToExporterBulk, isLoading: isSaving } = useActorStore();

  const [selectedExporter, setSelectedExporter] = useState<OfflineActorData | null>(null);
  const [selectedBuyers, setSelectedBuyers] = useState<
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
        const selectedExporterId = formData.step1.selectedExporterId;
        const selectedBuyerIds = formData.step2.selectedBuyerIds;

        if (!selectedExporterId) {
          console.error("Aucun exportateur sélectionné");
          setIsLoading(false);
          return;
        }

        // Charger l'exportateur par serverId OU localId
        let exporter = await db.actors
          .where("serverId")
          .equals(selectedExporterId)
          .and((actor) => actor.actorType === "EXPORTER")
          .first();

        if (!exporter) {
          // Essayer de chercher par localId
          exporter = await db.actors
            .where("localId")
            .equals(selectedExporterId)
            .and((actor) => actor.actorType === "EXPORTER")
            .first();
        }

        setSelectedExporter(exporter || null);

        // Charger les buyers sélectionnés
        if (selectedBuyerIds && selectedBuyerIds.length > 0) {
          const buyers = await Promise.all(
            selectedBuyerIds.map(async (id) => {
              // Chercher par serverId d'abord
              let buyer = await db.actors
                .where("serverId")
                .equals(id)
                .and((actor) => actor.actorType === "BUYER")
                .first();

              if (!buyer) {
                // Essayer de chercher par localId
                buyer = await db.actors
                  .where("localId")
                  .equals(id)
                  .and((actor) => actor.actorType === "BUYER")
                  .first();
              }

              return buyer;
            })
          );

          setSelectedBuyers(
            buyers.filter((b): b is OfflineActorData => b !== undefined)
          );
        } else {
          setSelectedBuyers([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error(t("common:messages.error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [formData.step1.selectedExporterId, formData.step2.selectedBuyerIds, t]);

  const handleSubmit = async () => {
    if (!isConfirmed || !selectedExporter) return;

    try {
      const newBuyerIds = formData.step2.selectedBuyerIds;
      const exporterId = selectedExporter.serverId || selectedExporter.localId;

      if (!exporterId) {
        toast.error("ID de l'exportateur introuvable");
        return;
      }

      // Utiliser addBuyersToExporterBulk pour gérer l'ajout
      await addBuyersToExporterBulk({
        exporterId,
        buyerIds: newBuyerIds,
      });

      toast.success(
        t("buyers.manage.updateSuccess", {
          count: newBuyerIds.length,
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
      <ExportersFormLayout title={t("buyers.manage.title")}>
        <div className="text-center py-8">
          <Icon
            name="Loader2"
            className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin"
          />
          <p className="text-sm text-muted-foreground">
            {t("form.loadingData")}
          </p>
        </div>
      </ExportersFormLayout>
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
    <ExportersFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={t("buyers.manage.title")}
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
        {/* Affichage du nom de l'exportateur en haut */}
        <div className="mb-6">
          <h1 className="font-medium mb-2">
            {t("buyers.manage.managingBuyersFor")}
          </h1>
          {selectedExporter && (
            <p className="text-sm">
              {selectedExporter.familyName} {selectedExporter.givenName}
              {selectedExporter.onccId && (
                <span className="text-muted-foreground ml-2">
                  ({t("producersTable.columns.onccId")}: {selectedExporter.onccId})
                </span>
              )}
            </p>
          )}
          <Separator className="my-4" />
        </div>

        {/* Liste des buyers sélectionnés */}
        <div className="space-y-6">
          <div>
            <Heading size="h3" className="mb-4">
              {t("buyers.manage.selectedBuyers")} (
              {selectedBuyers.length})
            </Heading>

            {selectedBuyers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("buyers.manage.noBuyersSelected")}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedBuyers.map((buyer) => (
                  <div
                    key={buyer.serverId || buyer.localId}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
                  >
                    <Icon name="UserIcon" className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {buyer.familyName} {buyer.givenName}
                      </p>
                      {buyer.onccId && (
                        <p className="text-xs text-gray-500">
                          {t("producersTable.columns.onccId")}:{" "}
                          {buyer.onccId}
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
              {t("buyers.manage.confirmUpdate")}
            </label>
          </div>
        </div>
      </BaseCard>
    </ExportersFormLayout>
  );
}
