import { ISyncHandler } from "@/core/domain/sync.types";
import { ActorFilters, ActorWithSync, GetActorsResult } from "./actor.types";
import {
  OpaCollectionsResponse,
  ProducerProductionsResponse,
} from "./production.types";

export interface IActorRepository extends ISyncHandler {
  getAll(filters: ActorFilters, isOnline: boolean): Promise<GetActorsResult>;
  getById(id: string, isOnline: boolean): Promise<ActorWithSync>;
  add(actor: Omit<ActorWithSync, "id">, isOnline: boolean): Promise<void>;
  update(
    id: string,
    actor: Partial<ActorWithSync>,
    editOffline?: boolean
  ): Promise<void>;
  updateStatus(id: string, status: "active" | "inactive"): Promise<void>;
  addProducerToOpa(
    opaId: string,
    producerId: string
  ): Promise<void>;
  addProducersToOpaBulk(
    data: {
      opaId: string;
      producerIds: string[];
    },
    editOffline?: boolean,
    entityId?: string
  ): Promise<void>;
  addBuyersToExporterBulk(
    data: {
      exporterId: string;
      buyerIds: string[];
    },
    editOffline?: boolean,
    entityId?: string
  ): Promise<void>;
  removeProducerFromOpa(opaId: string, producerId: string): Promise<void>;
  getProducerOpas(
    producerId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult>;
  getOpaProducers(
    opaId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult>;
  getBuyerExporters(
    buyerId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult>;
  getExporterBuyers(
    exporterId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult>;
  addBuyerToExporter(
    exporterId: string,
    buyerId: string
  ): Promise<void>;
  removeBuyerFromExporter(exporterId: string, buyerId: string): Promise<void>;
  getProducerProductions(
    producerId: string,
    opaId?: string,
    campaignId?: string
  ): Promise<ProducerProductionsResponse>;
  getOpaCollections(
    opaId: string,
    campaignId?: string
  ): Promise<OpaCollectionsResponse>;
}
