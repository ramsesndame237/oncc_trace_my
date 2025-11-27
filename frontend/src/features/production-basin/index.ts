// Domain exports
export type {
  ProductionBasin,
  ProductionBasinWithSync,
} from "./domain/productionBasin.types";

// Presentation exports
export * from "./presentation/hooks";

export {
  ProductionBasinEditForm,
  ProductionBasinList,
} from "./presentation/components";

// Schémas de validation
export { productionBasinSchema } from "./presentation/schemas";

// Types de formulaires
export type { ProductionBasinFormData } from "./presentation/schemas";

// Store exports
export { useProductionBasinStore } from "./infrastructure/store/productionBasinStore";

// Service Provider export
export { ProductionBasinServiceProvider } from "./infrastructure/di/productionBasinServiceProvider";

// Application exports
export {
  AddProductionBasinUseCase,
  GetProductionBasinsUseCase,
  UpdateProductionBasinUseCase,
} from "./application/useCases";

// Infrastructure exports
export { ProductionBasinRepository } from "./infrastructure/repositories/productionBasinRepository";
