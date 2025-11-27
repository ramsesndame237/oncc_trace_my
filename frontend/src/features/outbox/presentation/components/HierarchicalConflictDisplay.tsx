"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, GitBranch, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  RegionConflict,
  DepartmentConflict,
  OutboxOperationDetails,
} from "../../domain/outbox.types";

interface HierarchicalConflictDisplayProps {
  regionConflicts?: RegionConflict[];
  departmentConflicts?: DepartmentConflict[];
  districtParentConflicts?: DepartmentConflict[]; // District → Département parent
  departmentParentConflicts?: RegionConflict[]; // Département → Région parente
  operation: OutboxOperationDetails;
  isMobile?: boolean;
}

/**
 * Composant pour afficher les détails des conflits hiérarchiques
 * Adapte l'affichage selon desktop (tooltip) ou mobile (zone expandée)
 * Gère 4 types de conflits :
 * - Région → Départements enfants
 * - Département → Districts enfants
 * - District → Département parent
 * - Département → Région parente
 */
export function HierarchicalConflictDisplay({
  regionConflicts = [],
  departmentConflicts = [],
  districtParentConflicts = [],
  departmentParentConflicts = [],
  operation,
  isMobile = false,
}: HierarchicalConflictDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const allConflicts = [
    ...regionConflicts,
    ...departmentConflicts,
    ...districtParentConflicts,
    ...departmentParentConflicts,
  ];
  if (allConflicts.length === 0) {
    return null;
  }

  const conflictCount = allConflicts.length;

  // Déterminer le type de conflit pour le label
  let conflictType = "";
  if (operation.lastError?.code === "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT") {
    conflictType = "région-département";
  } else if (operation.lastError?.code === "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT") {
    conflictType = "département-arrondissement";
  } else if (operation.lastError?.code === "PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT") {
    conflictType = "arrondissement-département";
  } else if (operation.lastError?.code === "PRODUCTION_BASIN_DEPARTMENT_PARENT_CONFLICT") {
    conflictType = "département-région";
  }

  const conflictLabel = `${conflictCount} conflit${
    conflictCount > 1 ? "s" : ""
  } hiérarchique${conflictCount > 1 ? "s" : ""} (${conflictType})`;

  // Affichage desktop avec tooltip
  if (!isMobile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2 cursor-help">
              <Icon name="GitBranch" className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                Hiérarchiques ({conflictCount})
              </Badge>
              {operation.retries > 0 && (
                <Badge variant="outline" className="text-xs">
                  {operation.retries} tentative
                  {operation.retries > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-lg">
            <div className="space-y-1">
              <p className="font-medium text-base">
                Conflits hiérarchiques détectés :
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allConflicts.map((hierarchicalConflict, index) => (
                  <div
                    key={index}
                    className="text-xs bg-red-50 border border-red-200 rounded p-2"
                  >
                    <div className="font-medium text-red-700 mb-1">
                      Tentative d&apos;ajout : {hierarchicalConflict.parentLocationName} ({hierarchicalConflict.parentLocationCode})
                    </div>
                    <div className="text-red-600 text-xs mb-1">
                      {operation.lastError?.code === "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT"
                        ? 'Départements en conflit :'
                        : operation.lastError?.code === "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT"
                        ? 'Arrondissements en conflit :'
                        : operation.lastError?.code === "PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT"
                        ? 'Département parent en conflit :'
                        : 'Région parente en conflit :'}
                    </div>
                    <div className="space-y-1">
                      {hierarchicalConflict.conflictingChildren.map((child, childIndex) => (
                        <div key={childIndex} className="bg-white rounded p-1 border">
                          <div className="font-medium text-red-700 text-xs">
                            {child.locationName} ({child.locationCode})
                          </div>
                          <div className="text-red-600 text-xs">
                            → déjà dans : {child.basinName}
                          </div>
                        </div>
                      ))}
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
          <GitBranch className="h-4 w-4 text-red-500" />
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
              Conflits hiérarchiques détectés :
            </div>
            <div className="space-y-3">
              {allConflicts.map((hierarchicalConflict, index) => (
                <div
                  key={index}
                  className="bg-white border border-red-200 rounded p-2"
                >
                  <div className="mb-2">
                    <div className="text-xs font-medium text-red-700">
                      Tentative d&apos;ajout de :
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {hierarchicalConflict.parentLocationName} ({hierarchicalConflict.parentLocationCode})
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-red-700 mb-1">
                      {operation.lastError?.code === "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT"
                        ? 'Départements en conflit :'
                        : operation.lastError?.code === "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT"
                        ? 'Arrondissements en conflit :'
                        : operation.lastError?.code === "PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT"
                        ? 'Département parent en conflit :'
                        : 'Région parente en conflit :'}
                    </div>
                    <div className="space-y-1">
                      {hierarchicalConflict.conflictingChildren.map((child, childIndex) => (
                        <div key={childIndex} className="bg-red-50 rounded p-2">
                          <div className="text-xs font-medium text-red-700">
                            {child.locationName} ({child.locationCode})
                          </div>
                          <div className="text-xs text-red-600">
                            → déjà dans : {child.basinName}
                          </div>
                        </div>
                      ))}
                    </div>
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