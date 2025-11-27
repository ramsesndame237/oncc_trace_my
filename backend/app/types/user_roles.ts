/**
 * Types et constantes pour les rôles utilisateur du système SIFC
 */

export const USER_STATUSES = ['active', 'inactive', 'blocked'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_ROLES = [
  'technical_admin',
  'basin_admin',
  'field_agent',
  'actor_manager',
] as const
export type UserRole = (typeof USER_ROLES)[number]

// Constants for roles (to avoid typos)
export const USER_ROLES_CONSTANTS = {
  TECHNICAL_ADMIN: 'technical_admin' as const,
  BASIN_ADMIN: 'basin_admin' as const,
  FIELD_AGENT: 'field_agent' as const,
  ACTOR_MANAGER: 'actor_manager' as const,
} as const

// Array of roles for validation
export const USER_ROLES_ARRAY: UserRole[] = [
  USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
  USER_ROLES_CONSTANTS.BASIN_ADMIN,
  USER_ROLES_CONSTANTS.FIELD_AGENT,
  USER_ROLES_CONSTANTS.ACTOR_MANAGER,
]

// Short names (EN)
export const USER_ROLE_NAMES: Record<UserRole, string> = {
  technical_admin: 'Technical Admin',
  basin_admin: 'Basin Admin',
  field_agent: 'Field Agent',
  actor_manager: 'Actor Manager',
}

// Short names (FR)
export const USER_ROLE_NAMES_FR: Record<UserRole, string> = {
  technical_admin: 'Admin Technique',
  basin_admin: 'Admin de Bassin',
  field_agent: 'Agent de Terrain',
  actor_manager: "Gestionnaire d'Acteur",
}

// Role descriptions (EN)
export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  technical_admin: 'Technical administrator - Full system access',
  basin_admin: 'Basin administrator - Management of actors and stores in the basin',
  field_agent: 'Field agent - Collection and update of field data',
  actor_manager: 'Actor manager - Management of their actor data',
}

// Role descriptions (FR)
export const USER_ROLE_DESCRIPTIONS_FR: Record<UserRole, string> = {
  technical_admin: 'Administrateur technique - Accès complet au système',
  basin_admin: 'Administrateur de bassin - Gestion des acteurs et magasins du bassin',
  field_agent: 'Agent de terrain - Collecte et mise à jour des données terrain',
  actor_manager: "Gestionnaire d'acteur - Gestion des données de leur acteur",
}

// Role permissions (defines which roles can be created/consulted by each role)
export const ROLE_PERMISSIONS: Record<UserRole, UserRole[]> = {
  technical_admin: USER_ROLES_ARRAY, // Can manage all roles
  basin_admin: [
    USER_ROLES_CONSTANTS.BASIN_ADMIN,
    USER_ROLES_CONSTANTS.FIELD_AGENT,
    USER_ROLES_CONSTANTS.ACTOR_MANAGER,
  ], // Can manage field agents and actor managers
  field_agent: [], // Cannot manage any roles
  actor_manager: [], // Cannot manage any roles
}
