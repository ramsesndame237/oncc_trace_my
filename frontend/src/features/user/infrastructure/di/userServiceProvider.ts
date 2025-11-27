import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import {
  CreateUserUseCase,
  GetUserByIdUseCase,
  GetUsersUseCase,
  ResetUserPasswordUseCase,
  UpdateSelfUseCase,
  UpdateUserStatusUseCase,
  UpdateUserUseCase,
} from "../../application/useCases";

export class UserServiceProvider {
  static getGetUsersUseCase(): GetUsersUseCase {
    ensureDIConfigured();
    return container.resolve(GetUsersUseCase);
  }

  static getGetUserByIdUseCase(): GetUserByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetUserByIdUseCase);
  }

  static getCreateUserUseCase(): CreateUserUseCase {
    ensureDIConfigured();
    return container.resolve(CreateUserUseCase);
  }

  static getUpdateUserUseCase(): UpdateUserUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateUserUseCase);
  }

  static getUpdateSelfUseCase(): UpdateSelfUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateSelfUseCase);
  }

  static getUpdateUserStatusUseCase(): UpdateUserStatusUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateUserStatusUseCase);
  }

  static getResetUserPasswordUseCase(): ResetUserPasswordUseCase {
    ensureDIConfigured();
    return container.resolve(ResetUserPasswordUseCase);
  }
}
