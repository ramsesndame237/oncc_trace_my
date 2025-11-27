import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import {
  GetProducerParcelsUseCase,
  GetParcelByIdUseCase,
  CreateParcelsBulkUseCase,
  UpdateParcelUseCase,
  UpdateParcelStatusUseCase
} from "../../application/useCases";
import { ParcelService } from "../services/parcelService";

export class ParcelServiceProvider {
  static getGetProducerParcelsUseCase(): GetProducerParcelsUseCase {
    ensureDIConfigured();
    return container.resolve(GetProducerParcelsUseCase);
  }

  static getGetParcelByIdUseCase(): GetParcelByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetParcelByIdUseCase);
  }

  static getCreateParcelsBulkUseCase(): CreateParcelsBulkUseCase {
    ensureDIConfigured();
    return container.resolve(CreateParcelsBulkUseCase);
  }

  static getUpdateParcelUseCase(): UpdateParcelUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateParcelUseCase);
  }

  static getUpdateParcelStatusUseCase(): UpdateParcelStatusUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateParcelStatusUseCase);
  }

  static getParcelService(): ParcelService {
    ensureDIConfigured();
    return container.resolve(ParcelService);
  }
}