"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store } from "@/features/store/domain/store.domain.types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const NameCodeColumn = ({ row }: { row: Row<Store> }) => {
  const store = row.original;
  return (
    <div className="w-[200px]">
      <Button
        size="sm"
        variant="link"
        asChild
        className="h-auto p-0 text-left justify-start"
      >
        <Link href={`/stores/view?entityId=${store.id}`}>
          <div className="break-words text-wrap line-clamp-2 leading-normal">
            {store.name}
          </div>
        </Link>
      </Button>
      <div className="text-xs text-muted-foreground mt-1">
        {store.code || "—"}
      </div>
    </div>
  );
};

const TypeColumn = ({ row }: { row: Row<Store> }) => {
  const { t } = useTranslation("store");
  const storeType = row.original.storeType;
  if (!storeType) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="text-sm block w-[100px] break-words text-wrap">
      {t(`storeTypes.${storeType}`)}
    </span>
  );
};

const StatusColumn = ({ row }: { row: Row<Store> }) => {
  const { t } = useTranslation("store");
  const status = row.original.status;

  if (status === "active") {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        {t(`table.statusLabels.${status}` as never) || status}
      </Badge>
    );
  } else if (status === "inactive") {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        {t(`table.statusLabels.${status}` as never) || status}
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {t(`table.statusLabels.${status}` as never) || status}
    </Badge>
  );
};

const ActionsColumn = ({ row }: { row: Row<Store> }) => {
  const { t } = useTranslation("store");
  const isOnline = useOnlineStatus();
  return (
    <div className="flex justify-end">
      <Button size="sm" asChild disabled={!isOnline}>
        <Link href={`/stores/view?entityId=${row.original.id}`}>
          {t("table.viewDetails")}
        </Link>
      </Button>
    </div>
  );
};

export const useColumns = (): ColumnDef<Store>[] => {
  const { t } = useTranslation("store");

  return [
    {
      accessorKey: "name",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.name")}
        </span>
      ),
      cell: ({ row }) => <NameCodeColumn row={row} />,
    },
    {
      accessorKey: "storeType",
      header: t("table.columns.type"),
      cell: ({ row }) => <TypeColumn row={row} />,
    },
    {
      accessorKey: "status",
      header: t("table.columns.status"),
      cell: ({ row }) => <StatusColumn row={row} />,
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionsColumn row={row} />,
    },
  ];
};

export const columns: ColumnDef<Store>[] = [];

const MobileCardColumn = ({ row }: { row: Row<Store> }) => {
  const { t } = useTranslation("store");
  const isOnline = useOnlineStatus();
  const store = row.original;

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <Button
          size="sm"
          variant="link"
          asChild
          className="h-auto p-0 text-left justify-start"
        >
          <Link href={`/stores/view?entityId=${store.id}`}>
            <span className="font-medium">{store.name}</span>
          </Link>
        </Button>
        {store.location && (
          <span className="text-xs text-muted-foreground">
            {store.location.name}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {t("table.columns.code")}:
          </span>
          <span>{store.code || "—"}</span>
        </div>

        {store.surfaceArea && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {t("view.surfaceArea")}:
            </span>
            <span>
              {store.surfaceArea} {t("units.squareMeters")}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {t("table.columns.status")}:
          </span>
          {store.status === "active" ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {t(`table.statusLabels.${store.status}`) || store.status}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {t(`table.statusLabels.${store.status}`) || store.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button size="sm" asChild disabled={!isOnline}>
          <Link href={`/stores/view?entityId=${store.id}`}>
            {t("table.viewDetails")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const useColumnsMobile = (): ColumnDef<Store>[] => {
  const { t } = useTranslation("store");

  return [
    {
      accessorKey: "store",
      header: t("table.columns.stores"),
      cell: ({ row }) => <MobileCardColumn row={row} />,
    },
  ];
};

export const columnsMobile: ColumnDef<Store>[] = [];
