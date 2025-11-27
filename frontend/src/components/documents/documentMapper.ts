/**
 * Mapper les codes de documents vers leurs noms lisibles
 */

import {
  complementDocument,
  landProveMentData,
  landProveMentData2,
  pictureData,
} from "@/features/actor/domain/constants";

// Créer un map unifié de tous les types de documents
const createDocumentMap = () => {
  const documentMap = new Map<string, string>();

  // Ajouter tous les types de documents du producteur
  pictureData.forEach((doc) => {
    documentMap.set(doc.value, doc.label);
  });

  // Ajouter tous les documents complémentaires
  complementDocument.forEach((doc) => {
    documentMap.set(doc.value, doc.label);
  });

  // Ajouter tous les documents de preuve foncière
  landProveMentData.forEach((doc) => {
    documentMap.set(doc.value, doc.label);
  });

  landProveMentData2.forEach((doc) => {
    documentMap.set(doc.value, doc.label);
  });

  return documentMap;
};

// Instance singleton du map
const documentTypeMap = createDocumentMap();

/**
 * Convertit un code de document en nom lisible
 * @param documentCode - Le code du document (ex: "producer_photo")
 * @returns Le nom lisible du document ou le code si non trouvé
 */
export const getDocumentDisplayName = (documentCode: string): string => {
  return documentTypeMap.get(documentCode) || documentCode;
};

/**
 * Vérifie si un code de document existe dans les types définis
 * @param documentCode - Le code du document à vérifier
 * @returns true si le code existe, false sinon
 */
export const isValidDocumentCode = (documentCode: string): boolean => {
  return documentTypeMap.has(documentCode);
};

/**
 * Obtient tous les types de documents disponibles
 * @returns Un tableau de tous les types de documents avec leur code et nom
 */
export const getAllDocumentTypes = () => {
  return Array.from(documentTypeMap.entries()).map(([value, label]) => ({
    value,
    label,
  }));
};
