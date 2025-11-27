import { ActorStatus, ActorTypes } from "@/core/domain/actor.types";
import { ISyncStatus } from "@/core/domain/sync.types";
import { BaseEntity, PaginationMeta } from "@/core/domain/types";
import { CalendarWithSync } from "@/features/calendar/domain";
import { ConventionWithSync } from "@/features/convention/domain";
import { StoreWithSync } from "@/features/store";
import { UserWithSync } from "@/features/user";

export interface Actor extends BaseEntity {
  id: string;
  actorType: ActorTypes;
  familyName: string;
  givenName: string;
  phone?: string;
  email?: string;
  onccId?: string;
  identifiantId?: string;
  locationCode: string;
  status?: ActorStatus;
  managerInfo?: {
    familyName?: string;
    givenName?: string;
    nom?: string;
    prenom?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, string | null>;
  existenceDeclarationDate?: string | null;
  existenceDeclarationCode?: string | null;
  existenceDeclarationYears?: number | null;
  existenceExpiryDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  location?: {
    code: string;
    name: string;
    type: string;
  };
  parcels?: Array<{
    id?: string;
    locationCode: string;
    surfaceArea: number;
    parcelType: string;
    identificationId?: string;
    onccId?: string | null;
    parcelCreationDate?: string;
    coordinates?: Array<{
      id?: string;
      latitude: number;
      longitude: number;
      pointOrder: number;
    }>;
  }>;
  documents?: Array<{
    id: string;
    originalName: string;
    fileName: string;
    mimeType?: string;
    size?: number;
    documentType?: string;
    publicUrl?: string;
  }>;
  users?: UserWithSync[];
  producers?: Array<{
    id: string;
    actorType?: ActorTypes;
    familyName: string;
    givenName: string;
    phone?: string;
    email?: string;
    onccId?: string;
    identifiantId?: string;
    locationCode?: string;
    status?: ActorStatus | string;
    pivot?: {
      membershipDate: string | null;
      status: string;
    };
    // Champs pour la sync (format simplifié du backend)
    membershipDate?: string | null;
  }>;
  buyers?: Array<{
    id: string;
    actorType?: ActorTypes;
    familyName: string;
    givenName: string;
    phone?: string;
    email?: string;
    onccId?: string;
    identifiantId?: string;
    locationCode?: string;
    status?: ActorStatus | string;
    pivot?: {
      mandateDate: string | null;
      status: string;
      campaignId: string;
    };
    // Champs pour la sync (format simplifié du backend)
    mandateDate?: string | null;
    campaignId?: string | null;
  }>;
  // Exportateurs mandants (pour BUYER) - utilisé pour la sync
  mandators?: Array<{
    id: string;
    familyName: string;
    givenName: string;
    onccId?: string;
    mandateDate?: string | null;
    status?: string;
    campaignId?: string | null;
  }>;
  // OPA auxquelles appartient le producteur (pour PRODUCER) - utilisé pour la sync
  opas?: Array<{
    id: string;
    familyName: string;
    givenName: string;
    onccId?: string;
    membershipDate?: string | null;
    status?: string;
  }>;
  stores?: Array<StoreWithSync>;
  conventions?: Array<ConventionWithSync>;
  calendars?: Array<CalendarWithSync>;
}

export interface ActorWithSync extends Actor {
  syncStatus?: ISyncStatus;
  fullName?: string;
}

export interface ActorFilters {
  page?: number;
  per_page?: number;
  search?: string;
  actorType?: string;
  status?: string;
  locationCode?: string;
}

export interface GetActorsResult {
  actors: ActorWithSync[];
  meta: PaginationMeta;
}

/**
 * Résultat de la synchronisation complète des acteurs
 */
export interface SyncAllActorsResult {
  actors: ActorWithSync[];
  total: number;
  syncedAt: number;
}

/**
 * Statistiques des acteurs
 */
export interface ActorStats {
  /** Total des acteurs */
  total: number;

  /** Acteurs actifs */
  active: number;

  /** Statistiques par type et statut */
  byTypeAndStatus: Array<{
    actorType: string;
    status: string;
    total: number;
  }>;
}
