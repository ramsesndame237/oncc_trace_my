import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { AuditLogTable } from "@/features/auditLog";
import { dayjs } from "@/lib/dayjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useGetProductionBasinById } from "../hooks";
import { locationColumns } from "./Columns/LocationColumns";
import { userColumns } from "./Columns/UserColumns";

export const ProductionBasinViewContent: React.FC = () => {
  const { t } = useTranslation(["productionBasin", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  // Validation de l'ID
  const id = entityId || "";

  // Appel du hook en premier pour respecter les règles des hooks
  const { basin, isLoading, error, refetch } = useGetProductionBasinById(id);

  if (!id || id.trim() === "") {
    return (
      <AppContent
        title={t("common:messages.error")}
        icon={<Icon name="AgencyIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/production-basin">{t("view.backToList")}</Link>
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
      <AppContent
        title={t("common:messages.error")}
        icon={<Icon name="AgencyIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/production-basin">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  if (!basin) {
    return (
      <AppContent title={t("view.notFound")} icon={<Icon name="AgencyIcon" />}>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/production-basin">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <AppContent
        title={
          <Heading size="h2" className="truncate">
            {basin.name}
          </Heading>
        }
        icon={<Icon name="AgencyIcon" />}
        topActionButton={[
          <Button key="edit" asChild>
            <Link href={`/production-basin/edit?entityId=${basin.id}`}>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("actions.edit")}
            </Link>
          </Button>,
        ]}
      >
        <div className="space-y-2">
          <DetailRow label={t("view.basinName")} value={basin.name} noBorder />
          <DetailRow
            label={t("view.description")}
            value={basin.description || "---"}
            noBorder
          />
          <DetailRow
            label={t("view.createdAt")}
            value={dayjs(basin.createdAt).format("D MMMM YYYY")}
            noBorder
          />
        </div>
      </AppContent>

      <AppContent title={t("view.locations")}>
        <DataTable
          columns={locationColumns}
          data={basin.locations || []}
          emptyMessage={t("table.emptyMessages.noLocations")}
        />
      </AppContent>

      <AppContent title={t("view.assignedUsers")}>
        <DataTable
          columns={userColumns}
          data={basin.users || []}
          emptyMessage={t("table.emptyMessages.noUsers")}
        />
      </AppContent>

      <AppContent title={t("view.history")}>
        <AuditLogTable auditableType="ProductionBasin" auditableId={basin.id} />
      </AppContent>
    </div>
  );
};
