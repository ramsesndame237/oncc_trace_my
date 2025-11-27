"use client";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label: string;
  };
  className?: string;
  onClick?: () => void;
  onConsult?: () => void;
  consultButtonText?: string;
  showConsultButton?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  className,
  onClick,
  onConsult,
  consultButtonText = "Consulter",
  showConsultButton = false,
}: StatsCardProps) {
  const hasClickHandler = Boolean(onClick);

  const CardComponent = hasClickHandler ? "button" : "div";

  return (
    <CardComponent
      onClick={hasClickHandler ? onClick : undefined}
      className={cn(
        "block w-full text-left",
        hasClickHandler &&
          "hover:bg-gray-50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded",
        !hasClickHandler && "cursor-default",
        className
      )}
    >
      <Card className="h-full !rounded border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-50">
        <CardContent className="p-4">
          {/* Header avec titre et bouton consulter */}
          <div className="flex items-start justify-between mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-medium text-gray-600 leading-tight flex-1 min-w-0 line-clamp-2 cursor-help">
                  {title}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="text-xs leading-relaxed">{title}</p>
              </TooltipContent>
            </Tooltip>
            {(showConsultButton || onConsult) && (
              <Button
                variant="default"
                size="sm"
                onClick={onConsult}
                className="ml-3 bg-green-700 hover:bg-green-800 text-white px-4 py-2 text-sm font-medium rounded shrink-0"
              >
                {consultButtonText}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {/* Valeur principale - très grande et en noir */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="text-3xl font-bold text-gray-900 leading-none mb-2">
                  {typeof value === "number"
                    ? value.toLocaleString("fr-FR")
                    : value}
                </span>
              </div>
              {/* Tendance optionnelle */}
              {trend && (
                <div className="">
                  <div className="flex items-center gap-1">
                    {trend.isPositive !== undefined && (
                      <Icon
                        name={trend.isPositive ? "TrendingUp" : "TrendingDown"}
                        className={cn(
                          "h-4 w-4",
                          trend.isPositive ? "text-green-600" : "text-red-600"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        trend.isPositive !== undefined
                          ? trend.isPositive
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-primary"
                      )}
                    >
                      {trend.value.startsWith("+") ||
                      trend.value.startsWith("-")
                        ? trend.value
                        : `${trend.value}`}
                    </span>
                  </div>
                  {trend.label && (
                    <div className="text-[10px] text-gray-400 text-right">
                      {trend.label}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Description optionnelle sous la valeur */}
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[10px] text-gray-600 mb-0 truncate cursor-help">
                    {description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs leading-relaxed">{description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  );
}
