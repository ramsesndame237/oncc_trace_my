/**
 * Utilitaires de validation et détection de types de fichiers
 * Basés sur les signatures de fichiers (magic numbers) pour garantir l'intégrité
 */

/**
 * Détecte le type MIME en analysant les signatures des fichiers (magic numbers)
 * Cette fonction est cruciale pour vérifier l'intégrité des fichiers base64
 */
export function detectMimeTypeFromBytes(bytes: Uint8Array, fallbackMimeType: string): string {
  // Si nous avons moins de 4 bytes, utiliser le fallback
  if (bytes.length < 4) {
    return fallbackMimeType;
  }

  // Convertir les premiers bytes en hex pour comparaison
  const header = Array.from(bytes.slice(0, 12))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Signatures des fichiers communs (magic numbers)
  const signatures: Record<string, string> = {
    // Images
    '89504e47': 'image/png',        // PNG signature
    'ffd8ffe0': 'image/jpeg',       // JPEG (JFIF)
    'ffd8ffe1': 'image/jpeg',       // JPEG (EXIF)
    'ffd8ffe2': 'image/jpeg',       // JPEG (Canon)
    'ffd8ffe3': 'image/jpeg',       // JPEG (Samsung)
    'ffd8ffe8': 'image/jpeg',       // JPEG (SPIFF)
    'ffd8ffed': 'image/jpeg',       // JPEG (PhotoShop)
    'ffd8ffee': 'image/jpeg',       // JPEG (Adobe)
    'ffd8ffdb': 'image/jpeg',       // JPEG (quantization table)
    '474946383761': 'image/gif',    // GIF87a
    '474946383961': 'image/gif',    // GIF89a
    '52494646': 'image/webp',       // WEBP (les 4 premiers bytes de RIFF)

    // Documents
    '25504446': 'application/pdf',  // PDF (%PDF)

    // Archives
    '504b0304': 'application/zip',  // ZIP
    '504b0506': 'application/zip',  // ZIP (empty)
    '504b0708': 'application/zip',  // ZIP (spanned)
  };

  // Vérifier les signatures exactes d'abord
  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (header.startsWith(signature)) {
      return mimeType;
    }
  }

  // Vérifications spéciales pour JPEG (commence par FFD8)
  if (header.startsWith('ffd8')) {
    return 'image/jpeg';
  }

  // Vérification pour WEBP (signature plus complexe)
  if (header.startsWith('52494646') && bytes.length >= 12) {
    const webpSignature = Array.from(bytes.slice(8, 12))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    if (webpSignature === '57454250') { // "WEBP"
      return 'image/webp';
    }
  }

  // Si aucune signature détectée, utiliser le type fallback
  return fallbackMimeType;
}

/**
 * Obtient l'extension de fichier appropriée pour un type MIME
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/json': 'json',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'text': 'txt'
  };

  return mimeToExt[mimeType] || 'bin';
}

/**
 * Convertit base64 en Uint8Array pour analyse des signatures
 */
export function base64ToBytes(base64Data: string): Uint8Array {
  // Retirer le préfixe data:type;base64, s'il existe
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  // Décoder base64
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Uint8Array(byteNumbers);
}

/**
 * Détecte et valide le type MIME d'un fichier base64
 * Retourne le type MIME détecté ou le fallback si non détecté
 */
export function detectAndValidateMimeType(base64Data: string, fallbackMimeType: string): string {
  try {
    const bytes = base64ToBytes(base64Data);
    return detectMimeTypeFromBytes(bytes, fallbackMimeType);
  } catch (error) {
    console.warn('Erreur lors de la détection du type MIME:', error);
    return fallbackMimeType;
  }
}

/**
 * Génère un nom de fichier avec l'extension appropriée
 */
export function generateFileName(originalName: string, detectedMimeType: string): string {
  const extension = getFileExtensionFromMimeType(detectedMimeType);
  const timestamp = Date.now();

  // Si le nom original contient déjà une extension
  if (originalName.includes('.')) {
    return originalName;
  }

  // Sinon, générer un nom avec extension et timestamp pour unicité
  const baseName = originalName || 'document';
  return `${baseName}_${timestamp}.${extension}`;
}