import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IDocumentRepository } from "../../domain/IDocumentRepository";
import type { DocumentFilters, GetDocumentsResult } from "../../domain/document.types";

@injectable()
export class GetDocumentsUseCase {
  constructor(
    @inject(DI_TOKENS.IDocumentRepository)
    private documentRepository: IDocumentRepository
  ) {}

  async execute(filters: DocumentFilters, isOnline: boolean): Promise<GetDocumentsResult> {
    return this.documentRepository.getAll(filters, isOnline);
  }
}