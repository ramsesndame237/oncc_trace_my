"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/core/infrastructure/store/navigationStore";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

type QuickActionType = "add-convention" | "add-groupage-transfer" | "add-standard-transfer" | "add-market-calendar" | "add-pickup-calendar" | "add-sale-transaction" | "add-purchase-transaction";

function QuickMenuPageContent() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { user } = useAuth();
  const { getReturnPath, clearReturnPath } = useNavigationStore();
  const [selectedType, setSelectedType] = useState<QuickActionType | null>(
    null
  );

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type PRODUCERS
  const isActorManagerProducers =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    user?.actor?.actorType === "PRODUCERS";

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER
  const isActorManagerBET =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    ["BUYER", "EXPORTER", "TRANSFORMER"].includes(user?.actor?.actorType || "");

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type TRANSFORMER
  const isActorManagerTransformer =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    user?.actor?.actorType === "TRANSFORMER";

  // ⭐ Vérifier si l'utilisateur est un field_agent (ne peut que créer des transactions)
  const isFieldAgent = user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT;

  const handleNext = () => {
    if (!selectedType) return;

    if (selectedType === "add-convention") {
      // Rediriger vers le formulaire de création de convention
      router.push("/conventions/create");
    } else if (selectedType === "add-groupage-transfer") {
      // Rediriger vers le formulaire de création de transfert GROUPAGE
      router.push("/product-transfers/groupage/create/general-info");
    } else if (selectedType === "add-standard-transfer") {
      // Rediriger vers le formulaire de création de transfert STANDARD
      router.push("/product-transfers/standard/create/general-info");
    } else if (selectedType === "add-market-calendar") {
      // Rediriger vers le formulaire de création de calendrier MARCHE
      router.push("/calendars/market/create/informations");
    } else if (selectedType === "add-pickup-calendar") {
      // Rediriger vers le formulaire de création de calendrier ENLEVEMENT
      router.push("/calendars/pickup/create/informations");
    } else if (selectedType === "add-sale-transaction") {
      // Rediriger vers le formulaire de création de transaction de vente
      router.push("/transactions/sale/create/general-info");
    } else if (selectedType === "add-purchase-transaction") {
      // Rediriger vers le formulaire de création de transaction d'achat
      router.push("/transactions/purchase/create/general-info");
    }
  };

  const handleCancel = () => {
    // Récupérer la page de retour sauvegardée
    const returnPath = getReturnPath();

    // Nettoyer le chemin de retour du store
    clearReturnPath();

    // Naviguer vers la page de retour ou dashboard par défaut
    router.replace(returnPath || "/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={t("quickMenu.title")}
        rightContent={[
          <Button
            variant={isMobile ? "link" : "outline"}
            key="cancel"
            size="sm"
            onClick={handleCancel}
          >
            <Icon name="X" />
            <span className="hidden lg:block">
              {t("common:actions.cancel")}
            </span>
          </Button>,
        ]}
      />

      {/* Contenu principal */}
      <main className="container mx-auto max-w-4xl lg:p-6">
        <BaseCard
          title={t("quickMenu.title")}
          className="w-full"
          footer={
            <Button onClick={handleNext} disabled={!selectedType}>
              {t("common:actions.next")}
            </Button>
          }
        >
          <div className="space-y-6">
            <RadioGroup
              value={selectedType || ""}
              onValueChange={(value) =>
                setSelectedType(value as QuickActionType)
              }
              className="space-y-3"
            >
              {/* ⭐ Cacher l'option convention pour field_agent et actor_manager BUYER/EXPORTER/TRANSFORMER */}
              {!isFieldAgent && !isActorManagerBET && (
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="add-convention" id="add-convention" />
                  <Label
                    htmlFor="add-convention"
                    className="cursor-pointer font-semibold"
                  >
                    {t("quickActions.addConvention")}
                  </Label>
                </div>
              )}
              {/* ⭐ Cacher l'option transfert groupage pour field_agent et actor_manager BUYER/EXPORTER/TRANSFORMER */}
              {!isFieldAgent && !isActorManagerBET && (
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="add-groupage-transfer" id="add-groupage-transfer" />
                  <Label
                    htmlFor="add-groupage-transfer"
                    className="cursor-pointer font-semibold"
                  >
                    {t("quickActions.addGroupageTransfer")}
                  </Label>
                </div>
              )}
              {/* ⭐ Cacher l'option transfert standard pour field_agent et actor_manager TRANSFORMER */}
              {!isFieldAgent && !isActorManagerTransformer && (
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="add-standard-transfer" id="add-standard-transfer" />
                  <Label
                    htmlFor="add-standard-transfer"
                    className="cursor-pointer font-semibold"
                  >
                    {t("quickActions.addStandardTransfer")}
                  </Label>
                </div>
              )}
              {/* ⭐ Cacher les options calendrier marché et enlèvement pour field_agent et actor_manager BUYER/EXPORTER/TRANSFORMER */}
              {!isFieldAgent && !isActorManagerBET && (
                <>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="add-market-calendar" id="add-market-calendar" />
                    <Label
                      htmlFor="add-market-calendar"
                      className="cursor-pointer font-semibold"
                    >
                      {t("quickActions.addMarketCalendar")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="add-pickup-calendar" id="add-pickup-calendar" />
                    <Label
                      htmlFor="add-pickup-calendar"
                      className="cursor-pointer font-semibold"
                    >
                      {t("quickActions.addPickupCalendar")}
                    </Label>
                  </div>
                </>
              )}
              {/* ⭐ Cacher l'option transaction de vente pour actor_manager TRANSFORMER */}
              {!isActorManagerTransformer && (
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="add-sale-transaction" id="add-sale-transaction" />
                  <Label
                    htmlFor="add-sale-transaction"
                    className="cursor-pointer font-semibold"
                  >
                    {t("quickActions.addSaleTransaction")}
                  </Label>
                </div>
              )}
              {/* ⭐ Cacher l'option transaction d'achat pour actor_manager PRODUCERS */}
              {!isActorManagerProducers && (
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="add-purchase-transaction" id="add-purchase-transaction" />
                  <Label
                    htmlFor="add-purchase-transaction"
                    className="cursor-pointer font-semibold"
                  >
                    {t("quickActions.addPurchaseTransaction")}
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>
        </BaseCard>
      </main>
    </div>
  );
}

export default function QuickMenuPage() {
  const { t } = useTranslation(["common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <QuickMenuPageContent />
    </Suspense>
  );
}
