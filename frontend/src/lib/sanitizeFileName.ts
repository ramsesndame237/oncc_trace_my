/**
 * Sanitize filename by removing accents and special characters
 * while preserving the file extension
 *
 * @param fileName - Original filename that may contain accents, spaces, special chars
 * @returns Sanitized filename safe for HTTP headers and file systems
 *
 * @example
 * sanitizeFileName('rapport_été_2024.pdf')
 * // Returns: 'rapport_ete_2024.pdf'
 *
 * sanitizeFileName('Facture François & Müller.docx')
 * // Returns: 'Facture_Francois_Muller.docx'
 *
 * sanitizeFileName('photo 🎉 célébration.jpg')
 * // Returns: 'photo_celebration.jpg'
 */
export function sanitizeFileName(fileName: string): string {
  // Split filename and extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  // Normalize accents: é → e, à → a, ü → u, etc.
  const normalized = name
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  // Replace special characters and spaces with underscores
  const sanitized = normalized
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

  // Sanitize extension too (remove any special chars)
  const sanitizedExtension = extension
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase();

  return sanitized + sanitizedExtension;
}

/**
 * Create a new File object with a sanitized filename
 *
 * @param file - Original File object
 * @returns New File object with sanitized name
 */
export function createSanitizedFile(file: File): File {
  const sanitizedName = sanitizeFileName(file.name);
  return new File([file], sanitizedName, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
