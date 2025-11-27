"use client";

import { FormSelect } from "@/components/forms";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LocationWithSync } from "../../../domain/location.types";
import { useLocationStore } from "../../../infrastructure/store/locationStore";
import { HierarchyDisplay } from "../HierarchyDisplay";

interface LocationMultiSelectorFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LocationMultiSelectorForm<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  disabled = false,
  className = "",
}: LocationMultiSelectorFormProps<T>) {
  const { t } = useTranslation("location");

  const {
    isLoading,
    isOnline,
    error: storeError,
    clearError,
  } = useLocationStore();

  const defaultLabel = label || t("form.locationsLabel");

  const [regions, setRegions] = useState<LocationWithSync[]>([]);
  const [departments, setDepartments] = useState<LocationWithSync[]>([]);
  const [districts, setDistricts] = useState<LocationWithSync[]>(
    []
  );

  // Options pour les FormSelect
  const regionOptions = regions.map((region) => ({
    value: region.code,
    label: region.name,
  }));

  const departmentOptions = departments.map((department) => ({
    value: department.code,
    label: department.name,
  }));

  const districtOptions = districts.map((district) => ({
    value: district.code,
    label: district.name,
  }));

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] =
    useState<string>("");

  const [currentSelections, setCurrentSelections] = useState<string[]>([]);

  // Charger les régions au montage
  useEffect(() => {
    const loadRegions = async () => {
      try {
        clearError();
        const store = useLocationStore.getState();
        await store.fetchLocations({ type: "region" });

        // Récupérer les régions depuis le store
        const locations = useLocationStore.getState().locations;
        setRegions(locations);
      } catch (error) {
        console.error("Erreur lors du chargement des régions:", error);
      }
    };

    loadRegions();
  }, [clearError]);

  // Charger les départements quand une région est sélectionnée
  useEffect(() => {
    if (selectedRegion) {
      const loadDepartments = async () => {
        try {
          clearError();
          const store = useLocationStore.getState();
          await store.fetchLocations({
            type: "department",
            parentCode: selectedRegion,
          });

          const locations = useLocationStore.getState().locations;
          setDepartments(locations);
        } catch (error) {
          console.error("Erreur lors du chargement des départements:", error);
        }
      };

      loadDepartments();
    } else {
      setDepartments([]);
      setSelectedDepartment("");
    }
  }, [selectedRegion, clearError]);

  // Charger les districts quand un département est sélectionné
  useEffect(() => {
    if (selectedDepartment) {
      const loadDistricts = async () => {
        try {
          clearError();
          const store = useLocationStore.getState();
          await store.fetchLocations({
            type: "district",
            parentCode: selectedDepartment,
          });

          const locations = useLocationStore.getState().locations;
          setDistricts(locations);
        } catch (error) {
          console.error(
            "Erreur lors du chargement des districts:",
            error
          );
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedDepartment, clearError]);

  // Initialiser et synchroniser avec la valeur du formulaire
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      // Surveiller uniquement le champ spécifié (ex: locationCodes)
      if (fieldName === name) {
        const fieldValue = value[name];
        if (fieldValue) {
          const valueArray = Array.isArray(fieldValue) ? fieldValue : [];
          setCurrentSelections([...valueArray]);
        } else {
          setCurrentSelections([]);
        }
      }
    });

    // Initialisation initiale
    const initialValue = form.getValues(name);
    if (initialValue) {
      const valueArray = Array.isArray(initialValue) ? initialValue : [];
      setCurrentSelections([...valueArray]);
    }

    return () => subscription.unsubscribe();
  }, [form, name]);

  // Surveiller les changements de tous les FormSelect
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      // Surveiller la région
      if (fieldName === "regionSelector") {
        const regionCode = value.regionSelector;
        if (regionCode && regionCode !== selectedRegion) {
          handleRegionChange(regionCode);
        }
      }

      // Surveiller le département
      if (fieldName === "departmentSelector") {
        const departmentCode = value.departmentSelector;
        if (departmentCode && departmentCode !== selectedDepartment) {
          handleDepartmentChange(departmentCode);
        }
      }

      // Surveiller le district
      if (fieldName === "districtSelector") {
        const districtCode = value.districtSelector;
        if (
          districtCode &&
          districtCode !== selectedDistrict
        ) {
          handleDistrictChange(districtCode);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, selectedRegion, selectedDepartment, selectedDistrict]);

  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
    setSelectedDepartment("");
    setSelectedDistrict("");
  };

  const handleDepartmentChange = (departmentCode: string) => {
    setSelectedDepartment(departmentCode);
    setSelectedDistrict("");
  };

  const handleDistrictChange = (districtCode: string) => {
    setSelectedDistrict(districtCode);
  };

  const addSelection = (code: string) => {
    const updatedSelections = [...currentSelections];
    let selectionAdded = false;
    const newType = getLocationType(code);

    // Cas spécial: Si on sélectionne une région, supprimer tous ses enfants existants
    if (newType === "region") {
      // Trouver tous les départements et districts de cette région
      const childrenToRemove: string[] = [];

      updatedSelections.forEach((existingCode) => {
        if (isChildOfRegion(existingCode, code)) {
          childrenToRemove.push(existingCode);
        }
      });

      // Supprimer tous les enfants trouvés
      childrenToRemove.forEach((childCode) => {
        const index = updatedSelections.indexOf(childCode);
        if (index > -1) {
          updatedSelections.splice(index, 1);
        }
      });

      // Ajouter la région si elle n'existe pas déjà
      if (!updatedSelections.includes(code)) {
        updatedSelections.push(code);
      }

      setCurrentSelections(updatedSelections);
      form.setValue(name, updatedSelections as T[Path<T>]);
      return;
    }

    // Cas spécial: Si on sélectionne un département, supprimer tous ses districts existants
    if (newType === "department") {
      // Trouver tous les districts de ce département
      const childrenToRemove: string[] = [];

      updatedSelections.forEach((existingCode) => {
        if (isChildOfDepartment(existingCode, code)) {
          childrenToRemove.push(existingCode);
        }
      });

      // Supprimer tous les districts trouvés
      childrenToRemove.forEach((childCode) => {
        const index = updatedSelections.indexOf(childCode);
        if (index > -1) {
          updatedSelections.splice(index, 1);
        }
      });
    }

    // Logique de fusion intelligente pour les autres cas
    for (let i = 0; i < updatedSelections.length; i++) {
      const existingCode = updatedSelections[i];
      const existingType = getLocationType(existingCode);

      // Cas 1: Fusion ascendante - Ajouter un niveau plus spécifique du MÊME territoire
      if (shouldMergeAscending(code, existingCode, newType, existingType)) {
        // Remplacer le niveau moins spécifique par le plus spécifique
        updatedSelections[i] = code;
        selectionAdded = true;
        break;
      }

      // Cas 2: Fusion descendante - Ajouter un niveau moins spécifique qui englobe un territoire existant
      if (shouldMergeDescending(code, existingCode, newType, existingType)) {
        // Remplacer le niveau plus spécifique par le moins spécifique
        updatedSelections[i] = code;
        selectionAdded = true;
        break;
      }

      // Cas 3: Prévenir les doublons exacts
      if (existingCode === code) {
        // Doublon exact détecté, ne pas ajouter
        selectionAdded = true;
        break;
      }
    }

    // Si aucune fusion n'a eu lieu, ajouter comme nouvelle sélection
    // Cela permet d'avoir plusieurs départements de la même région
    // ou plusieurs districts du même département
    if (!selectionAdded) {
      updatedSelections.push(code);
    }

    setCurrentSelections(updatedSelections);
    form.setValue(name, updatedSelections as T[Path<T>]);
  };

  const shouldMergeAscending = (
    newCode: string,
    existingCode: string,
    newType: "region" | "department" | "district",
    existingType: "region" | "department" | "district"
  ): boolean => {
    // Département remplace région SEULEMENT si c'est le même territoire
    if (newType === "department" && existingType === "region") {
      return isChildOfRegion(newCode, existingCode);
    }

    // District remplace département SEULEMENT si c'est le même territoire
    if (newType === "district" && existingType === "department") {
      return isChildOfDepartment(newCode, existingCode);
    }

    // District remplace région SEULEMENT si c'est le même territoire
    if (newType === "district" && existingType === "region") {
      return isChildOfRegion(newCode, existingCode);
    }

    return false;
  };

  const shouldMergeDescending = (
    newCode: string,
    existingCode: string,
    newType: "region" | "department" | "district",
    existingType: "region" | "department" | "district"
  ): boolean => {
    // Région remplace département/district SEULEMENT si elle les englobe
    if (
      newType === "region" &&
      (existingType === "department" || existingType === "district")
    ) {
      return isChildOfRegion(existingCode, newCode);
    }

    // Département remplace district SEULEMENT s'il l'englobe
    if (newType === "department" && existingType === "district") {
      return isChildOfDepartment(existingCode, newCode);
    }

    return false;
  };

  const isChildOfRegion = (childCode: string, regionCode: string): boolean => {
    // Vérifier si le code enfant appartient à la région
    const childLocation = [...departments, ...districts].find(
      (loc) => loc.code === childCode
    );
    const region = regions.find((r) => r.code === regionCode);

    if (!childLocation || !region) return false;

    // Pour un département, vérifier le parentCode direct
    if (departments.some((d) => d.code === childCode)) {
      return childLocation.parentCode === regionCode;
    }

    // Pour un district, vérifier via le département parent
    if (districts.some((a) => a.code === childCode)) {
      const parentDepartment = departments.find(
        (d) => d.code === childLocation.parentCode
      );
      return parentDepartment?.parentCode === regionCode;
    }

    return false;
  };

  const isChildOfDepartment = (
    childCode: string,
    departmentCode: string
  ): boolean => {
    // Vérifier si le district appartient au département
    const district = districts.find((a) => a.code === childCode);
    return district?.parentCode === departmentCode;
  };

  const removeSelection = (code: string) => {
    const newSelections = currentSelections.filter((sel) => sel !== code);
    setCurrentSelections(newSelections);
    form.setValue(name, newSelections as T[Path<T>]);
  };

  const handleAddRegion = () => {
    if (selectedRegion) {
      addSelection(selectedRegion);
      // Reset selections après ajout
      setSelectedRegion("");
      setSelectedDepartment("");
      setSelectedDistrict("");
      // Reset des valeurs du formulaire
      form.setValue("regionSelector" as Path<T>, "" as T[Path<T>]);
      form.setValue("departmentSelector" as Path<T>, "" as T[Path<T>]);
      form.setValue("districtSelector" as Path<T>, "" as T[Path<T>]);
    }
  };

  const handleAddDepartment = () => {
    if (selectedDepartment) {
      addSelection(selectedDepartment);
      // Reset selections après ajout
      setSelectedRegion("");
      setSelectedDepartment("");
      setSelectedDistrict("");
      // Reset des valeurs du formulaire
      form.setValue("regionSelector" as Path<T>, "" as T[Path<T>]);
      form.setValue("departmentSelector" as Path<T>, "" as T[Path<T>]);
      form.setValue("districtSelector" as Path<T>, "" as T[Path<T>]);
    }
  };

  const handleAddDistrict = () => {
    if (selectedDistrict) {
      addSelection(selectedDistrict);
      // Reset selections après ajout
      setSelectedRegion("");
      setSelectedDepartment("");
      setSelectedDistrict("");
      // Reset des valeurs du formulaire
      form.setValue("regionSelector" as Path<T>, "" as T[Path<T>]);
      form.setValue("departmentSelector" as Path<T>, "" as T[Path<T>]);
      form.setValue("districtSelector" as Path<T>, "" as T[Path<T>]);
    }
  };

  const getLocationType = (
    code: string
  ): "region" | "department" | "district" => {
    if (regions.some((r) => r.code === code)) return "region";
    if (departments.some((d) => d.code === code)) return "department";
    return "district";
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Separator />
      <div>
        <Label className="mb-2">
          {defaultLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>

      <div className="space-y-4">
        {/* Sélecteurs en cascade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Région */}
          <FormSelect
            form={form}
            name={`regionSelector` as Path<T>}
            label={t("form.regionLabel")}
            placeholder={t("form.selectRegion")}
            options={regionOptions}
            disabled={disabled || isLoading}
            emptyMessage={t("empty.noRegions")}
          />

          {/* Département */}
          <FormSelect
            form={form}
            name={`departmentSelector` as Path<T>}
            label={t("form.departmentLabel")}
            placeholder={t("form.selectDepartment")}
            options={departmentOptions}
            disabled={disabled || isLoading || !selectedRegion}
            emptyMessage={t("empty.noDepartments")}
          />

          {/* District */}
          <FormSelect
            form={form}
            name={`districtSelector` as Path<T>}
            label={t("form.districtLabel")}
            placeholder={t("form.selectDistrict")}
            options={districtOptions}
            disabled={disabled || isLoading || !selectedDepartment}
            emptyMessage={t("empty.noDistricts")}
          />
        </div>

        {/* Boutons d'ajout */}
        <div className="flex flex-wrap gap-2">
          {selectedRegion && (
            <button
              type="button"
              onClick={handleAddRegion}
              disabled={disabled || isLoading}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 text-sm"
            >
              {t("actions.addRegion")}
            </button>
          )}

          {selectedDepartment && (
            <button
              type="button"
              onClick={handleAddDepartment}
              disabled={disabled || isLoading}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 text-sm"
            >
              {t("actions.addDepartment")}
            </button>
          )}

          {selectedDistrict && (
            <button
              type="button"
              onClick={handleAddDistrict}
              disabled={disabled || isLoading}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 text-sm"
            >
              {t("actions.addDistrict")}
            </button>
          )}
        </div>

        {/* Liste des sélections actuelles */}
        {currentSelections.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {t("selector.selectedLocations")}
            </h4>
            <div className="space-y-1">
              {currentSelections.map((code, index) => {
                return (
                  <div
                    key={code}
                    className={`flex items-center justify-between p-2  border-b`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <HierarchyDisplay code={code} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelection(code)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Affichage des erreurs */}
        {storeError && (
          <div className="text-red-500 text-sm">
            {storeError}
          </div>
        )}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="text-primary text-sm">{t("selector.loading")}</div>
        )}

        {/* Indicateur hors ligne */}
        {!isOnline && (
          <div className="text-orange-500 text-sm">
            {t("selector.offlineMode")}
          </div>
        )}
      </div>
    </div>
  );
}
