import { IPostLoginSyncHandler, SyncStatus } from "@/core/domain/sync.types";
import { apiClient } from "@/core/infrastructure/api/client";
import {
  db,
  OfflineLocationData,
  PendingOperation,
} from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { PollingService } from "@/core/infrastructure/services/pollingService";
import { inject, injectable } from "tsyringe";
import { ILocationRepository } from "../../domain/ILocationRepository";
import {
  LocationFilters,
  LocationResponse,
  LocationsApiResponse,
  LocationWithSync,
} from "../../domain/location.types";
import { LocationBasinCalculator } from "../../domain/services/locationBasinCalculator";

/**
 * Implémentation du repository pour les localisations
 * Utilise le système de delta counts via PollingService pour optimiser la synchronisation
 */
@injectable()
export class LocationRepository
  implements ILocationRepository, IPostLoginSyncHandler
{
  readonly entityType = "location";

  constructor(
    @inject(DI_TOKENS.PollingService) private pollingService: PollingService
  ) {}

  async getAll(
    isOnline: boolean,
    filters?: LocationFilters
  ): Promise<LocationWithSync[]> {
    // if (isOnline) {
    //   // Vérifier si une synchronisation est nécessaire
    //   const needsSync = await this.needsSync();
    //   if (needsSync) {
    //     await this.syncFromApi();
    //   }
    // }

    // Récupérer depuis la base locale
    return this.getFromLocal(filters);
  }

  async getHierarchy(): // isOnline: boolean
  Promise<LocationWithSync[]> {
    // if (isOnline) {
    //   try {
    //     const response = await apiClient.get<LocationsApiResponse>(
    //       "/locations/hierarchy"
    //     );
    //     if (response.success && response.data) {
    //       return this.mapApiResponseToLocationWithSync(response.data);
    //     }
    //   } catch (error) {
    //     console.warn(
    //       "Erreur API hiérarchie, utilisation des données locales:",
    //       error
    //     );
    //   }
    // }

    // Fallback vers les données locales
    const allLocations = await this.getFromLocal();
    return this.buildHierarchy(allLocations);
  }

  async getChildren(
    parentCode: string
    // isOnline: boolean
  ): Promise<LocationWithSync[]> {
    // if (isOnline) {
    //   try {
    //     const response = await apiClient.get<LocationsApiResponse>(
    //       `/locations/${parentCode}/children`
    //     );
    //     if (response.success && response.data) {
    //       return this.mapApiResponseToLocationWithSync(response.data);
    //     }
    //   } catch (error) {
    //     console.warn(
    //       "Erreur API enfants, utilisation des données locales:",
    //       error
    //     );
    //   }
    // }

    // Fallback vers les données locales
    return this.getFromLocal({ parentCode });
  }

  async syncFromApi(): Promise<void> {
    try {
      const response = await apiClient.get<LocationsApiResponse>("/locations");
      if (!response.success || !response.data) {
        throw new Error("Réponse API invalide");
      }

      const locations = response.data;

      // Les informations de bassin sont déjà présentes dans LocationResponse
      const locationsWithBasinInfo = locations;

      // Calculer la propagation des bassins
      const locationsWithPropagation =
        LocationBasinCalculator.calculateBasinPropagation(
          locationsWithBasinInfo
        );

      // Vider la table locale
      await db.locations.clear();

      // Insérer les nouvelles données avec propagation
      const offlineData: OfflineLocationData[] = locationsWithPropagation.map(
        (location: LocationResponse) => ({
          code: location.code,
          name: location.name,
          type: location.type,
          status: location.status,
          parentCode: location.parentCode,
          isInProductionBasin: location.isInProductionBasin,
          productionBasinIds: location.productionBasinIds || [],
          productionBasins: location.productionBasins || [],
          createdAt: location.createdAt,
          updatedAt: location.updatedAt,
          syncedAt: Date.now(),
        })
      );

      // Dédupliquer par code avant l'insertion pour éviter les doublons
      const uniqueOfflineData = Array.from(
        new Map(offlineData.map((loc) => [loc.code, loc])).values()
      );

      await db.locations.bulkAdd(uniqueOfflineData);
      console.log(`Synchronisé ${uniqueOfflineData.length} localisations (${locations.length - uniqueOfflineData.length} doublons ignorés)`);
    } catch (error) {
      console.error(
        "Erreur lors de la synchronisation des localisations:",
        error
      );
      throw error;
    }
  }

  async needsSync(): Promise<boolean> {
    try {
      // Vérifier si la table locale est vide
      const localCount = await this.getLocalCount();
      if (localCount === 0) {
        return true;
      }

      // Comparer avec le nombre en ligne
      const remoteCount = await this.getRemoteCount();
      if (remoteCount === 0) {
        return false;
      }
      return localCount !== remoteCount;
    } catch (error) {
      console.warn("Erreur lors de la vérification de sync:", error);
      return false;
    }
  }

  async getLocalCount(): Promise<number> {
    return db.locations.count();
  }

  async getRemoteCount(): Promise<number> {
    try {
      const response = await apiClient.get<LocationsApiResponse>("/locations");
      if (response.success && response.data) {
        return response.data.length;
      }
      return 0;
    } catch (error) {
      console.warn("Erreur lors du comptage distant:", error);
      return 0;
    }
  }

  /**
   * Récupère les localisations depuis la base locale
   */
  private async getFromLocal(
    filters?: LocationFilters
  ): Promise<LocationWithSync[]> {
    let query = db.locations.orderBy("[type+name]");

    if (filters && filters?.type) {
      query = query.filter((location) => location.type === filters.type);
    }

    if (filters && !filters?.search) {
      if (filters?.parentCode) {
        query = query.filter(
          (location) => location.parentCode === filters.parentCode
        );
      } else {
        query = query.filter((location) => location.parentCode === null);
      }
    }

    if (filters && filters?.search) {
      if (filters?.parentCode) {
        query = query.filter(
          (location) => location.parentCode === filters.parentCode
        );
      }

      const searchLower = filters.search.toLowerCase();
      query = query.filter((location) => {
        return (
          location.name.toLowerCase().includes(searchLower) ||
          location.code.toLowerCase().includes(searchLower)
        );
      });
    }

    const locations = await query.toArray();

    // Dédupliquer par code (identifiant unique) pour éviter les doublons
    const uniqueLocations = Array.from(
      new Map(locations.map((loc) => [loc.code, loc])).values()
    );

    return this.mapOfflineDataToLocationWithSync(uniqueLocations);
  }

  /**
   * Construit la hiérarchie des localisations
   */
  private buildHierarchy(locations: LocationWithSync[]): LocationWithSync[] {
    const locationMap = new Map<string, LocationWithSync>();
    const roots: LocationWithSync[] = [];

    // Créer une map pour accès rapide
    locations.forEach((location) => {
      locationMap.set(location.code, { ...location, children: [] });
    });

    // Construire la hiérarchie
    locations.forEach((location) => {
      const locationWithChildren = locationMap.get(location.code)!;

      if (location.parentCode) {
        const parent = locationMap.get(location.parentCode);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(locationWithChildren);
          locationWithChildren.parent = parent;
        }
      } else {
        roots.push(locationWithChildren);
      }
    });

    return roots;
  }

  /**
   * Mappe les données de l'API vers LocationWithSync
   */
  private mapApiResponseToLocationWithSync(
    apiData: LocationResponse[]
  ): LocationWithSync[] {
    // Les informations de bassin sont déjà présentes dans LocationResponse
    const locationsWithBasinInfo = apiData;

    // Calculer la propagation avant le mapping
    const locationsWithPropagation =
      LocationBasinCalculator.calculateBasinPropagation(locationsWithBasinInfo);

    return locationsWithPropagation.map((location) => ({
      id: location.id,
      localId: undefined,
      code: location.code,
      name: location.name,
      type: location.type,
      status: location.status,
      parentCode: location.parentCode,
      isInProductionBasin: location.isInProductionBasin,
      productionBasinIds: location.productionBasinIds || [],
      productionBasins: location.productionBasins || [],
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      syncStatus: SyncStatus.SYNCED,
      parent: location.parent
        ? this.mapApiResponseToLocationWithSync([location.parent])[0]
        : null,
      children: location.children
        ? this.mapApiResponseToLocationWithSync(location.children)
        : [],
    }));
  }

  /**
   * Mappe les données locales vers LocationWithSync
   */
  private mapOfflineDataToLocationWithSync(
    offlineData: OfflineLocationData[]
  ): LocationWithSync[] {
    return offlineData.map((location) => ({
      id: 0, // ID numérique non utilisé (nous utilisons code comme identifiant)
      localId: location.id,
      code: location.code,
      name: location.name,
      type: location.type,
      status: location.status,
      parentCode: location.parentCode,
      isInProductionBasin: location.isInProductionBasin,
      productionBasinIds: location.productionBasinIds || [],
      productionBasins: location.productionBasins || [],
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      syncStatus: SyncStatus.SYNCED,
    }));
  }

  // Méthodes requises par ISyncHandler
  /**
   * Implémentation de la synchronisation post-connexion
   * Utilise le système de delta counts via PollingService pour optimiser la synchronisation
   * Cette méthode est appelée automatiquement après chaque connexion réussie et par le polling
   */
  async syncOnLogin(): Promise<void> {
    console.log(
      "🔑 Synchronisation des localisations déclenchée..."
    );
    try {
      // Vérifier si nous avons des données locales
      const localCount = await this.getLocalCount();

      if (localCount === 0) {
        // ⭐ SYNC INITIALE (première fois)
        console.log(
          "🔄 Aucune donnée locale, synchronisation initiale des localisations..."
        );
        await this.syncFromApi();
        console.log(
          "✅ Localisations synchronisées avec succès (sync initiale)."
        );
        return;
      }

      // ⭐ VÉRIFIER LES DELTA COUNTS (sauvegarés par PollingService)
      const deltaCount = this.pollingService.getEntityCount("locations");

      if (deltaCount > 0) {
        console.log(
          `🔄 ${deltaCount} location(s) modifiée(s) détectée(s), synchronisation en cours...`
        );
        await this.syncFromApi();

        // ⭐ RESET DU COUNT APRÈS SYNC RÉUSSIE
        this.pollingService.setEntityCount("locations", 0);
        console.log(
          "✅ Localisations synchronisées avec succès après mise à jour."
        );
      } else {
        console.log("👍 Données de localisation déjà à jour.");
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la synchronisation des localisations:",
        error
      );
    }
  }

  async handle(operation: PendingOperation): Promise<void> {
    // Les localisations sont en lecture seule, pas d'opérations à traiter
    console.warn("Opération non supportée pour les localisations:", operation);
    return Promise.resolve();
  }
}
