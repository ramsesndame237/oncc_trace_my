import { PaginationMeta } from "@/core/domain/types";
import { ActorFilters, ActorWithSync } from "./actor.types";
import {
  OpaCollectionsResponse,
  ProducerProductionsResponse,
} from "./production.types";

export interface ActorState {
  actors: ActorWithSync[];
  meta: PaginationMeta | null;
  filters: ActorFilters;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

export interface ActorActions {
  setFilters: (filters: Partial<ActorFilters>) => void;
  fetchActors: (force?: boolean | Partial<ActorFilters>) => Promise<void>;
  fetchActorById: (id: string) => Promise<ActorWithSync | null>;
  createActor: (actorData: Omit<ActorWithSync, "id">) => Promise<void>;
  updateActor: (
    id: string,
    actorData: Partial<ActorWithSync>,
    editOffline?: boolean
  ) => Promise<void>;
  updateActorStatus: (
    id: string,
    status: "active" | "inactive"
  ) => Promise<void>;
  addProducerToOpa: (opaId: string, producerId: string) => Promise<void>;
  removeProducerFromOpa: (opaId: string, producerId: string) => Promise<void>;
  addProducersToOpaBulk: (
    data: {
      type: string;
      opaId: string;
      producerIds: string[];
      opaInfo?: {
        familyName: string;
        givenName: string;
        locationCode?: string;
        onccId?: string;
        identifiantId?: string;
      };
    },
    editOffline?: string
  ) => Promise<void>;
  addBuyerToExporter: (exporterId: string, buyerId: string) => Promise<void>;
  removeBuyerFromExporter: (
    exporterId: string,
    buyerId: string
  ) => Promise<void>;
  getProducerProductions: (
    producerId: string,
    opaId?: string,
    campaignId?: string
  ) => Promise<ProducerProductionsResponse | null>;
  getOpaCollections: (
    opaId: string,
    campaignId?: string
  ) => Promise<OpaCollectionsResponse | null>;
}

export type ActorStore = ActorState & ActorActions;
