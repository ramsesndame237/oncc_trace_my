/**
 * Types et constantes pour les acteurs
 */

// Types d'acteur disponibles
export const ACTOR_TYPES = ['PRODUCER', 'TRANSFORMER', 'PRODUCERS', 'BUYER', 'EXPORTER'] as const

// convertir ACTOR_TYPES en un objet a partir du tableau
export const ACTOR_TYPES_OBJECT = ACTOR_TYPES.reduce(
  (acc, type) => {
    acc[type] = type
    return acc
  },
  {} as Record<ActorType, ActorType>
)

// Type TypeScript dérivé de la constante
export type ActorType = (typeof ACTOR_TYPES)[number]

// Statuts d'acteur disponibles
export const ACTOR_STATUSES = ['active', 'inactive', 'pending'] as const

// Type TypeScript pour les statuts
export type ActorStatus = (typeof ACTOR_STATUSES)[number]

// Interface pour les informations du manager
export interface ManagerInfo {
  nom: string
  prenom: string
  phone?: string
  email: string
}

export interface CreateActorData {
  actorType: ActorType
  familyName: string
  givenName: string
  phone?: string
  email?: string
  onccId?: string
  identifiantId?: string
  locationCode?: string
  managerInfo?: ManagerInfo
  status?: ActorStatus
  metadata?: Record<string, string | null | undefined>
  // Champs pour la déclaration d'existence (OPA uniquement)
  existenceDeclarationDate?: string
  existenceDeclarationCode?: string
  existenceDeclarationYears?: number
}

export interface UpdateActorData {
  actorType?: ActorType
  familyName?: string
  givenName?: string
  phone?: string
  email?: string
  onccId?: string
  identifiantId?: string
  locationCode?: string
  managerInfo?: ManagerInfo
  metadata?: Record<string, string | null | undefined>
  // Champs pour la déclaration d'existence (OPA uniquement)
  existenceDeclarationDate?: string
  existenceDeclarationCode?: string
  existenceDeclarationYears?: number
}
