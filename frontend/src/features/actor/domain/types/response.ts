import { PaginationMeta } from "@/core/domain/types";
import type { ApiResponse } from "@/core/infrastructure/types/api.type";
import { Actor } from "../actor.types";

export interface ActorResponse
  extends Omit<Actor, "createdAt" | "updatedAt" | "location"> {
  location?: {
    code: string;
    name: string;
    type: string;
  };
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Réponse paginée pour la liste des acteurs
 */
export interface PaginatedActorsResponse {
  data: ActorResponse[];
  meta: PaginationMeta;
}

/**
 * Réponse pour récupérer la liste des acteurs
 */
export type GetActorsResponse = ApiResponse<PaginatedActorsResponse>;

/**
 * Réponse pour récupérer la liste des acteurs par type
 */
export type GetActorsByTypeResponse = ApiResponse<PaginatedActorsResponse>;

/**
 * Réponse pour récupérer un acteur
 */
export type GetActorResponse = ApiResponse<ActorResponse>;
