import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";

/**
 * Hook pour gérer les permissions utilisateur de manière centralisée
 */
export function usePermissions() {
  const { user } = useAuth();

  const role = user?.role;
  const actorType = user?.actor?.actorType;

  // ===== Permissions par rôle =====

  const isTechnicalAdmin = role === USER_ROLES_CONSTANTS.TECHNICAL_ADMIN;
  const isBasinAdmin = role === USER_ROLES_CONSTANTS.BASIN_ADMIN;
  const isFieldAgent = role === USER_ROLES_CONSTANTS.FIELD_AGENT;
  const isActorManager = role === USER_ROLES_CONSTANTS.ACTOR_MANAGER;

  // ===== Permissions par type d'acteur (pour actor_manager) =====

  const isActorManagerProducers =
    isActorManager && actorType === "PRODUCERS";
  const isActorManagerBuyer = isActorManager && actorType === "BUYER";
  const isActorManagerExporter = isActorManager && actorType === "EXPORTER";
  const isActorManagerTransformer =
    isActorManager && actorType === "TRANSFORMER";

  // Groupe : BUYER, EXPORTER, TRANSFORMER
  const isActorManagerBET =
    isActorManager &&
    ["BUYER", "EXPORTER", "TRANSFORMER"].includes(actorType || "");

  // ===== Permissions spécifiques par fonctionnalité =====

  /**
   * Peut créer/modifier/supprimer des conventions
   */
  const canManageConventions =
    isTechnicalAdmin || isBasinAdmin || isActorManagerProducers;

  /**
   * Peut créer/modifier/supprimer des transferts de produits (groupage)
   */
  const canManageGroupageTransfers =
    isTechnicalAdmin || isBasinAdmin || isActorManagerProducers;

  /**
   * Peut créer/modifier/supprimer des transferts de produits (standard)
   */
  const canManageStandardTransfers =
    isTechnicalAdmin ||
    isBasinAdmin ||
    isActorManagerProducers ||
    isActorManagerBuyer ||
    isActorManagerExporter;

  /**
   * Peut créer/modifier/supprimer des calendriers (marché et enlèvement)
   */
  const canManageCalendars =
    isTechnicalAdmin || isBasinAdmin || isActorManagerProducers;

  /**
   * Peut créer des transactions de vente
   */
  const canCreateSaleTransactions =
    isTechnicalAdmin ||
    isBasinAdmin ||
    isFieldAgent ||
    isActorManagerProducers ||
    isActorManagerBuyer ||
    isActorManagerExporter;

  /**
   * Peut créer des transactions d'achat
   */
  const canCreatePurchaseTransactions =
    isTechnicalAdmin ||
    isBasinAdmin ||
    isFieldAgent ||
    isActorManagerBuyer ||
    isActorManagerExporter ||
    isActorManagerTransformer;

  /**
   * Peut créer/modifier/supprimer des magasins (stores)
   */
  const canManageStores = isTechnicalAdmin || isBasinAdmin;

  /**
   * Peut voir les détails (sans pouvoir modifier)
   * Le field_agent peut voir mais pas modifier les détails
   */
  const canViewDetails = true; // Tous les utilisateurs peuvent voir les détails

  /**
   * Peut éditer/supprimer (actions sur les pages de détail)
   */
  const canEditDelete = !isFieldAgent; // Tout le monde sauf field_agent

  return {
    // Rôles
    isTechnicalAdmin,
    isBasinAdmin,
    isFieldAgent,
    isActorManager,

    // Types d'acteurs
    isActorManagerProducers,
    isActorManagerBuyer,
    isActorManagerExporter,
    isActorManagerTransformer,
    isActorManagerBET,

    // Permissions spécifiques
    canManageConventions,
    canManageGroupageTransfers,
    canManageStandardTransfers,
    canManageCalendars,
    canManageStores,
    canCreateSaleTransactions,
    canCreatePurchaseTransactions,
    canViewDetails,
    canEditDelete,
  };
}
