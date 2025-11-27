"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CalendarType } from "../../domain/Calendar";
import { useCalendarStore } from "../../infrastructure/store/calendarStore";
import { searchParamsToFilters, useCalendarSearchParams } from "../hooks";
import { columns, columnsMobile } from "./Columns/ListColumns";

interface CalendarListProps {
  type?: CalendarType;
}

export const CalendarList: React.FC<CalendarListProps> = ({ type }) => {
  const { t } = useTranslation(["calendar", "common"]);
  const { calendars, meta, isLoading, setFilters } = useCalendarStore();
  const [searchParams, setSearchParams] = useCalendarSearchParams();

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Sync URL params with store filters on mount and when params change
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    // Ajouter le filtre de type si fourni
    if (type) {
      filters.type = type;
    }
    setFilters(filters);
  }, [searchParams, setFilters, type]);

  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const per_page = paginationState.pageSize;
    setSearchParams({ page, per_page });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={isMobile ? columnsMobile : columns}
          data={calendars}
          pagination={meta || undefined}
          onPaginationChange={handlePaginationChange}
          emptyMessage={
            searchParams.search
              ? t("table.noCalendarsForSearch", { search: searchParams.search })
              : t("table.noCalendars")
          }
          isMobile={isMobile}
          previousLabel={t("common:actions.previous")}
          nextLabel={t("common:actions.next")}
        />
      )}
    </div>
  );
};
