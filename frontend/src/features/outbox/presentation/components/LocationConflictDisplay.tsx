"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Import removed: Collapsible component not available in this project
import { Icon } from "@/components/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, MapPin, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  LocationConflict,
  OutboxOperationDetails,
} from "../../domain/outbox.types";

interface LocationConflictDisplayProps {
  conflicts: LocationConflict[];
  operation: OutboxOperationDetails;
  isMobile?: boolean;
}

/**
 * Composant pour afficher les détails des conflits de localisation
 * Adapte l'affichage selon desktop (tooltip) ou mobile (zone expandée)
 */
export function LocationConflictDisplay({
  conflicts,
  operation,
  isMobile = false,
}: LocationConflictDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const conflictCount = conflicts.length;
  const conflictLabel = `${conflictCount} conflit${
    conflictCount > 1 ? "s" : ""
  } de localisation`;

  // Affichage desktop avec tooltip
  if (!isMobile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2 cursor-help">
              <Icon name="MapPin" className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                Conflits ({conflictCount})
              </Badge>
              {operation.retries > 0 && (
                <Badge variant="outline" className="text-xs">
                  {operation.retries} tentative
                  {operation.retries > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm">
            <div className="space-y-1">
              <p className="font-medium text-base">
                Ces localisations sont déjà assignées à d&apos;autres bassins :
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="text-xs bg-red-50 border border-red-200 rounded p-2"
                  >
                    <div className="font-medium text-red-700">
                      {conflict.locationName} ({conflict.locationCode})
                    </div>
                    <div className="text-red-600 mt-0.5">
                      → Bassin &quot;{conflict.basinName}&quot;
                    </div>
                  </div>
                ))}
              </div>
              {operation.lastError?.code && (
                <p className="text-xs text-muted-foreground border-t pt-1 mt-2">
                  Code: {operation.lastError.code}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Affichage mobile avec zone collapsible
  return (
    <div className="bg-red-50 border border-red-200 rounded p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium text-red-700">
            {conflictLabel}
          </span>
          {operation.retries > 0 && (
            <Badge variant="outline" className="text-xs">
              {operation.retries} tentative{operation.retries > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Link
          href={`/production-basin/edit?entityId=${operation.entityId}&editOffline`}
        >
          <Button size="sm" variant="outline" className="h-6 px-2">
            <Settings className="h-3 w-3 mr-1" />
            Résoudre
          </Button>
        </Link>
      </div>

      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-xs text-red-700 font-normal"
        >
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            Voir les détails des conflits
          </div>
        </Button>

        {isExpanded && (
          <div className="mt-2">
            <div className="text-xs text-red-600 mb-2">
              Ces localisations sont déjà assignées :
            </div>
            <div className="space-y-1">
              {conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className="text-xs bg-white border border-red-200 rounded p-2"
                >
                  <div className="font-medium text-red-700">
                    {conflict.locationName} ({conflict.locationCode})
                  </div>
                  <div className="text-red-600 mt-0.5">
                    → Bassin &quot;{conflict.basinName}&quot;
                  </div>
                </div>
              ))}
            </div>
            {operation.lastError?.code && (
              <div className="text-xs text-muted-foreground mt-2 pt-1 border-t">
                Code d&apos;erreur: {operation.lastError.code}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
