import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import {
  base64ToBytes,
  detectAndValidateMimeType,
  generateFileName,
} from "../../domain";
import type { Document } from "../../domain/document.types";
import type { IDocumentRepository } from "../../domain/IDocumentRepository";

export interface UploadDocumentFromBase64Request {
  base64Data: string;
  mimeType: string;
  originalName?: string;
  documentableType: string;
  documentableId: string;
  documentType?: string;
  optionValues?: string[];
}

export interface UploadDocumentFromBase64Response {
  document: Document;
}

@injectable()
export class UploadDocumentFromBase64UseCase {
  constructor(
    @inject(DI_TOKENS.IDocumentRepository)
    private readonly documentRepository: IDocumentRepository
  ) {}

  async execute(
    request: UploadDocumentFromBase64Request,
    isOnline: boolean = true
  ): Promise<UploadDocumentFromBase64Response> {
    // Convertir base64 en File
    const file = this.base64ToFile(
      request.base64Data,
      request.mimeType,
      request.originalName || "document"
    );

    const document = await this.documentRepository.uploadDocument(
      {
        file,
        documentableType: request.documentableType,
        documentableId: request.documentableId,
        documentType: request.documentType,
        optionValues: request.optionValues,
      },
      isOnline
    );

    return {
      document,
    };
  }

  /**
   * Convertit base64 en File avec validation du type MIME
   */
  private base64ToFile(
    base64Data: string,
    mimeType: string,
    filename: string
  ): File {
    // Détecter et valider le type MIME à partir de la signature du fichier
    const detectedMimeType = detectAndValidateMimeType(base64Data, mimeType);

    // Utiliser le type MIME détecté pour garantir la cohérence
    const finalMimeType = detectedMimeType;

    // Convertir base64 en bytes
    const byteArray = base64ToBytes(base64Data);

    // Générer un nom de fichier avec l'extension appropriée
    const finalFilename = generateFileName(filename, finalMimeType);

    // Créer le File object avec le type MIME validé
    return new File([new Uint8Array(byteArray)], finalFilename, {
      type: finalMimeType,
    });
  }
}
