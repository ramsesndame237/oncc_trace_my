"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACTOR_STATUS, ActorTypes } from "@/core/domain/actor.types";
import { ActorWithSync } from "@/features/actor/domain";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// Utility function to generate view URL based on actor type
const getActorViewUrl = (actorType: ActorTypes, actorId: string): string => {
  const baseUrl = "/actors";

  switch (actorType) {
    case "PRODUCER":
      return `${baseUrl}/producer/view?entityId=${actorId}`;
    case "PRODUCERS":
      return `${baseUrl}/producers/view?entityId=${actorId}`;
    case "TRANSFORMER":
      return `${baseUrl}/transformers/view?entityId=${actorId}`;
    case "BUYER":
      return `${baseUrl}/buyers/view?entityId=${actorId}`;
    case "EXPORTER":
      return `${baseUrl}/exporters/view?entityId=${actorId}`;
    default:
      // Fallback for generic actor view
      return `${baseUrl}/view?entityId=${actorId}`;
  }
};

export const columns: ColumnDef<ActorWithSync>[] = [
  {
    accessorKey: "fullName",
    header: () => {
      const { t } = useTranslation(["actor", "common"]);
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("common:fields.name")}
        </span>
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["actor", "common"]);
      const actor = row.original;
      const fullName =
        actor.fullName || `${actor.familyName} ${actor.givenName}`;

      return (
        <Button
          size="sm"
          variant="link"
          asChild
          className="h-auto text-left justify-start w-full"
        >
          <Link href={getActorViewUrl(actor.actorType, actor.id)}>
            <div className="flex flex-col items-start w-48 space-y-2">
              <div
                className="font-medium w-full break-words leading-snug max-h-10 overflow-hidden whitespace-normal"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordWrap: "break-word",
                }}
              >
                {fullName}
              </div>
              <span className="text-xs text-muted-foreground">
                {t(`options.actorTypes.${actor.actorType}`)}
              </span>
            </div>
          </Link>
        </Button>
      );
    },
  },
  {
    accessorKey: "location",
    header: () => {
      const { t } = useTranslation(["actor", "common"]);
      return t("list.address");
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["actor", "common"]);
      const actor = row.original;
      const location = actor.location;

      if (!location) {
        return (
          <span className="text-sm text-muted-foreground">
            {t("list.notProvided")}
          </span>
        );
      }

      return <HierarchyDisplay code={location.code} />;
    },
  },
  {
    accessorKey: "status",
    header: () => {
      const { t } = useTranslation(["actor", "common"]);
      return t("list.status");
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["actor", "common"]);
      const status = row.original.status;

      if (status === ACTOR_STATUS.ACTIVE) {
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {t(`options.actorStatus.${status}` as never) || status}
          </Badge>
        );
      } else if (status === ACTOR_STATUS.INACTIVE) {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {t(`options.actorStatus.${status}` as never) || status}
          </Badge>
        );
      } else if (status === ACTOR_STATUS.PENDING) {
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {t(`options.actorStatus.${status}` as never) || status}
          </Badge>
        );
      }

      return (
        <Badge variant="outline">
          {t(`options.actorStatus.${status}` as never) || status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { t } = useTranslation(["actor", "common"]);
      const isOnline = useOnlineStatus();

      return (
        <div className="flex justify-end">
          <Button size="sm" asChild disabled={!isOnline}>
            <Link
              href={getActorViewUrl(row.original.actorType, row.original.id)}
            >
              {t("common:actions.viewDetails")}
            </Link>
          </Button>
        </div>
      );
    },
  },
];

// Mobile columns with card layout
export const columnsMobile: ColumnDef<ActorWithSync>[] = [
  {
    accessorKey: "actor",
    header: () => {
      const { t } = useTranslation(["actor", "common"]);
      return t("list.producers");
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["actor", "common"]);
      const isOnline = useOnlineStatus();
      const actor = row.original;
      const fullName =
        actor.fullName || `${actor.familyName} ${actor.givenName}`;
      const location = actor.location;

      return (
        <div className="space-y-2">
          <div className="flex flex-col">
            <Button
              size="sm"
              variant="link"
              asChild
              className="h-auto p-0 text-left justify-start w-full"
            >
              <Link href={getActorViewUrl(actor.actorType, actor.id)}>
                <span className="font-medium w-full break-words leading-tight h-10">
                  {fullName}
                </span>
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              {t(`options.actorTypes.${actor.actorType}`)}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {t("list.location")}:
              </span>
              <span>
                {location ? location.name : t("list.notProvided")}
                {location && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({location.code})
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("list.status")}:</span>
              {actor.status === ACTOR_STATUS.ACTIVE ? (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {t(`options.actorStatus.${actor.status}` as never) ||
                    actor.status}
                </Badge>
              ) : actor.status === ACTOR_STATUS.PENDING ? (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {t(`options.actorStatus.${actor.status}` as never) ||
                    actor.status}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {t(`options.actorStatus.${actor.status}` as never) ||
                    actor.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" asChild disabled={!isOnline}>
              <Link href={getActorViewUrl(actor.actorType, actor.id)}>
                {t("common:actions.viewDetails")}
              </Link>
            </Button>
          </div>
        </div>
      );
    },
  },
];
