import { ActorStatus } from "@/core/domain/actor.types";
import { ActorFilters } from "../actor.types";

export interface GetActorsRequest extends ActorFilters {
  page?: number;
  limit?: number;
  search?: string;
  actorType?: string;
  status?: string;
  locationCode?: string;
}

export interface GetActorsByTypeRequest {
  type: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface GetActorRequest {
  id: string;
}

export interface CreateActorRequest {
  actorType: string;
  familyName: string;
  givenName: string;
  phone?: string;
  email?: string;
  onccId?: string;
  identifiantId?: string;
  locationCode: string;
  status?: ActorStatus;
  existenceDeclarationDate?: string | null;
  existenceDeclarationCode?: string | null;
  existenceDeclarationYears?: number | null;
  managerInfo?: {
    familyName?: string;
    givenName?: string;
    nom?: string;
    prenom?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, string>;
  parcels?: Array<{
    locationCode: string;
    surfaceArea: number;
    parcelType: string;
    identificationId?: string;
    onccId?: string | null;
    parcelCreationDate?: string;
    coordinates?: Array<{
      latitude: number;
      longitude: number;
      pointOrder: number;
    }>;
  }>;
  documents?: Array<{
    base64Data: string;
    mimeType: string;
    fileName: string;
    documentType: string;
  }>;
  // Producteurs membres de l'OPA (pour actorType === 'PRODUCERS')
  producers?: Array<{
    producerId: string;
    membershipDate?: string;
    status?: "active" | "inactive";
  }>;
  // Acheteurs mandataires de l'exportateur (pour actorType === 'EXPORTER')
  buyers?: Array<{
    buyerId: string;
    mandateDate?: string;
    status?: "active" | "inactive";
  }>;
}

export interface UpdateActorRequest {
  actorType?: string;
  familyName?: string;
  givenName?: string;
  phone?: string;
  email?: string;
  onccId?: string;
  identifiantId?: string;
  locationCode?: string;
  status?: ActorStatus;
  managerInfo?: {
    familyName?: string;
    givenName?: string;
    nom?: string;
    prenom?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
  existenceDeclarationDate?: string;
  existenceDeclarationCode?: string;
  existenceDeclarationYears?: number;
}

export interface UpdateActorStatusRequest {
  status: "active" | "inactive";
  reason?: string;
}
