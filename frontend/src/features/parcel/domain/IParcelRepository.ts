import type { ISyncHandler } from "@/core/domain/sync.types";
import type {
  ApiParcelResponse,
  CreateParcelsBulkData,
  CreateParcelsBulkResult,
  GetProducerParcelsFilters,
  ParcelStatus,
  UpdateParcelData,
} from "./parcel.types";

export interface IParcelRepository extends ISyncHandler {
  getProducerParcels(
    filters: GetProducerParcelsFilters,
    isOnline: boolean
  ): Promise<ApiParcelResponse[]>;
  getById(parcelId: string, entityId?: string): Promise<ApiParcelResponse>;
  createParcelsBulk(
    data: CreateParcelsBulkData,
    entityId?: string
  ): Promise<CreateParcelsBulkResult>;
  updateParcel(
    parcelId: string,
    data: UpdateParcelData,
    entityId?: string
  ): Promise<void>;
  updateParcelStatus(
    parcelId: string,
    status: ParcelStatus
  ): Promise<ApiParcelResponse>;
}
