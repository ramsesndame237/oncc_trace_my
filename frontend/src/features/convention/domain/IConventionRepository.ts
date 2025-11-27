import { ISyncHandler } from "@/core/domain/sync.types";
import type {
  ConventionFilters,
  ConventionWithSync,
  GetConventionsResult,
} from "./types";

/**
 * Interface pour le repository des conventions
 * Gère le stockage local et la synchronisation avec le backend
 */
export interface IConventionRepository extends ISyncHandler {
  /**
   * Récupère toutes les conventions selon les filtres
   * @param filters - Filtres de recherche
   * @param isOnline - Indicateur de connexion réseau
   */
  getAll(
    filters: ConventionFilters,
    isOnline: boolean
  ): Promise<GetConventionsResult>;

  /**
   * Récupère une convention par son ID
   * @param id - ID de la convention
   * @param isOnline - Indicateur de connexion réseau
   */
  getById(id: string, isOnline: boolean): Promise<ConventionWithSync>;

  /**
   * Ajoute une nouvelle convention (stockage local + file d'attente de sync)
   * @param convention - Données de la convention à créer
   * @param isOnline - Indicateur de connexion réseau
   */
  add(
    convention: Omit<ConventionWithSync, "id">,
    isOnline: boolean
  ): Promise<void>;

  /**
   * Met à jour une convention existante
   * @param id - ID de la convention à mettre à jour
   * @param convention - Données partielles de la convention à mettre à jour
   * @param editOffline - Si true, modifie l'opération pendante existante au lieu d'en créer une nouvelle
   */
  update(
    id: string,
    convention: Partial<ConventionWithSync>,
    editOffline?: boolean
  ): Promise<void>;

  /**
   * Associe une convention à la campagne active
   * @param conventionId - ID de la convention
   * @param campaignId - ID de la campagne active
   * @param isOnline - Indicateur de connexion réseau
   */
  associateToCampaign(
    conventionId: string,
    campaignId: string,
    isOnline: boolean
  ): Promise<void>;

  /**
   * Dissocie une convention d'une campagne
   * @param conventionId - ID de la convention
   * @param campaignId - ID de la campagne
   * @param isOnline - Indicateur de connexion réseau
   */
  dissociateFromCampaign(
    conventionId: string,
    campaignId: string,
    isOnline: boolean
  ): Promise<void>;
}
