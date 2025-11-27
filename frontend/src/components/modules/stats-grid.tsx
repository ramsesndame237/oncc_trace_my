"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heading } from "./heading";
import { StatsCard, StatsCardProps } from "./stats-card";

export interface StatsGridProps {
  title?: string;
  subtitle?: string;
  stats: StatsCardProps[];
  className?: string;
  onGlobalConsult?: () => void;
  globalConsultText?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function StatsGrid({
  title,
  subtitle,
  stats,
  className,
  onGlobalConsult,
  globalConsultText = "Consulter",
  columns = 4,
}: StatsGridProps) {
  const getGridCols = (cols: number) => {
    switch (cols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
      case 4:
      default:
        return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
    }
  };

  return (
    <div className={cn("bg-white", className)}>
      {/* En-tête avec titre et bouton consulter principal */}
      {(title || onGlobalConsult) && (
        <div className="flex items-center justify-between border-l-4 border-primary px-4 py-2 bg-[#f9fbfd] shadow">
          <div>
            {title && (
              <Heading
                size="h2"
                className=" font-medium truncate min-w-0"
                weight="bold"
              >
                {title}
              </Heading>
            )}
          </div>
          {onGlobalConsult && (
            <Button variant="default" size="sm" onClick={onGlobalConsult}>
              {globalConsultText}
            </Button>
          )}
        </div>
      )}

      {/* Grille de cartes statistiques */}
      <div className="space-y-6 bg-white p-6 border border-gray-200 rounded-b-lg overflow-hidden">
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        <div className={cn("grid gap-6", getGridCols(columns))}>
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </div>
  );
}
