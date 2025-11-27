"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuditLogTable } from "@/features/auditLog";
import { DocumentTable } from "@/features/document";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { ProducerParcelsSection } from "@/features/parcel";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { showError } from "@/lib/notifications/toast";
import { formatPhoneDisplay } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useActorModal } from "../../hooks/useActorModal";
import { useActorOptions } from "../../hooks/useActorOptions";
import { useGetActorById } from "../../hooks/useGetActorById";
import { ProducerOpasTable } from "../DataTables/ProducerOpasTable";
import { ProducerProductionsTable } from "../DataTables/ProducerProductionsTable";

export const ProducerViewContent: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");
  const isOnline = useOnlineStatus();

  // Validation de l'ID
  const id = entityId || "";
  const editOffline = entityType ? true : false;

  // Data fetching hooks
  const { actor, isLoading, error, refetch } = useGetActorById(id);

  const { genders } = useActorOptions();

  // Actor store hook
  const { updateActorStatus } = useActorStore();

  // Actor modal hook
  const { confirmActorActivation, confirmActorDeactivation } = useActorModal();

  // Handle producer activation
  const handleActivate = async () => {
    if (!actor?.id) return;

    try {
      const confirmed = await confirmActorActivation(actor.id, async () => {
        await updateActorStatus(actor.id, "active");
        await refetch();
      });

      if (confirmed) {
        console.log("Producteur activé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("actor:errors.activationFailed")
      );
    }
  };

  // Handle producer deactivation
  const handleDeactivate = async () => {
    if (!actor?.id) return;

    try {
      const confirmed = await confirmActorDeactivation(actor.id, async () => {
        await updateActorStatus(actor.id, "inactive");
        await refetch();
      });

      if (confirmed) {
        console.log("Producteur désactivé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("actor:errors.deactivationFailed")
      );
    }
  };

  // 1. Invalid ID state
  if (!id || id.trim() === "") {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="ProducerIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive">{t("producer.invalidId")}</p>
          <Button asChild className="mt-4">
            <Link href="/actors/producer">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // 2. Loading state
  if (isLoading) {
    return <LoadingFallback message={t("producer.loadingDetails")} />;
  }

  // 3. Error state
  if (error) {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="ProducerIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("common:actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/actors/producer">{t("view.backToList")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. Not found state
  if (!actor) {
    return (
      <AppContent
        title={t("view.notFound")}
        icon={<Icon name="ProducerIcon" />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/actors/producer">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Validate that this is actually a producer
  if (actor.actorType !== "PRODUCER") {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="ProducerIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive">{t("producer.notAProducer")}</p>
          <Button asChild className="mt-4">
            <Link href="/actors/producer">{t("view.backToList")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Format full name
  const fullName =
    [actor.givenName, actor.familyName].filter(Boolean).join(" ") ||
    actor.onccId ||
    actor.identifiantId ||
    "---";

  interface MetadataRecord {
    metaKey: string;
    metaValue: string;
  }

  // Metadata peut être soit un Record soit un tableau selon la source
  const metadataArray: MetadataRecord[] = Array.isArray(actor.metadata)
    ? actor.metadata
    : actor.metadata
    ? Object.entries(actor.metadata).map(([key, value]) => ({
        metaKey: key,
        metaValue: value as string,
      }))
    : [];

  const gender =
    metadataArray.find((r) => r.metaKey === "gender")?.metaValue || "---";
  const birthDate =
    metadataArray.find((r) => r.metaKey === "birthDate")?.metaValue || "---";
  const birthPlace =
    metadataArray.find((r) => r.metaKey === "birthPlace")?.metaValue || "---";
  const sustainabilityProgram =
    metadataArray.find((r) => r.metaKey === "sustainabilityProgram")
      ?.metaValue || "---";
  const cniNumber =
    metadataArray.find((r) => r.metaKey === "cniNumber")?.metaValue || "---";

  // Main content display
  return (
    <div className="space-y-8">
      <AppContent
        title={
          <div className="flex items-center gap-x-2">
            <Heading size="h2" className="truncate">
              {fullName}
            </Heading>
            {actor.status === "active" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {t("options.actorStatus.active")}
              </Badge>
            ) : actor.status === "pending" ? (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {t("options.actorStatus.pending")}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {t("options.actorStatus.inactive")}
              </Badge>
            )}
          </div>
        }
        icon={<Icon name="ProducerIcon" />}
        topActionButton={[
          // Edit button
          isOnline ? (
            <Button key="edit" asChild>
              <Link
                href={`/actors/producer/edit?entityId=${actor.id}${
                  editOffline ? `&editOffline=true` : ""
                }`}
              >
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("common:actions.edit")}
              </Link>
            </Button>
          ) : (
            <Button key="edit" disabled>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("common:actions.edit")}
            </Button>
          ),
          // Activation/Deactivation button
          // pending → validate info | active → deactivate | inactive → activate
          actor.status === "active" ? (
            <Button
              key="deactivate"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={!isOnline}
            >
              <Icon name="PowerOffIcon" className="h-4 w-4" />
              {t("actor:actions.deactivate")}
            </Button>
          ) : actor.status === "pending" ? (
            <Button
              key="validate"
              variant="default"
              onClick={handleActivate}
              disabled={!isOnline}
            >
              <Icon name="CheckCircleIcon" className="h-4 w-4" />
              {t("actor:actions.validateInformation")}
            </Button>
          ) : (
            <Button
              key="activate"
              variant="default"
              onClick={handleActivate}
              disabled={!isOnline}
            >
              <Icon name="PowerIcon" className="h-4 w-4" />
              {t("actor:actions.activate")}
            </Button>
          ),
        ].filter(Boolean)}
      >
        {/* Section: Informations du producteur */}
        <div className="space-y-6">
          <div>
            <Heading size="h3" className="mb-6">
              {t("producer.producerInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("form.givenName")}
                value={actor.givenName || "---"}
                noBorder
              />
              <DetailRow
                label={t("form.familyName")}
                value={actor.familyName || "---"}
                noBorder
              />

              <DetailRow
                label={t("form.gender")}
                value={
                  genders.find((gen) => gen.value === gender)?.label || "---"
                }
                noBorder
              />

              <DetailRow
                label={t("form.birthDate")}
                value={
                  birthDate ? dayjs(birthDate).format("D MMMM YYYY") : "---"
                }
                noBorder
              />

              <DetailRow
                label={t("form.birthPlace")}
                value={`${birthPlace}`}
                noBorder
              />

              <DetailRow
                label={t("form.sustainabilityProgram")}
                value={
                  sustainabilityProgram === "true"
                    ? t("common:actions.yes")
                    : t("common:actions.no")
                }
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Identifications */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("producers.sections.identifications")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("form.cniNumber")}
                value={cniNumber}
                noBorder
              />
              <DetailRow
                label={t("producers.fields.onccId")}
                value={actor.onccId || "---"}
                noBorder
              />

              <DetailRow
                label={t("producers.fields.identifiantId")}
                value={actor.identifiantId || "---"}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Informations de contact */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.contactInfo")}
            </Heading>
            <div className="space-y-2">
              <DetailRow
                label={t("common:fields.email")}
                value={actor.email || "---"}
                noBorder
              />
              <DetailRow
                label={t("common:fields.phone")}
                value={actor.phone ? formatPhoneDisplay(actor.phone) : "---"}
                noBorder
              />
              <DetailRow
                label={t("list.address")}
                value={<HierarchyDisplay code={actor.locationCode || ""} />}
                noBorder
              />
            </div>
          </div>

          <Separator />

          {/* Section: Informations du compte */}
          <div>
            <Heading size="h3" className="mb-6">
              {t("view.accountInfo")}
            </Heading>
            <div className="space-y-2">
              {actor.createdAt && (
                <DetailRow
                  label={t("common:dateTime.createdAt")}
                  value={dayjs(actor.createdAt).format("D MMMM YYYY à HH:mm")}
                  noBorder
                />
              )}
              {actor.updatedAt && (
                <DetailRow
                  label={t("common:dateTime.updatedAt")}
                  value={dayjs(actor.updatedAt).format("D MMMM YYYY à HH:mm")}
                  noBorder
                />
              )}
            </div>
          </div>
        </div>
      </AppContent>

      <AppContent
        title={t("common:navigation.parcels")}
        topActionButton={[
          isOnline ? (
            <Button key="edit" asChild>
              <Link href={`/actors/producer/edit/parcels?entityId=${actor.id}`}>
                <Icon name="PlusIcon" className="h-4 w-4" />
                {t("producer.createParcels")}
              </Link>
            </Button>
          ) : (
            <Button key="edit" disabled>
              <Icon name="PlusIcon" className="h-4 w-4" />
              {t("producer.createParcels")}
            </Button>
          ),
        ].filter(Boolean)}
      >
        <ProducerParcelsSection actorId={actor.id} />
      </AppContent>

      <AppContent
        title={t("common:navigation.documents")}
        topActionButton={[
          isOnline ? (
            <Button key="manage" asChild>
              <Link
                href={`/actors/producer/edit/documents?entityId=${actor.id}`}
              >
                <Icon name="EditIcon" className="h-4 w-4" />
                {t("producer.manageDocuments")}
              </Link>
            </Button>
          ) : (
            <Button key="manage" disabled>
              <Icon name="EditIcon" className="h-4 w-4" />
              {t("producer.manageDocuments")}
            </Button>
          ),
        ].filter(Boolean)}
      >
        <DocumentTable documentableType="Actor" documentableId={actor.id} />
      </AppContent>

      <AppContent
        title={t("view.otherInfo")}
        defautValue="opas"
        tabContent={[
          {
            title: "OPA",
            key: "opas",
            content: <ProducerOpasTable producerId={actor.id} />,
          },
          {
            title: t("producer.production"),
            key: "production",
            content: <ProducerProductionsTable producerId={actor.id} />,
          },
          {
            title: t("view.history"),
            key: "history",
            content: (
              <AuditLogTable auditableType="Actor" auditableId={actor.id} />
            ),
          },
        ]}
      />
    </div>
  );
};
