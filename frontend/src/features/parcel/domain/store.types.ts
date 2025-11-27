import type {
  ApiParcelResponse,
  CreateParcelsBulkData,
  ParcelStatus,
  UpdateParcelData,
} from "./parcel.types";

export interface ParcelState {
  parcels: ApiParcelResponse[];
  selectedParcel: ApiParcelResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface ParcelActions {
  createParcelsBulk: (
    data: CreateParcelsBulkData,
    entityId?: string
  ) => Promise<void>;
  updateParcel: (
    parcelId: string,
    data: UpdateParcelData,
    entityId?: string
  ) => Promise<void>;
  updateParcelStatus: (
    parcelId: string,
    status: ParcelStatus
  ) => Promise<void>;
  setSelectedParcel: (parcel: ApiParcelResponse | null) => void;
}

export type ParcelStore = ParcelState & ParcelActions;
