"use client";

import { InputSelect } from "@/components/ui/input-select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LocationWithSync } from "../../../domain/location.types";
import { useLocationStore } from "../../../infrastructure/store/locationStore";
import { useLocationHierarchy } from "../../hooks/useLocationHierarchy";

interface LocationSelectorFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  level?: "region" | "department" | "district";
  isEditMode?: boolean;
  onlyInProductionBasin?: boolean; // Ne montrer que les localisations dans un bassin de production
  productionBasinId?: string; // Ne montrer que les localisations d'un bassin spécifique
  showHeader?: boolean;
}

export function LocationSelectorForm<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  disabled = false,
  className = "",
  level = "district",
  isEditMode = false,
  onlyInProductionBasin = false,
  productionBasinId,
  showHeader = true,
}: LocationSelectorFormProps<T>) {
  const { t } = useTranslation("location");

  // --- ÉTAT POUR LES LISTES D'OPTIONS ---
  const [regions, setRegions] = useState<LocationWithSync[]>([]);
  const [departments, setDepartments] = useState<LocationWithSync[]>([]);
  const [districts, setDistricts] = useState<LocationWithSync[]>([]);
  const { isLoading, clearError } = useLocationStore();

  const defaultLabel = label || t("form.locationLabel");

  const isInitializing = useRef(isEditMode);

  // --- ÉTAT POUR LA VALIDATION CUSTOM ---
  const [validationErrors, setValidationErrors] = useState({
    regionError: false,
    departmentError: false,
    districtError: false,
  });

  // --- ÉTAT LOCAL POUR LES SÉLECTIONS ---
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // --- OBSERVATION DES VALEURS DU FORMULAIRE (Source de vérité) ---
  const { path } = useLocationHierarchy(form.getValues(name));

  const regionOptions = regions.map((r) => ({ value: r.code, label: r.name }));
  const departmentOptions = departments.map((d) => ({
    value: d.code,
    label: d.name,
  }));
  const districtOptions = districts.map((a) => ({
    value: a.code,
    label: a.name,
  }));

  // --- FONCTIONS DE VALIDATION ---
  const validateField = useCallback(
    (value: string, fieldType: "region" | "department" | "district") => {
      if (!required) return false;

      switch (fieldType) {
        case "region":
          return !value;
        case "department":
          return level !== "region" && !value;
        case "district":
          return level === "district" && !value;
        default:
          return false;
      }
    },
    [required, level]
  );

  // Fonction pour valider tous les champs lors de la soumission
  const validateAllFields = useCallback(() => {
    const regionError = validateField(selectedRegion, "region");
    const departmentError = validateField(selectedDepartment, "department");
    const districtError = validateField(selectedDistrict, "district");

    setValidationErrors({
      regionError,
      departmentError,
      districtError,
    });

    return regionError || departmentError || districtError;
  }, [selectedRegion, selectedDepartment, selectedDistrict, validateField]);

  // Fonction pour filtrer les localisations selon les bassins de production
  const filterLocationsByBasin = useCallback(
    (locations: LocationWithSync[]): LocationWithSync[] => {
      if (!onlyInProductionBasin && !productionBasinId) {
        return locations;
      }

      return locations.filter((location) => {
        // Si on veut seulement les localisations dans un bassin
        if (onlyInProductionBasin && !productionBasinId) {
          return location.isInProductionBasin === true;
        }

        // Si on veut les localisations d'un bassin spécifique
        if (productionBasinId) {
          return location.productionBasinIds?.includes(productionBasinId) || false;
        }

        return true;
      });
    },
    [onlyInProductionBasin, productionBasinId]
  );

  const fetchRegions = useCallback(async () => {
    try {
      clearError();
      const store = useLocationStore.getState();
      await store.fetchLocations({ type: "region" });

      const locations = useLocationStore.getState().locations;
      // Filtrer les localisations selon les bassins de production
      const filteredLocations = filterLocationsByBasin(locations);
      setRegions(filteredLocations);
      const currentData = form.getValues(name);
      if (currentData) {
        isInitializing.current = true;
      }
    } catch (error) {
      console.error("Erreur chargement régions:", error);
    }
  }, [clearError, form, name, filterLocationsByBasin]);

  const fetchDepartments = useCallback(
    async (regionCode: string) => {
      if (!regionCode) {
        setDepartments([]);
        return;
      }
      try {
        const store = useLocationStore.getState();
        await store.fetchLocations({
          type: "department",
          parentCode: regionCode,
        });

        const locations = useLocationStore.getState().locations;
        // Filtrer les localisations selon les bassins de production
        const filteredLocations = filterLocationsByBasin(locations);
        setDepartments(filteredLocations);
      } catch (error) {
        console.error("Erreur chargement départements:", error);
        setDepartments([]);
      }
    },
    [filterLocationsByBasin]
  );

  const fetchDistricts = useCallback(
    async (departmentCode: string) => {
      if (!departmentCode) {
        setDistricts([]);
        return;
      }
      try {
        const store = useLocationStore.getState();
        await store.fetchLocations({
          type: "district",
          parentCode: departmentCode,
        });

        const locations = useLocationStore.getState().locations;
        // Filtrer les localisations selon les bassins de production
        const filteredLocations = filterLocationsByBasin(locations);
        setDistricts(filteredLocations);
      } catch (error) {
        console.error("Erreur chargement districts:", error);
        setDistricts([]);
      }
    },
    [filterLocationsByBasin]
  );

  // --- HANDLERS AVEC VALIDATION ---
  const handleRegionChange = useCallback(
    (value: string) => {
      setSelectedRegion(value);

      // Validation de la région
      setValidationErrors((prev) => ({
        ...prev,
        regionError: validateField(value, "region"),
      }));

      // Réinitialiser les champs suivants
      setSelectedDepartment("");
      setSelectedDistrict("");
      setValidationErrors((prev) => ({
        ...prev,
        departmentError: false,
        districtError: false,
      }));

      // Charger les départements
      fetchDepartments(value);
    },
    [validateField, fetchDepartments]
  );

  const handleDepartmentChange = useCallback(
    (value: string) => {
      setSelectedDepartment(value);

      // Validation du département
      setValidationErrors((prev) => ({
        ...prev,
        departmentError: validateField(value, "department"),
      }));

      // Réinitialiser le district
      setSelectedDistrict("");
      setValidationErrors((prev) => ({
        ...prev,
        districtError: false,
      }));

      // Charger les districts
      fetchDistricts(value);
    },
    [validateField, fetchDistricts]
  );

  const handleDistrictChange = useCallback(
    (value: string) => {
      setSelectedDistrict(value);

      // Validation du district
      setValidationErrors((prev) => ({
        ...prev,
        districtError: validateField(value, "district"),
      }));
    },
    [validateField]
  );

  useEffect(() => {
    if (!isEditMode || !isInitializing.current) return;

    if (path && path.length > 0 && regions.length > 0) {
      const initializeSelections = async () => {
        const regionCode = path?.[0]?.code;
        const departmentCode = path?.[1]?.code;
        const districtCode = path?.[2]?.code;

        // Initialiser la région et charger les départements
        if (regionCode) {
          setSelectedRegion(regionCode);
          await fetchDepartments(regionCode);
        }

        // Attendre que les départements soient chargés puis initialiser le département
        if (departmentCode && level !== "region") {
          // Petit délai pour s'assurer que les départements sont dans le state
          setTimeout(async () => {
            setSelectedDepartment(departmentCode);

            if (level === "district") {
              await fetchDistricts(departmentCode);

              // Attendre que les districts soient chargés puis initialiser
              if (districtCode) {
                setTimeout(() => {
                  setSelectedDistrict(districtCode);
                }, 100);
              }
            }
          }, 100);
        }

        // L'initialisation est terminée
        setTimeout(() => {
          isInitializing.current = false;
        }, 500);
      };

      initializeSelections();
    }
  }, [path, regions, isEditMode, level, fetchDistricts, fetchDepartments]);

  // --- 1. CHARGEMENT INITIAL DES RÉGIONS ---
  // Recharger aussi lorsque les filtres de bassin changent
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions, clearError, onlyInProductionBasin, productionBasinId]);

  // --- 4. MISE À JOUR DU CHAMP PRINCIPAL (locationCode) ---
  useEffect(() => {
    let finalValue = "";
    if (level === "region") finalValue = selectedRegion;
    else if (level === "department") finalValue = selectedDepartment;
    else if (level === "district") finalValue = selectedDistrict;

    if (
      finalValue !== undefined &&
      form.getValues(name) !== finalValue &&
      !isInitializing.current
    ) {
      form.setValue(name, finalValue as T[Path<T>], { shouldValidate: true });
    }
  }, [selectedRegion, selectedDepartment, selectedDistrict, level, form, name]);

  // --- 5. VALIDATION LORS DES ERREURS DE FORMULAIRE ---
  useEffect(() => {
    // Déclencher la validation si il y a des erreurs sur ce champ
    if (form.formState.errors[name] && required) {
      validateAllFields();
    }
  }, [form.formState.errors, name, required, validateAllFields]);

  // --- 6. VALIDATION LORS DE LA SOUMISSION ---
  useEffect(() => {
    // Déclencher la validation automatiquement lors de la soumission du formulaire
    if (form.formState.isSubmitted && required) {
      validateAllFields();
    }
  }, [form.formState.isSubmitted, required, validateAllFields]);

  return (
    <div className={cn("space-y-8", className)}>
      {showHeader && (
        <div className="">
          {defaultLabel && <Label className="text-lg mb-2">{defaultLabel}</Label>}
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
          {required && form.formState.errors[name] && (
            <p className="text-destructive text-sm mt-1">
              {String(form.formState.errors[name]?.message)}
            </p>
          )}
        </div>
      )}

      {/* Sélection de la région */}
      <div className="grid gap-1">
        <Label
          className={cn(
            "mb-2",
            validationErrors.regionError ? "text-red-500" : "text-gray-900",
            required && "after:content-['*'] after:text-red-500 after:ml-0.5"
          )}
        >
          {t("form.regionLabel")}
        </Label>
        <InputSelect
          value={selectedRegion}
          onValueChange={handleRegionChange}
          options={regionOptions}
          placeholder=""
          disabled={disabled || isLoading}
          emptyMessage={t("empty.noRegions")}
          hasError={validationErrors.regionError}
        />
        {required && validationErrors.regionError && (
          <p className="text-destructive text-sm mt-1">{t("validation.regionRequired")}</p>
        )}
      </div>

      {/* Sélection du département */}
      {level !== "region" && (
        <div className="grid gap-1">
          <Label
            className={cn(
              "mb-2",
              validationErrors.departmentError
                ? "text-red-500"
                : "text-gray-900",
              required && "after:content-['*'] after:text-red-500 after:ml-0.5"
            )}
          >
            {t("form.departmentLabel")}
          </Label>
          <InputSelect
            value={selectedDepartment}
            onValueChange={handleDepartmentChange}
            options={departmentOptions}
            placeholder=""
            disabled={disabled || isLoading || !selectedRegion}
            emptyMessage={t("empty.noDepartments")}
            hasError={validationErrors.departmentError}
          />
          {required && validationErrors.departmentError && (
            <p className="text-destructive text-sm mt-1">
              {t("validation.departmentRequired")}
            </p>
          )}
        </div>
      )}

      {/* Sélection du district */}
      {level === "district" && (
        <div className="grid gap-1">
          <Label
            className={cn(
              "mb-2",
              validationErrors.districtError ? "text-red-500" : "text-gray-900",
              required && "after:content-['*'] after:text-red-500 after:ml-0.5"
            )}
          >
            {t("form.districtLabel")}
          </Label>
          <InputSelect
            value={selectedDistrict}
            onValueChange={handleDistrictChange}
            options={districtOptions}
            placeholder=""
            disabled={disabled || isLoading || !selectedDepartment}
            emptyMessage={t("empty.noDistricts")}
            hasError={validationErrors.districtError}
          />
          {required && validationErrors.districtError && (
            <p className="text-destructive text-sm mt-1">
              {t("validation.districtRequired")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
