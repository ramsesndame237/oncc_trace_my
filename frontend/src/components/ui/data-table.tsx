"use client";

import {
  ColumnDef,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationMeta } from "@/core/domain/types";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  isMobile?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  pagination?: PaginationMeta | undefined;
  onPaginationChange?: (paginationState: PaginationState) => void;
  previousLabel?: string;
  nextLabel?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  isMobile,
  pageSize = 10,
  emptyMessage = "Aucun résultat.",
  pagination,
  onPaginationChange,
  previousLabel,
  nextLabel,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const isServerSidePagination = pagination && onPaginationChange;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    ...(!isServerSidePagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    manualPagination: !!isServerSidePagination,
    pageCount: isServerSidePagination ? pagination?.lastPage : undefined,
    onPaginationChange: isServerSidePagination
      ? (updater) => {
          const currentState = {
            pageIndex: pagination?.currentPage - 1,
            pageSize: pagination?.perPage,
          };
          const newState =
            typeof updater === "function" ? updater(currentState) : updater;
          onPaginationChange(newState);
        }
      : undefined,
    state: {
      sorting,
      ...(isServerSidePagination && {
        pagination: {
          pageIndex: pagination?.currentPage - 1,
          pageSize: pagination?.perPage,
        },
      }),
    },
    ...(!isServerSidePagination && {
      initialState: {
        pagination: {
          pageSize,
        },
      },
    }),
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Vue desktop */}
      <div className="border-0">
        <Table>
          {!isMobile && (
            <TableHeader className="bg-[#F0F0F0] border-b border-[#999999]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
          )}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center bg-gray-50"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && (
        <DataTablePagination
          table={table}
          pagination={isServerSidePagination ? pagination : undefined}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
        />
      )}
    </div>
  );
}
