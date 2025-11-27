import { ISyncHandler } from "@/core/domain/sync.types";
import { Actor } from "@/core/domain/actor.types";
import { GetStoresResult, StoreFilters, StoreStats, StoreWithSync } from "./store.domain.types";

export interface IStoreRepository extends ISyncHandler {
  getAll(filters: StoreFilters, isOnline: boolean): Promise<GetStoresResult>;
  getById(id: string, isOnline: boolean): Promise<StoreWithSync>;
  add(store: Omit<StoreWithSync, "id">, isOnline: boolean): Promise<void>;
  update(
    id: string,
    store: Partial<StoreWithSync>,
    isOnline: boolean
  ): Promise<void>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
  getStats(): Promise<StoreStats>;
  addOccupant(storeId: string, actorId: string, isOnline: boolean): Promise<void>;
  removeOccupant(storeId: string, actorId: string, isOnline: boolean): Promise<void>;
  getOccupants(storeId: string, isOnline: boolean): Promise<Actor[]>;
}
