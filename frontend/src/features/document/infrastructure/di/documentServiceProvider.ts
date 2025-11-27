import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import {
  GetDocumentsUseCase,
  SyncDocumentsUseCase,
  UploadDocumentFromBase64UseCase,
} from "../../application/useCases";
import { DocumentService } from "../services/documentService";

export class DocumentServiceProvider {
  static getGetDocumentsUseCase(): GetDocumentsUseCase {
    ensureDIConfigured();
    return container.resolve(GetDocumentsUseCase);
  }

  static getSyncDocumentsUseCase(): SyncDocumentsUseCase {
    ensureDIConfigured();
    return container.resolve(SyncDocumentsUseCase);
  }

  static getUploadDocumentFromBase64UseCase(): UploadDocumentFromBase64UseCase {
    ensureDIConfigured();
    return container.resolve(UploadDocumentFromBase64UseCase);
  }

  static getDocumentService(): DocumentService {
    ensureDIConfigured();
    return container.resolve(DocumentService);
  }
}
