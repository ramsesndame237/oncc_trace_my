import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { container } from "tsyringe";
import {
  AddProducerToOpaUseCase,
  AddProducersToOpaBulkUseCase,
  CreateActorUseCase,
  GetActorByIdUseCase,
  GetActorsUseCase,
  GetBuyerExportersUseCase,
  GetExporterBuyersUseCase,
  GetOpaProducersUseCase,
  GetProducerOpasUseCase,
  RemoveProducerFromOpaUseCase,
  SyncAllActorsUseCase,
  UpdateActorStatusUseCase,
  UpdateActorUseCase,
} from "../../application/useCases";
import { IActorRepository } from "../../domain/IActorRepository";

export class ActorServiceProvider {
  static getGetActorsUseCase(): GetActorsUseCase {
    ensureDIConfigured();
    return container.resolve(GetActorsUseCase);
  }

  static getGetActorByIdUseCase(): GetActorByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetActorByIdUseCase);
  }

  static getCreateActorUseCase(): CreateActorUseCase {
    ensureDIConfigured();
    return container.resolve(CreateActorUseCase);
  }

  static getUpdateActorUseCase(): UpdateActorUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateActorUseCase);
  }

  static getUpdateActorStatusUseCase(): UpdateActorStatusUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateActorStatusUseCase);
  }

  static getProducerOpasUseCase(): GetProducerOpasUseCase {
    ensureDIConfigured();
    return container.resolve(GetProducerOpasUseCase);
  }

  static getOpaProducersUseCase(): GetOpaProducersUseCase {
    ensureDIConfigured();
    return container.resolve(GetOpaProducersUseCase);
  }

  static getBuyerExportersUseCase(): GetBuyerExportersUseCase {
    ensureDIConfigured();
    return container.resolve(GetBuyerExportersUseCase);
  }

  static getExporterBuyersUseCase(): GetExporterBuyersUseCase {
    ensureDIConfigured();
    return container.resolve(GetExporterBuyersUseCase);
  }

  static getSyncAllActorsUseCase(): SyncAllActorsUseCase {
    ensureDIConfigured();
    return container.resolve(SyncAllActorsUseCase);
  }

  static getAddProducerToOpaUseCase(): AddProducerToOpaUseCase {
    ensureDIConfigured();
    return container.resolve(AddProducerToOpaUseCase);
  }

  static getAddProducersToOpaBulkUseCase(): AddProducersToOpaBulkUseCase {
    ensureDIConfigured();
    return container.resolve(AddProducersToOpaBulkUseCase);
  }

  static getRemoveProducerFromOpaUseCase(): RemoveProducerFromOpaUseCase {
    ensureDIConfigured();
    return container.resolve(RemoveProducerFromOpaUseCase);
  }

  static getRepository(): IActorRepository {
    ensureDIConfigured();
    return container.resolve<IActorRepository>(DI_TOKENS.IActorRepository);
  }
}
