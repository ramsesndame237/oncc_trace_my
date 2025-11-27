import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";

// Use Cases
import { AddProductionBasinUseCase } from "../../application/useCases/addProductionBasinUseCase";
import { GetProductionBasinByIdUseCase } from "../../application/useCases/getProductionBasinByIdUseCase";
import { GetProductionBasinsUseCase } from "../../application/useCases/getProductionBasinsUseCase";
import { UpdateProductionBasinUseCase } from "../../application/useCases/updateProductionBasinUseCase";

/**
 * Service Provider pour les use cases des bassins de production
 */
export class ProductionBasinServiceProvider {
  /**
   * Récupère une instance du use case GetProductionBasins
   */
  static getGetProductionBasinsUseCase(): GetProductionBasinsUseCase {
    ensureDIConfigured();
    return container.resolve(GetProductionBasinsUseCase);
  }

  /**
   * Récupère une instance du use case GetProductionBasinById
   */
  static getGetProductionBasinByIdUseCase(): GetProductionBasinByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetProductionBasinByIdUseCase);
  }

  /**
   * Récupère une instance du use case AddProductionBasin
   */
  static getAddProductionBasinUseCase(): AddProductionBasinUseCase {
    ensureDIConfigured();
    return container.resolve(AddProductionBasinUseCase);
  }

  /**
   * Récupère une instance du use case UpdateProductionBasin
   */
  static getUpdateProductionBasinUseCase(): UpdateProductionBasinUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateProductionBasinUseCase);
  }
}
