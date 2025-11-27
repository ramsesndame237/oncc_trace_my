"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserRoles } from "@/core/domain";
import { UserRole } from "@/core/domain/user-role.value-object";
import { UserWithSync } from "@/features/user/domain";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const columns: ColumnDef<UserWithSync>[] = [
  {
    accessorKey: "fullName",
    header: () => {
      const { t } = useTranslation("user");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.fullName")}
        </span>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const fullName = `${user.familyName} ${user.givenName}`;

      return (
        <Button
          size="sm"
          variant="link"
          asChild
          className="h-auto text-left justify-start"
        >
          <Link href={`/users/view?entityId=${user.id}`}>
            <div className="flex flex-col items-start">
              <span className="font-medium">{fullName}</span>
              <span className="text-xs text-muted-foreground">
                {user.username}
              </span>
            </div>
          </Link>
        </Button>
      );
    },
  },
  {
    accessorKey: "role",
    header: () => {
      const { t } = useTranslation("user");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.role")}
        </span>
      );
    },
    cell: ({ row }) => {
      const userRole = row.original.role
        ? new UserRole(row.original.role as UserRoles)
        : null;

      return <span className="text-sm">{userRole?.getDisplayName()}</span>;
    },
  },
  {
    accessorKey: "status",
    header: () => {
      const { t } = useTranslation("user");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.status")}
        </span>
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation("user");
      const status = row.original.status;

      // Déterminer la couleur selon le statut
      if (status === "active") {
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t(`table.statusLabels.${status}` as any) || status}
          </Badge>
        );
      } else if (status === "inactive") {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t(`table.statusLabels.${status}` as any) || status}
          </Badge>
        );
      } else if (status === "blocked") {
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t(`table.statusLabels.${status}` as any) || status}
          </Badge>
        );
      }

      return (
        <Badge variant="outline">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {t(`table.statusLabels.${status}` as any) || status}
        </Badge>
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
            <Link href={`/users/view?entityId=${row.original.id}`}>
              {t("actions.viewDetails")}
            </Link>
          </Button>
        </div>
      );
    },
  },
];

// Mobile columns with card layout
export const columnsMobile: ColumnDef<UserWithSync>[] = [
  {
    accessorKey: "user",
    header: () => {
      const { t } = useTranslation("user");
      return (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.users")}
        </span>
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation(["user", "common"]);
      const isOnline = useOnlineStatus();
      const user = row.original;
      const fullName = `${user.familyName} ${user.givenName}`;

      const userRole = row.original.role
        ? new UserRole(row.original.role as UserRoles)
        : null;

      return (
        <div className="space-y-2">
          <div className="flex flex-col">
            <Button
              size="sm"
              variant="link"
              asChild
              className="h-auto p-0 text-left justify-start"
            >
              <Link href={`/users/view?entityId=${user.id}`}>
                <span className="font-medium">{fullName}</span>
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {t("user:table.columns.role")}:
              </span>
              <span>{userRole?.getDisplayName()}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {t("user:table.columns.status")}:
              </span>
              {user.status === "active" ? (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`user:table.statusLabels.${user.status}` as any) ||
                    user.status}
                </Badge>
              ) : user.status === "inactive" ? (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`user:table.statusLabels.${user.status}` as any) ||
                    user.status}
                </Badge>
              ) : user.status === "blocked" ? (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`user:table.statusLabels.${user.status}` as any) ||
                    user.status}
                </Badge>
              ) : (
                <Badge variant="outline">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`user:table.statusLabels.${user.status}` as any) ||
                    user.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" asChild disabled={!isOnline}>
              <Link href={`/users/view?entityId=${user.id}`}>
                {t("common:actions.viewDetails")}
              </Link>
            </Button>
          </div>
        </div>
      );
    },
  },
];
