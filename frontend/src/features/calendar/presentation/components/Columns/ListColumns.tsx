"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Button } from "@/components/ui/button";
import { CalendarWithSync } from "@/features/calendar/domain";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { TranslateFn } from "@/i18n";
import { ColumnDef } from "@tanstack/react-table";
import { Dayjs } from "dayjs";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Formate une date en format relatif si elle est proche (hier, aujourd'hui, demain, dans X jours)
 * Sinon retourne la date au format localisé (L = DD/MM/YYYY en FR, MM/DD/YYYY en EN)
 */
const formatRelativeDate = (
  date: string | Date | null | undefined,
  t: TranslateFn,
  dayjs: (date?: string | Date) => Dayjs
): string => {
  if (!date) return "-";

  const dateObj = dayjs(date);
  const today = dayjs().startOf("day");
  const diffDays = dateObj.startOf("day").diff(today, "day");

  // Hier
  if (diffDays === -1) {
    return t("calendar:table.relativeDates.yesterday");
  }
  // Aujourd'hui
  if (diffDays === 0) {
    return t("calendar:table.relativeDates.today");
  }
  // Demain / Dans 1 jour
  if (diffDays === 1) {
    return t("calendar:table.relativeDates.inDay");
  }
  // Dans 2-7 jours
  if (diffDays >= 2 && diffDays <= 7) {
    return t("calendar:table.relativeDates.inDays", { count: diffDays });
  }

  // Pour les autres cas, afficher la date avec format court
  // 'DD MMM YYYY' = 10 jan. 2025 en français, 10 Jan 2025 en anglais
  return dateObj.format("DD MMM YYYY");
};

export const columns: ColumnDef<CalendarWithSync>[] = [
  {
    accessorKey: "code",
    header: () => {
      const { t } = useTranslation("calendar");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.code")}
        </span>
      );
    },
    cell: ({ row }) => {
      const calendar = row.original;
      const opaFullName = calendar.opa
        ? `${calendar.opa.familyName} ${calendar.opa.givenName}`
        : "-";

      return (
        <div className="flex flex-col gap-1 !px-2">
          <span className="font-medium text-sm">{calendar.code || "-"}</span>
          <span className="text-xs text-muted-foreground">{opaFullName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: () => {
      const { t } = useTranslation("calendar");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.startDate")}
        </span>
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["calendar", "common"]);
      const dayjs = useDayjsLocale();
      const calendar = row.original;
      const startDate = formatRelativeDate(calendar.startDate, t, dayjs);

      return (
        <div className="flex flex-col gap-1 !px-2">
          <span className="font-medium text-sm">{startDate}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: () => {
      const { t } = useTranslation("calendar");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.endDate")}
        </span>
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["calendar", "common"]);
      const dayjs = useDayjsLocale();
      const calendar = row.original;
      const endDate = formatRelativeDate(calendar.endDate, t, dayjs);

      return (
        <div className="flex flex-col gap-1 !px-2">
          <span className="font-medium text-sm">{endDate}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "locationRelation",
    header: () => {
      const { t } = useTranslation("calendar");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.localisation")}
        </span>
      );
    },
    cell: ({ row }) => {
      const calendar = row.original;
      const place = calendar.location || "-";

      return (
        <div className="flex flex-col gap-1 !px-2">
          <span className="text-sm font-medium">{place}</span>
          <span className="text-xs text-muted-foreground">
            <HierarchyDisplay code={row.original.locationCode || ""} />
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { t } = useTranslation("common");
      const isOnline = useOnlineStatus();
      return (
        <div className="flex justify-end">
          <Button size="sm" asChild disabled={!isOnline}>
            <Link href={`/calendars/view?entityId=${row.original.id}`}>
              {t("actions.viewDetails")}
            </Link>
          </Button>
        </div>
      );
    },
  },
];

// Mobile columns with card layout
export const columnsMobile: ColumnDef<CalendarWithSync>[] = [
  {
    accessorKey: "calendar",
    header: () => {
      const { t } = useTranslation("calendar");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("title")}
        </span>
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["calendar", "common"]);
      const dayjs = useDayjsLocale();
      const isOnline = useOnlineStatus();
      const calendar = row.original;
      const startDate = formatRelativeDate(calendar.startDate, t, dayjs);
      const endDate = formatRelativeDate(calendar.endDate, t, dayjs);
      const opaFullName = calendar.opa
        ? `${calendar.opa.familyName} ${calendar.opa.givenName}`
        : "-";

      return (
        <div className="space-y-2">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">
                {t("calendar:table.columns.code")}
              </span>
              <span className="font-medium">{calendar.code || "-"}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {opaFullName}
              </span>
            </div>

            <div className="flex flex-col mt-2">
              <span className="text-muted-foreground text-xs">
                {t("calendar:table.columns.startDate")}
              </span>
              <span className="font-medium">{startDate}</span>
            </div>

            <div className="flex flex-col mt-2">
              <span className="text-muted-foreground text-xs">
                {t("calendar:table.columns.endDate")}
              </span>
              <span className="font-medium">{endDate}</span>
            </div>

            <div className="flex flex-col mt-2">
              <span className="text-muted-foreground text-xs">
                {t("calendar:table.columns.localisation")}
              </span>
              <span className="font-medium">{calendar.location || "-"}</span>
              <span className="text-xs text-muted-foreground">
                <HierarchyDisplay code={calendar.locationCode || ""} />
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" asChild disabled={!isOnline}>
              <Link href={`/calendars/view?entityId=${calendar.id}`}>
                {t("common:actions.viewDetails")}
              </Link>
            </Button>
          </div>
        </div>
      );
    },
  },
];
