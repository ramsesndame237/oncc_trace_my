import { ISyncHandler } from "@/core/domain/sync.types";
import { LocationFilters, LocationWithSync } from "./location.types";

/**
 * Interface du repository pour les localisations
 */
export interface ILocationRepository extends ISyncHandler {
  /**
   * Récupère toutes les localisations avec leurs statuts de synchronisation
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @param filters - Filtres optionnels pour la recherche
   * @returns Une promesse résolue avec les localisations
   */
  getAll(
    isOnline: boolean,
    filters?: LocationFilters
  ): Promise<LocationWithSync[]>;

  /**
   * Récupère la hiérarchie complète des localisations
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec la hiérarchie des localisations
   */
  getHierarchy(isOnline: boolean): Promise<LocationWithSync[]>;

  /**
   * Récupère les enfants d'une localisation
   * @param parentCode - Code de la localisation parent
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec les enfants
   */
  getChildren(
    parentCode: string,
    isOnline: boolean
  ): Promise<LocationWithSync[]>;

  /**
   * Synchronise les localisations depuis l'API
   * @returns Une promesse résolue quand la synchronisation est terminée
   */
  syncFromApi(): Promise<void>;

  /**
   * Vérifie si une synchronisation est nécessaire
   * @returns Une promesse résolue avec true si une sync est nécessaire
   */
  needsSync(): Promise<boolean>;

  /**
   * Compte le nombre de localisations en local
   * @returns Une promesse résolue avec le nombre d'enregistrements
   */
  getLocalCount(): Promise<number>;

  /**
   * Compte le nombre de localisations en ligne
   * @returns Une promesse résolue avec le nombre d'enregistrements
   */
  getRemoteCount(): Promise<number>;
}
