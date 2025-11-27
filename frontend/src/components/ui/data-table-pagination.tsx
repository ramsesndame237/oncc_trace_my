"use client";

import { Button } from "@/components/ui/button";
import { PaginationMeta } from "@/core/domain/types";
import { cn } from "@/lib/utils";
import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

const DOTS = "...";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

interface UsePaginationProps {
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
  currentPage: number;
}

const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: UsePaginationProps) => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize);

    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    /*
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount
    );

    /*
      We do not want to show dots if there is only one position left 
      after/before the left/right page count as that would lead to a change if our Pagination
      component size which we do not want
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);

      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
  }, [totalCount, pageSize, siblingCount, currentPage]);

  return paginationRange;
};

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: PaginationMeta;
  previousLabel?: string;
  nextLabel?: string;
}

export function DataTablePagination<TData>({
  table,
  pagination: serverPagination,
  previousLabel = "Précédent",
  nextLabel = "Suivant",
}: DataTablePaginationProps<TData>) {
  const {
    pagination: { pageIndex, pageSize },
  } = table.getState();

  // Utiliser les métadonnées du serveur si disponibles, sinon les données locales
  const totalCount = serverPagination
    ? serverPagination.total
    : table.getRowCount();
  const currentPage = serverPagination
    ? serverPagination.currentPage
    : pageIndex + 1;
  const totalPages = serverPagination
    ? serverPagination.lastPage
    : Math.ceil(totalCount / pageSize);

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    pageSize: serverPagination ? serverPagination.perPage : pageSize,
  });

  if (currentPage === 0 || (paginationRange && paginationRange.length < 2)) {
    return null;
  }

  const onNext = () => table.nextPage();
  const onPrevious = () => table.previousPage();

  // Masquer les boutons de navigation si il n'y a qu'une seule page
  const showNavigationButtons = totalPages > 1;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {showNavigationButtons && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 pl-2.5"
          onClick={onPrevious}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
          {previousLabel}
        </Button>
      )}

      {paginationRange?.map((pageNumber, index) => {
        if (pageNumber === DOTS) {
          return (
            <span key={`dots-${index}`} className="px-2 text-sm">
              &#8230;
            </span>
          );
        }

        return (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? "default" : "ghost"}
            size="icon"
            className={cn("h-8 w-8")}
            onClick={() => table.setPageIndex((pageNumber as number) - 1)}
          >
            {pageNumber}
          </Button>
        );
      })}

      {showNavigationButtons && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 pr-2.5"
          onClick={onNext}
          disabled={!table.getCanNextPage()}
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
