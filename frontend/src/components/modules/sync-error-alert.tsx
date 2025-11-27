"use client";

import { Icon } from "@/components/icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOutboxErrorTranslation } from "@/features/outbox/presentation/hooks/useOutboxErrorTranslation";
import { useEntityError } from "@/hooks/useEntityError";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SyncErrorAlertProps {
  entityId: string;
  entityType: string;
  step?: string;
}

/**
 * Composant d'alerte pour afficher les erreurs de synchronisation
 * Réutilisable pour toutes les entités (user, campaign, productionBasin, store, etc.)
 * Gère l'affichage spécial des conflits pour les bassins de production
 */
export function SyncErrorAlert({
  entityId,
  entityType,
  step,
}: SyncErrorAlertProps) {
  const { t } = useTranslation("common");
  const { t: tBasin } = useTranslation("productionBasin");
  const { t: tActor } = useTranslation("actor");
  const { translateError } = useOutboxErrorTranslation();
  const { error, hasError } = useEntityError(entityId, entityType);
  const [showConflicts, setShowConflicts] = useState(false);

  if (!hasError || !error) {
    return null;
  }

  // Cas spécial : conflits de localisation pour bassins de production
  const hasLocationConflicts =
    entityType === "productionBasin" &&
    error.code === "PRODUCTION_BASIN_LOCATION_CONFLICTS" &&
    error.conflicts &&
    error.conflicts.length > 0;

  // Cas spécial : conflits hiérarchiques pour bassins de production
  const hasHierarchicalConflicts =
    entityType === "productionBasin" &&
    (error.code === "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT" ||
      error.code ===
        "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT") &&
    ((error.regionConflicts && error.regionConflicts.length > 0) ||
      (error.departmentConflicts && error.departmentConflicts.length > 0));

  // Cas spécial : identifiants de parcelles dupliqués
  const hasParcelDuplicates =
    entityType === "actor" &&
    step === "2" &&
    error.code === "PARCEL_DUPLICATE_IDENTIFIERS" &&
    error.parcelErrors &&
    error.parcelErrors.length > 0;

  if (hasLocationConflicts) {
    const conflictCount = error.conflicts!.length;
    const conflictLabel = tBasin("syncErrors.locationConflicts.count", { count: conflictCount });

    return (
      <Alert variant="destructive" className="mb-4">
        <Icon name="AlertTriangle" className="h-4 w-4" />
        <AlertTitle>{tBasin("syncErrors.locationConflicts.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{translateError(error.code, error.message)}</p>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-destructive border-destructive"
            >
              <Icon name="MapPin" className="h-3 w-3 mr-1" />
              {conflictLabel}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConflicts(!showConflicts)}
              className="h-6 px-2 text-destructive hover:text-destructive"
            >
              {showConflicts ? (
                <>
                  <Icon name="ChevronDown" className="h-3 w-3 mr-1" />
                  {t("syncErrorAlert.hide")}
                </>
              ) : (
                <>
                  <Icon name="ChevronRight" className="h-3 w-3 mr-1" />
                  {t("syncErrorAlert.showDetails")}
                </>
              )}
            </Button>
          </div>

          {showConflicts && (
            <div className="w-full py-2">
              <ul className="space-y-3">
                {error.conflicts!.map((conflict, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-destructive rounded-full mt-1.5 flex-shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {conflict.locationName} ({conflict.locationCode}) :{" "}
                            {conflict.basinName}
                          </p>
                        </div>
                        <Link
                          href={`/production-basin/edit?entityId=${conflict.basinId}`}
                        >
                          <Button
                            size="sm"
                            variant="link"
                            className="text-xs flex-shrink-0"
                          >
                            {tBasin("syncErrors.locationConflicts.modifyBasin")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Cas spécial : identifiants de parcelles dupliqués
  if (hasParcelDuplicates) {
    // Grouper les erreurs par numéro de parcelle
    const errorsByParcel = error.parcelErrors!.reduce((acc, err) => {
      const key = err.parcelNumber;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(err);
      return acc;
    }, {} as Record<number, Array<{ index: number; parcelNumber: number; field: string; value: string; message: string }>>);

    const parcelCount = Object.keys(errorsByParcel).length;
    const errorCount = error.parcelErrors!.length;
    const parcelLabel = tActor("syncErrors.parcelDuplicates.parcelCount", { count: parcelCount });
    const errorCountLabel = tActor("syncErrors.parcelDuplicates.errorCount", { count: errorCount });
    const errorLabel = tActor("syncErrors.parcelDuplicates.withErrors", { parcels: parcelLabel, errors: errorCountLabel });

    return (
      <Alert variant="destructive" className="mb-4">
        <Icon name="AlertTriangle" className="h-4 w-4" />
        <AlertTitle>{tActor("syncErrors.parcelDuplicates.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message}</p>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-destructive border-destructive"
            >
              <Icon name="Copy" className="h-3 w-3 mr-1" />
              {errorLabel}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConflicts(!showConflicts)}
              className="h-6 px-2 text-destructive hover:text-destructive"
            >
              {showConflicts ? (
                <>
                  <Icon name="ChevronDown" className="h-3 w-3 mr-1" />
                  {t("syncErrorAlert.hide")}
                </>
              ) : (
                <>
                  <Icon name="ChevronRight" className="h-3 w-3 mr-1" />
                  {t("syncErrorAlert.showDetails")}
                </>
              )}
            </Button>
          </div>

          {showConflicts && (
            <div className="w-full py-2">
              <ul className="space-y-4">
                {Object.entries(errorsByParcel).map(
                  ([parcelNumber, errors], index) => (
                    <li
                      key={parcelNumber}
                      className={cn(
                        "py-3",
                        index > 0 && "border-t border-t-destructive/20"
                      )}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <Icon
                          name="MapPin"
                          className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {tActor("syncErrors.parcelDuplicates.parcel")} {parcelNumber}{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              ({tActor("syncErrors.parcelDuplicates.errorCount", { count: errors.length })})
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="ml-6 space-y-2">
                        <ul className="space-y-2">
                          {errors.map((err, errIndex) => (
                            <li
                              key={errIndex}
                              className="flex items-start gap-2 rounded py-1"
                            >
                              <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full mt-1.5 flex-shrink-0"></span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs">
                                  <span className="font-medium capitalize">
                                    {err.field === "onccId" || err.field === "identificationId"
                                      ? tActor(`syncErrors.parcelDuplicates.fields.${err.field}`)
                                      : err.field}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" : "}
                                  </span>
                                  <span className="font-semibold text-destructive">
                                    {err.value}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {err.message}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Cas spécial : conflits hiérarchiques pour bassins de production
  if (hasHierarchicalConflicts) {
    const allConflicts = [
      ...(error.regionConflicts || []),
      ...(error.departmentConflicts || []),
    ];
    const conflictCount = allConflicts.length;
    const conflictType =
      error.code === "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT"
        ? tBasin("syncErrors.hierarchicalConflicts.regionDepartment")
        : tBasin("syncErrors.hierarchicalConflicts.departmentDistrict");
    const conflictLabel = tBasin("syncErrors.hierarchicalConflicts.count", { count: conflictCount, type: conflictType });

    return (
      <Alert variant="destructive" className="mb-4">
        <Icon name="AlertTriangle" className="h-4 w-4" />
        <AlertTitle>{tBasin("syncErrors.hierarchicalConflicts.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{translateError(error.code, error.message)}</p>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-destructive border-destructive"
            >
              <Icon name="GitBranch" className="h-3 w-3 mr-1" />
              {conflictLabel}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConflicts(!showConflicts)}
              className="h-6 px-2 text-destructive hover:text-destructive"
            >
              {showConflicts ? (
                <>
                  <Icon name="ChevronDown" className="h-3 w-3 mr-1" />
                  {t("syncErrorAlert.hide")}
                </>
              ) : (
                <>
                  <Icon name="ChevronRight" className="h-3 w-3 mr-1" />
                  {t("syncErrorAlert.showDetails")}
                </>
              )}
            </Button>
          </div>

          {showConflicts && (
            <div className="w-full py-2">
              <ul className="space-y-4">
                {allConflicts.map((hierarchicalConflict, index) => (
                  <li
                    key={index}
                    className={cn(
                      "py-3",
                      index > 0 && "border-t border-t-destructive/20"
                    )}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <Icon
                        name="GitBranch"
                        className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {tBasin("syncErrors.hierarchicalConflicts.attemptToAdd")}{" "}
                          <span className="text-destructive">
                            {hierarchicalConflict.parentLocationName} (
                            {hierarchicalConflict.parentLocationCode})
                          </span>{" "}
                          {" : "}
                          <span className="text-xs text-muted-foreground capitalize">
                            {hierarchicalConflict.parentType}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="ml-6 space-y-2">
                      <p className="text-xs font-medium">
                        {error.code ===
                        "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT"
                          ? tBasin("syncErrors.hierarchicalConflicts.departmentsInConflict")
                          : tBasin("syncErrors.hierarchicalConflicts.districtsInConflict")}
                      </p>
                      <ul className="space-y-2">
                        {hierarchicalConflict.conflictingChildren.map(
                          (child, childIndex) => (
                            <li
                              key={childIndex}
                              className="flex items-center justify-between gap-2 rounded py-0.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs">
                                  <span className="font-medium">
                                    {child.locationName} ({child.locationCode})
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    → {tBasin("syncErrors.hierarchicalConflicts.alreadyIn")}{" "}
                                    <span className="font-semibold">
                                      {child.basinName}
                                    </span>
                                  </span>
                                </p>
                              </div>
                              <Link
                                href={`/production-basin/edit?entityId=${child.basinId}`}
                              >
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="text-xs flex-shrink-0"
                                >
                                  {tBasin("syncErrors.hierarchicalConflicts.modifyBasin")}
                                </Button>
                              </Link>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Affichage standard pour les autres erreurs
  // Traduire le message d'erreur basé sur le code
  const fallbackMessage = t("syncErrorAlert.fallbackMessage");
  const displayMessage = error.code
    ? translateError(error.code, error.message)
    : error.message || fallbackMessage;

  return (
    <Alert variant="destructive" className="mb-4">
      <Icon name="AlertTriangle" className="h-4 w-4" />
      <AlertTitle>{t("syncErrorAlert.title")}</AlertTitle>
      <AlertDescription>{displayMessage}</AlertDescription>
    </Alert>
  );
}
