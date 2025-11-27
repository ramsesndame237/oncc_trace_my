"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TransactionType,
  TransactionWithSync,
} from "@/features/transaction/domain/Transaction";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

interface GetTransactionColumnsProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  transactionType?: TransactionType;
}

export const getTransactionColumns = ({
  t,
  transactionType,
}: GetTransactionColumnsProps): ColumnDef<TransactionWithSync>[] => [
  {
    accessorKey: "code",
    header: t("transaction:list.code"),
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{transaction.code}</span>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {t(`transaction:locationTypes.${transaction.locationType}`)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {transactionType === "SALE" ||
            transaction.transactionType === "SALE" ? (
              <>
                <div>
                  <span className="font-medium">
                    {t("transaction:fields.seller")}:
                  </span>{" "}
                  {transaction.seller.givenName} {transaction.seller.familyName}
                </div>
                <div>
                  <span className="font-medium">
                    {t("transaction:fields.buyer")}:
                  </span>{" "}
                  {transaction.buyer.givenName} {transaction.buyer.familyName}
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="font-medium">
                    {t("transaction:fields.buyer")}:
                  </span>{" "}
                  {transaction.buyer.givenName} {transaction.buyer.familyName}
                </div>
                <div>
                  <span className="font-medium">
                    {t("transaction:fields.seller")}:
                  </span>{" "}
                  {transaction.seller.givenName} {transaction.seller.familyName}
                </div>
              </>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "products",
    header: t("transaction:list.quantity"),
    cell: ({ row }) => {
      const transaction = row.original;
      const totalWeight = transaction.products.reduce(
        (sum, product) => sum + Number(product.weight),
        0
      );
      return (
        <div className="font-medium">
          {totalWeight.toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          kg
        </div>
      );
    },
  },
  {
    id: "totalPrice",
    header: t("transaction:list.totalPrice"),
    cell: ({ row }) => {
      const transaction = row.original;
      const totalPrice = transaction.products.reduce(
        (sum, product) => sum + Number(product.totalPrice),
        0
      );
      return (
        <div className="font-medium">
          {totalPrice.toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{" "}
          FCFA
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("transaction:fields.status"),
    cell: ({ row }) => {
      const transaction = row.original;
      const status = transaction.status;

      // ⭐ Si isPendingComplementary est true, afficher "Transaction à compléter"
      if (transaction.isPendingComplementary) {
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {t("transaction:statuses.pendingComplementary")}
          </Badge>
        );
      }

      if (status === "confirmed") {
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {t("transaction:statuses.confirmed")}
          </Badge>
        );
      } else if (status === "cancelled") {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {t("transaction:statuses.cancelled")}
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {t("transaction:statuses.pending")}
          </Badge>
        );
      }
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const transaction = row.original;
      const isOnline = useOnlineStatus();
      return (
        <div className="flex justify-end">
          <Button size="sm" asChild disabled={!isOnline}>
            <Link href={`/transactions/view?entityId=${transaction.id}`}>
              {t("common:actions.viewDetails")}
            </Link>
          </Button>
        </div>
      );
    },
  },
];

// Colonnes pour mobile
export const getTransactionColumnsMobile = ({
  t,
  transactionType,
}: GetTransactionColumnsProps): ColumnDef<TransactionWithSync>[] => [
  {
    accessorKey: "code",
    header: t("transaction:list.transaction"),
    cell: ({ row }) => {
      const transaction = row.original;
      const totalWeight = transaction.products.reduce(
        (sum, product) => sum + Number(product.weight),
        0
      );
      const totalPrice = transaction.products.reduce(
        (sum, product) => sum + Number(product.totalPrice),
        0
      );

      const getStatusBadge = () => {
        const status = transaction.status;

        // ⭐ Si isPendingComplementary est true, afficher "Transaction à compléter"
        if (transaction.isPendingComplementary) {
          return (
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              {t("transaction:statuses.pendingComplementary")}
            </Badge>
          );
        }

        if (status === "confirmed") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {t("transaction:statuses.confirmed")}
            </Badge>
          );
        } else if (status === "cancelled") {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {t("transaction:statuses.cancelled")}
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              {t("transaction:statuses.pending")}
            </Badge>
          );
        }
      };

      const isOnline = useOnlineStatus();

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-base">
                {transaction.code}
              </span>
              {getStatusBadge()}
            </div>
            <Button size="sm" asChild disabled={!isOnline}>
              <Link href={`/transactions/view?entityId=${transaction.id}`}>
                {t("common:actions.viewDetails")}
              </Link>
            </Button>
          </div>

          <div className="text-sm">
            <div className="text-muted-foreground">
              {transactionType === "SALE" ||
              transaction.transactionType === "SALE" ? (
                <>
                  <span className="font-medium">
                    {t("transaction:fields.seller")}:
                  </span>{" "}
                  {transaction.seller.givenName} {transaction.seller.familyName}
                  <br />
                  <span className="font-medium">
                    {t("transaction:fields.buyer")}:
                  </span>{" "}
                  {transaction.buyer.givenName} {transaction.buyer.familyName}
                </>
              ) : (
                <>
                  <span className="font-medium">
                    {t("transaction:fields.buyer")}:
                  </span>{" "}
                  {transaction.buyer.givenName} {transaction.buyer.familyName}
                  <br />
                  <span className="font-medium">
                    {t("transaction:fields.seller")}:
                  </span>{" "}
                  {transaction.seller.givenName} {transaction.seller.familyName}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {t(`transaction:locationTypes.${transaction.locationType}`)}
            </span>
            <div className="flex flex-col items-end gap-1">
              <span className="font-medium">
                {totalWeight.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kg
              </span>
              <span className="font-semibold text-primary">
                {totalPrice.toLocaleString("fr-FR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{" "}
                FCFA
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
];
