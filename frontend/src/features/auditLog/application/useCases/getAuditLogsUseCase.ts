import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IAuditLogRepository } from "../../domain/IAuditLogRepository";
import type { AuditLogFilters, GetAuditLogsResult } from "../../domain/auditLog.types";

@injectable()
export class GetAuditLogsUseCase {
  constructor(
    @inject(DI_TOKENS.IAuditLogRepository)
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(filters: AuditLogFilters, isOnline: boolean): Promise<GetAuditLogsResult> {
    return this.auditLogRepository.getAll(filters, isOnline);
  }
}