import type { IconName } from "@/components/icon";
import { dayjs } from "@/lib/dayjs";
import { IFileValue } from "@/types/type";
import { injectable } from "tsyringe";
import type { Document } from "../../domain/document.types";
import i18next from 'i18next';

@injectable()
export class DocumentService {
  /**
   * Formate la date de création d'un document
   */
  formatDate(dateString: string): string {
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
  }

  /**
   * Formate la taille du document
   */
  formatSize(size: number | null): string {
    if (!size) return i18next.t('document:messages.unknownSize' as never);

    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(1024));

    return `${(size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Détermine si le document peut être prévisualisé
   */
  canPreview(document: IFileValue): boolean {
    const previewableTypes = [
      // Images - formats spécifiques
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Images - format générique (temporaire pour compatibility)
      "image",
      // Documents
      "application/pdf",
      // Texte
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
    ];

    return document.type ? previewableTypes.includes(document.type) : false;
  }

  /**
   * Détermine si le document est une image
   */
  isImage(document: IFileValue): boolean {
    return document.type?.startsWith("image/") || false;
  }

  /**
   * Génère l'URL de téléchargement du document
   */
  getDownloadUrl(document: IFileValue): string {
    return `${process.env.NEXT_PUBLIC_API_URL}/documents/${document.id}/download`;
  }

  /**
   * Génère l'URL de prévisualisation du document
   */
  getPreviewUrl(document: IFileValue): string | null {
    if (!this.canPreview(document)) {
      return null;
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/documents/${document.id}/preview`;
  }

  /**
   * Obtient l'extension du fichier
   */
  getFileExtension(document: Document): string {
    return document.fileName.split(".").pop()?.toLowerCase() || "";
  }

  /**
   * Obtient l'icône appropriée selon le type de fichier
   */
  getFileIcon(document: IFileValue): IconName {
    if (this.isImage(document)) {
      return "Image";
    }

    if (document.type === "application/pdf") {
      return "FileText";
    }

    if (document.type?.includes("word")) {
      return "FileText";
    }

    if (
      document.type?.includes("excel") ||
      document.type?.includes("spreadsheet")
    ) {
      return "FileSpreadsheet";
    }

    return "File";
  }
}
