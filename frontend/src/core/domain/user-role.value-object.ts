import type { User } from "@/core/domain/user.types";
import {
  USER_ROLES_CONSTANTS,
  USER_ROLE_NAMES,
  USER_ROLE_NAMES_FR,
  isValidRole,
} from "@/core/domain/user.types";
import i18n from "@/i18n/client";

/**
 * Objet de valeur représentant un rôle utilisateur
 * Encapsule la logique de permissions et d'affichage
 */
export class UserRole {
  constructor(public readonly value: User["role"]) {
    if (!isValidRole(value)) {
      console.warn(
        `Invalid role detected: ${value}. Falling back to field_agent role.`
      );
      // Fallback vers field_agent pour les rôles invalides (données legacy)
      (this as { value: User["role"] }).value =
        USER_ROLES_CONSTANTS.FIELD_AGENT;
    }
  }

  /**
   * Vérifie si le rôle peut gérer les utilisateurs
   */
  canManageUsers(): boolean {
    return this.value === USER_ROLES_CONSTANTS.TECHNICAL_ADMIN;
  }

  /**
   * Vérifie si le rôle peut gérer les bassins de production
   */
  canManageBasins(): boolean {
    const roles: string[] = [
      USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
      USER_ROLES_CONSTANTS.BASIN_ADMIN,
    ];
    return roles.includes(this.value);
  }

  /**
   * Vérifie si le rôle peut collecter des données sur le terrain
   */
  canCollectData(): boolean {
    return this.value === USER_ROLES_CONSTANTS.FIELD_AGENT;
  }

  /**
   * Vérifie si le rôle peut gérer les acteurs (producteurs, magasins)
   */
  canManageActors(): boolean {
    const roles: string[] = [
      USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
      USER_ROLES_CONSTANTS.BASIN_ADMIN,
      USER_ROLES_CONSTANTS.ACTOR_MANAGER,
    ];
    return roles.includes(this.value);
  }

  /**
   * Vérifie si le rôle a des permissions d'administration
   */
  isAdmin(): boolean {
    const adminRoles: string[] = [
      USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
      USER_ROLES_CONSTANTS.BASIN_ADMIN,
    ];
    return adminRoles.includes(this.value);
  }

  /**
   * Vérifie si le rôle est un administrateur technique (super admin)
   */
  isTechnicalAdmin(): boolean {
    return this.value === USER_ROLES_CONSTANTS.TECHNICAL_ADMIN;
  }

  /**
   * Vérifie si le rôle est un administrateur de bassin
   */
  isBasinAdmin(): boolean {
    return this.value === USER_ROLES_CONSTANTS.BASIN_ADMIN;
  }

  /**
   * Vérifie si le rôle est un agent de terrain
   */
  isFieldAgent(): boolean {
    return this.value === USER_ROLES_CONSTANTS.FIELD_AGENT;
  }

  /**
   * Vérifie si le rôle est un gestionnaire d'acteur
   */
  isActorManager(): boolean {
    return this.value === USER_ROLES_CONSTANTS.ACTOR_MANAGER;
  }

  /**
   * Retourne le nom court du rôle dans la langue actuelle de l'application
   */
  getDisplayName(): string {
    const currentLang = i18n.language?.split("-")[0] || "fr";

    if (currentLang === "en") {
      return USER_ROLE_NAMES[this.value] || this.value;
    }

    return USER_ROLE_NAMES_FR[this.value] || this.value;
  }
}
