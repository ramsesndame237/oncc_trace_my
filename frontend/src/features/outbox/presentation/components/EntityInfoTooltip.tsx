"use client";

import { Icon } from "@/components/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type EntityInfo } from "../utils/getEntityInfoFromPayload";

interface EntityInfoTooltipProps {
  entityInfo: EntityInfo | null;
  children?: React.ReactNode;
}

/**
 * Composant Tooltip pour afficher les informations détaillées d'une entité
 * dans la colonne "Record" de l'outbox
 */
export function EntityInfoTooltip({
  entityInfo,
  children,
}: EntityInfoTooltipProps) {
  const { t } = useTranslation("outbox");

  // Si pas d'info, ne rien afficher
  if (!entityInfo || entityInfo.lines.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-3">
          <div className="space-y-2">
            {/* En-tête avec icône si disponible */}
            {entityInfo.icon && (
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Icon
                  name={entityInfo.icon as never}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm font-semibold">
                  {t("entityInfo.detailsTitle")}
                </span>
              </div>
            )}

            {/* Lignes d'information */}
            <div className="space-y-1.5">
              {entityInfo.lines.map((line, index) => (
                <div key={index} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    {line.label}:
                  </span>
                  <span
                    className={
                      line.highlight
                        ? "font-semibold text-foreground"
                        : "text-foreground"
                    }
                    title={line.value}
                  >
                    {line.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
