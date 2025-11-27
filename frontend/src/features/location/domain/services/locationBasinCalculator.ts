import type { LocationResponse } from "../location.types";

/**
 * Service de calcul de propagation des bassins de production avec support multi-bassins
 *
 * Logique de propagation BIDIRECTIONNELLE (UNION) :
 * - Associations directes : Une localisation ne peut être directement dans qu'UN SEUL bassin (validé côté backend)
 * - Propagation DESCENDANTE : Les enfants héritent des bassins de leurs parents
 * - Propagation ASCENDANTE : Les parents collectent l'UNION de TOUS les bassins de leurs enfants
 *
 * Règles de propagation :
 * 1. RÉGION → Propage à tous ses départements + tous les districts de ces départements
 * 2. DÉPARTEMENT → Propage à sa région parente + tous ses districts
 * 3. DISTRICT → Propage à son département parent + la région de ce département
 *
 * Exemples :
 * - Région ADAMAOUA dans bassin_nord:
 *   → Tous ses départements (VINA, FARO, etc.) sont dans bassin_nord
 *   → Tous les districts de ces départements sont dans bassin_nord
 *
 * - Département VINA dans bassin_centre:
 *   → Sa région parente ADAMAOUA hérite bassin_centre
 *   → Tous ses districts (BELEL, NGANHA, etc.) sont dans bassin_centre
 *
 * - District BELEL dans bassin_sud:
 *   → Son département parent VINA hérite bassin_sud
 *   → Sa région ADAMAOUA hérite bassin_sud
 *
 * Note : Utilisation de Set<string> garantit l'absence de doublons dans productionBasinIds
 */
export class LocationBasinCalculator {
  /**
   * Calcule la propagation des bassins pour toutes les localisations
   * @param locations Liste des localisations avec leurs associations directes
   * @returns Locations avec productionBasinIds[] et productionBasins[] calculés incluant la propagation
   */
  public static calculateBasinPropagation(
    locations: LocationResponse[]
  ): LocationResponse[] {
    // Map: code → location
    const locationMap = new Map<string, LocationResponse>();

    // Map: code → Set<basinId> pour collecter tous les bassins (UNION)
    const basinsByLocation = new Map<string, Set<string>>();

    // Map: basinId → basin object pour récupérer les détails
    const basinDetails = new Map<string, { id: string; name: string }>();

    // Étape 1: Initialiser la map et collecter les associations directes
    locations.forEach((location) => {
      locationMap.set(location.code, { ...location });
      basinsByLocation.set(location.code, new Set());

      // Si association directe (venant de la BD)
      if (location.productionBasinIds && location.productionBasinIds.length > 0) {
        location.productionBasinIds.forEach((basinId) => {
          basinsByLocation.get(location.code)!.add(basinId);
        });

        // Collecter les détails des bassins
        if (location.productionBasins) {
          location.productionBasins.forEach((basin) => {
            basinDetails.set(basin.id, basin);
          });
        }
      }
    });

    // Étape 2: Propagation DESCENDANTE (des parents vers les enfants)
    // On commence par les régions, puis les départements
    const regions = Array.from(locationMap.values()).filter(loc => loc.type === "region");
    const departments = Array.from(locationMap.values()).filter(loc => loc.type === "department");
    const districts = Array.from(locationMap.values()).filter(loc => loc.type === "district");

    // Propager depuis les régions vers leurs départements et districts
    regions.forEach((region) => {
      const regionBasins = basinsByLocation.get(region.code)!;
      if (regionBasins.size > 0) {
        // Trouver tous les départements de cette région
        const regionDepartments = departments.filter(dept => dept.parentCode === region.code);

        regionDepartments.forEach((dept) => {
          const deptBasins = basinsByLocation.get(dept.code)!;
          // UNION: ajouter tous les bassins de la région au département
          regionBasins.forEach((basinId) => deptBasins.add(basinId));

          // Trouver tous les districts de ce département
          const deptDistricts = districts.filter(dist => dist.parentCode === dept.code);
          deptDistricts.forEach((dist) => {
            const distBasins = basinsByLocation.get(dist.code)!;
            // UNION: ajouter tous les bassins de la région au district
            regionBasins.forEach((basinId) => distBasins.add(basinId));
          });
        });
      }
    });

    // Propager depuis les départements vers leurs districts
    departments.forEach((department) => {
      const departmentBasins = basinsByLocation.get(department.code)!;
      if (departmentBasins.size > 0) {
        // Trouver tous les districts de ce département
        const deptDistricts = districts.filter(dist => dist.parentCode === department.code);

        deptDistricts.forEach((dist) => {
          const distBasins = basinsByLocation.get(dist.code)!;
          // UNION: ajouter tous les bassins du département au district
          departmentBasins.forEach((basinId) => distBasins.add(basinId));
        });
      }
    });

    // Étape 3: Propagation ASCENDANTE (des enfants vers les parents)
    // Propager depuis les districts vers les départements
    districts.forEach((district) => {
      const districtBasins = basinsByLocation.get(district.code)!;
      if (districtBasins.size > 0 && district.parentCode) {
        const parentBasins = basinsByLocation.get(district.parentCode);
        if (parentBasins) {
          // UNION: ajouter tous les bassins du district au département parent
          districtBasins.forEach((basinId) => parentBasins.add(basinId));
        }
      }
    });

    // Propager depuis les départements vers les régions
    departments.forEach((department) => {
      const departmentBasins = basinsByLocation.get(department.code)!;
      if (departmentBasins.size > 0 && department.parentCode) {
        const parentBasins = basinsByLocation.get(department.parentCode);
        if (parentBasins) {
          // UNION: ajouter tous les bassins du département à la région parente
          departmentBasins.forEach((basinId) => parentBasins.add(basinId));
        }
      }
    });

    // Étape 4: Mettre à jour les locations avec les résultats calculés
    const result: LocationResponse[] = [];
    locationMap.forEach((location) => {
      const basins = basinsByLocation.get(location.code)!;
      const basinIds = Array.from(basins);

      result.push({
        ...location,
        isInProductionBasin: basinIds.length > 0,
        productionBasinIds: basinIds,
        productionBasins: basinIds
          .map((id) => basinDetails.get(id))
          .filter((basin): basin is { id: string; name: string } => basin !== undefined),
      });
    });

    return result;
  }

  /**
   * Calcule la propagation pour une localisation spécifique
   * Utile pour les mises à jour dynamiques
   */
  public static calculateForLocation(
    targetCode: string,
    locations: LocationResponse[]
  ): {
    isInProductionBasin: boolean;
    productionBasinIds: string[];
    productionBasins: Array<{ id: string; name: string }>;
  } {
    // Recalculer tout avec la nouvelle logique
    const updated = this.calculateBasinPropagation(locations);
    const target = updated.find((loc) => loc.code === targetCode);

    if (!target) {
      return {
        isInProductionBasin: false,
        productionBasinIds: [],
        productionBasins: [],
      };
    }

    return {
      isInProductionBasin: target.isInProductionBasin || false,
      productionBasinIds: target.productionBasinIds || [],
      productionBasins: target.productionBasins || [],
    };
  }

  /**
   * Met à jour la propagation après changement d'association directe
   */
  public static updatePropagationAfterChange(
    changedCode: string,
    locations: LocationResponse[]
  ): LocationResponse[] {
    // Avec la nouvelle logique UNION, un changement affecte toute la hiérarchie
    // Il est plus simple et sûr de recalculer complètement
    return this.calculateBasinPropagation(locations);
  }
}
