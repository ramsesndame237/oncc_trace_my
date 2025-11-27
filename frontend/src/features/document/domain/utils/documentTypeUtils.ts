/**
 * Utilitaires pour les types de documents
 */

import {
  allDocumentTypes,
  documentTypeCategories,
  type DocumentType,
  type DocumentTypeCategory,
  type DocumentTypeValue,
} from "../constants/documentTypes";

/**
 * Récupère le label d'un type de document par sa valeur
 */
export function getDocumentTypeLabel(documentType: string): string {
  const documentOption = allDocumentTypes.find(
    (option) => option.value === documentType
  );

  return documentOption?.label || documentType || "Type inconnu";
}

/**
 * Récupère tous les types de documents disponibles
 */
export function getAllDocumentTypes(): readonly DocumentType[] {
  return allDocumentTypes;
}

/**
 * Récupère les types de documents par catégorie
 */
export function getDocumentTypesByCategory() {
  return documentTypeCategories;
}

/**
 * Récupère les types de documents d'une catégorie spécifique
 */
export function getDocumentTypesBySpecificCategory(
  category: DocumentTypeCategory
): readonly DocumentType[] {
  return documentTypeCategories[category];
}

/**
 * Vérifie si un type de document existe
 */
export function isValidDocumentType(documentType: string): boolean {
  return allDocumentTypes.some((option) => option.value === documentType);
}

/**
 * Récupère un type de document par sa valeur
 */
export function getDocumentTypeByValue(
  value: string
): DocumentType | undefined {
  return allDocumentTypes.find((option) => option.value === value);
}

// Export des types pour utilisation externe
export type { DocumentType, DocumentTypeCategory, DocumentTypeValue };
