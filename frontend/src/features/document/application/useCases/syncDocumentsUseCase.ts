import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IDocumentRepository } from "../../domain/IDocumentRepository";
import type { DocumentSyncData, DocumentSyncResult } from "../../domain/document.types";

@injectable()
export class SyncDocumentsUseCase {
  constructor(
    @inject(DI_TOKENS.IDocumentRepository)
    private documentRepository: IDocumentRepository
  ) {}

  /**
   * Synchronise les documents d'une entité (ajouter, conserver, supprimer)
   * @param data - Données de synchronisation
   * @param isOnline - Indique si l'application est en ligne
   */
  async execute(data: DocumentSyncData, isOnline: boolean): Promise<DocumentSyncResult> {
    return this.documentRepository.syncDocuments(data, isOnline);
  }
}
