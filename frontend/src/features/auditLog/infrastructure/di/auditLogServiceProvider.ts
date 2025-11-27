import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import { GetAuditLogsUseCase } from "../../application/useCases";
import { AuditLogService } from "../services/auditLogService";

export class AuditLogServiceProvider {
  static getGetAuditLogsUseCase(): GetAuditLogsUseCase {
    ensureDIConfigured();
    return container.resolve(GetAuditLogsUseCase);
  }

  static getAuditLogService(): AuditLogService {
    ensureDIConfigured();
    return container.resolve(AuditLogService);
  }
}
