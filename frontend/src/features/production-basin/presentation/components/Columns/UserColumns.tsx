import { UserRole } from "@/core/domain/user-role.value-object";
import { User } from "@/core/domain/user.types";
import type { UserRoles } from "@/core/domain";
import { ColumnDef } from "@tanstack/react-table";
import i18n from "@/i18n/client";

// Colonnes pour la DataTable des utilisateurs
export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: () => (
      <span className="text-left text-sm !px-2 !text-foreground">
        {i18n.t("table.columns.fullName", { ns: "productionBasin" })}
      </span>
    ),
    cell: ({ row }) => (
      <div className="font-medium px-2">
        {row.original.givenName} {row.original.familyName}
      </div>
    ),
  },
  {
    accessorKey: "username",
    header: i18n.t("table.columns.username", { ns: "productionBasin" }),
    cell: ({ row }) => (
      <div className="text-muted-foreground">@{row.original.username}</div>
    ),
  },
  {
    accessorKey: "role",
    header: i18n.t("table.columns.role", { ns: "productionBasin" }),
    cell: ({ row }) => {
      const userRole = row.original.role
        ? new UserRole(row.original.role as UserRoles)
        : null;
      return userRole?.getDisplayName();
    },
  },
];
