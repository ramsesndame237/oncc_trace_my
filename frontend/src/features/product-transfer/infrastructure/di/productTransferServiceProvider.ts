import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import {
  CreateProductTransferUseCase,
  DeleteProductTransferUseCase,
  GetProductTransferByIdUseCase,
  GetProductTransfersUseCase,
  UpdateProductTransferUseCase,
} from "../../application/useCases";

export class ProductTransferServiceProvider {
  static getGetProductTransfersUseCase(): GetProductTransfersUseCase {
    ensureDIConfigured();
    return container.resolve(GetProductTransfersUseCase);
  }

  static getGetProductTransferByIdUseCase(): GetProductTransferByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetProductTransferByIdUseCase);
  }

  static getCreateProductTransferUseCase(): CreateProductTransferUseCase {
    ensureDIConfigured();
    return container.resolve(CreateProductTransferUseCase);
  }

  static getUpdateProductTransferUseCase(): UpdateProductTransferUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateProductTransferUseCase);
  }

  static getDeleteProductTransferUseCase(): DeleteProductTransferUseCase {
    ensureDIConfigured();
    return container.resolve(DeleteProductTransferUseCase);
  }
}
