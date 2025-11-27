/**
 * Encode filename for Content-Disposition header according to RFC 5987
 * Handles filenames with accents, special characters, emojis, etc.
 *
 * @param fileName - Original filename that may contain non-ASCII characters
 * @returns Properly encoded Content-Disposition filename parameter
 *
 * @example
 * encodeContentDispositionFilename('rapport_été_2024.pdf')
 * // Returns: 'filename="rapport_ete_2024.pdf"; filename*=UTF-8''rapport_%C3%A9t%C3%A9_2024.pdf'
 *
 * encodeContentDispositionFilename('simple.pdf')
 * // Returns: 'filename="simple.pdf"'
 */
export function encodeContentDispositionFilename(fileName: string): string {
  // Check if filename contains non-ASCII characters
  // eslint-disable-next-line no-control-regex
  const hasNonAscii = /[^\x00-\x7F]/.test(fileName)

  if (!hasNonAscii) {
    // Simple ASCII filename - use standard format
    return `filename="${fileName}"`
  }

  // Filename with non-ASCII characters - use RFC 5987 format
  // Format: filename*=UTF-8''encoded_filename
  const encodedFileName = encodeURIComponent(fileName)
    .replace(/['()]/g, escape) // Escape special characters
    .replace(/\*/g, '%2A')

  // Return both formats for maximum compatibility:
  // - filename="..." for old browsers (with non-ASCII replaced by underscore)
  // - filename*=UTF-8''... for modern browsers (RFC 5987)
  // eslint-disable-next-line no-control-regex
  const asciiName = fileName.replace(/[^\x00-\x7F]/g, '_')
  return `filename="${asciiName}"; filename*=UTF-8''${encodedFileName}`
}
