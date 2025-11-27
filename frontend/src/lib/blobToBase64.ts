/**
 * Convertit un Blob en chaîne base64
 * Utilisé pour préparer les documents avant upload au serveur
 *
 * @param blob - Le Blob ou File à convertir
 * @returns Promise<string> - La chaîne base64 au format data:mime/type;base64,...
 *
 * @example
 * const blob = new Blob([pdfData], { type: 'application/pdf' });
 * const base64 = await blobToBase64(blob);
 * // Résultat: "data:application/pdf;base64,JVBERi0xLjQK..."
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading blob'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Convertit un Blob en base64 en extrayant uniquement la partie data (sans le préfixe data:mime/type;base64,)
 *
 * @param blob - Le Blob ou File à convertir
 * @returns Promise<string> - La chaîne base64 pure sans préfixe
 *
 * @example
 * const blob = new Blob([pdfData], { type: 'application/pdf' });
 * const base64 = await blobToBase64Pure(blob);
 * // Résultat: "JVBERi0xLjQK..."
 */
export async function blobToBase64Pure(blob: Blob): Promise<string> {
  const base64WithPrefix = await blobToBase64(blob);
  // Extraire la partie après "base64,"
  const base64Pure = base64WithPrefix.split(',')[1] || base64WithPrefix;
  return base64Pure;
}
