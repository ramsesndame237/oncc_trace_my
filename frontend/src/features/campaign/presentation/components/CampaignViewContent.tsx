import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuditLogTable } from "@/features/auditLog";
import { dayjs } from "@/lib/dayjs";
import { showError } from "@/lib/notifications/toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCampaignStore } from "../../infrastructure/store/campaignStore";
import { useGetCampaignById } from "../hooks/useGetCampaignById";
import { CampaignActionModal } from "./CampaignActionModal";

export const CampaignViewContent: React.FC = () => {
  const { t } = useTranslation("campaign");
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const [showActionModal, setShowActionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<"activate" | "deactivate">(
    "deactivate"
  );

  // Validation de l'ID
  const id = entityId || "";

  // Appel du hook en premier pour respecter les règles des hooks
  const { campaign, isLoading, error, refetch } = useGetCampaignById(id);
  const {
    activateCampaign,
    deactivateCampaign,
    totalCampaigns,
    fetchCampaignCount,
  } = useCampaignStore();

  // Charger le nombre total de campagnes au montage
  useEffect(() => {
    fetchCampaignCount();
  }, [fetchCampaignCount]);

  const handleAction = async () => {
    if (!campaign) return;
    setIsProcessing(true);
    try {
      if (currentAction === "activate") {
        await activateCampaign({ id: campaign.id });
      } else {
        await deactivateCampaign({ id: campaign.id });
      }
      setShowActionModal(false);
      await refetch();
    } catch (error) {
      console.error(
        `Erreur lors de l'${
          currentAction === "activate" ? "activation" : "désactivation"
        }:`,
        error
      );
      showError(
        error instanceof Error
          ? error.message
          : currentAction === "activate"
          ? t("messages.activationError")
          : t("messages.deactivationError")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionModal = (action: "activate" | "deactivate") => {
    setCurrentAction(action);
    setShowActionModal(true);
  };

  if (!id || id.trim() === "") {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="ActivityIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/campaign">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  if (isLoading) {
    return <LoadingFallback message={t("view.loadingDetails")} />;
  }

  if (error) {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="ActivityIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/campaign">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  if (!campaign) {
    return (
      <AppContent
        title={t("view.notFound")}
        icon={<Icon name="ActivityIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/campaign">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  return (
    <div className="space-y-8">
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {campaign.code}
            </Heading>
            <Badge
              variant={campaign.status === "active" ? "default" : "destructive"}
              className="rounded-full p-1"
            />
          </div>
        }
        icon={<Icon name="CampaignIcon" />}
        topActionButton={[
          <Button key="edit" asChild>
            <Link href={`/campaign/edit?entityId=${campaign.id}`}>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("actions.edit")}
            </Link>
          </Button>,
          campaign.status === "active" ? (
            <Button
              key="deactivate"
              variant="destructive"
              disabled={totalCampaigns <= 1}
              onClick={() => openActionModal("deactivate")}
              title={
                totalCampaigns <= 1
                  ? t("messages.cannotDeactivateLastCampaign")
                  : t("actions.deactivate")
              }
            >
              <Icon name="PowerOffIcon" className="h-4 w-4" />
              {t("actions.deactivate")}
            </Button>
          ) : (
            <Button
              key="activate"
              variant="default"
              onClick={() => openActionModal("activate")}
            >
              <Icon name="PowerIcon" className="h-4 w-4" />
              {t("actions.activate")}
            </Button>
          ),
        ]}
      >
        <div className="space-y-2">
          <DetailRow
            label={t("view.campaignCode")}
            value={campaign.code}
            noBorder
          />
          <DetailRow
            label={t("view.startDate")}
            value={dayjs(campaign.startDate).format("D MMMM YYYY")}
            noBorder
          />
          <DetailRow
            label={t("view.endDate")}
            value={dayjs(campaign.endDate).format("D MMMM YYYY")}
            noBorder
          />
          <DetailRow
            label={t("view.duration")}
            value={`${
              dayjs(campaign.endDate).diff(dayjs(campaign.startDate), "day") + 1
            } ${t("view.days")}`}
            noBorder
          />
        </div>
      </AppContent>

      <AppContent title={t("view.history")}>
        <AuditLogTable auditableType="Campaign" auditableId={campaign.id} />
      </AppContent>

      {/* Modal d'action (activation/désactivation) */}
      <CampaignActionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        onConfirm={handleAction}
        campaignCode={campaign.code}
        isLoading={isProcessing}
        action={currentAction}
      />
    </div>
  );
};
