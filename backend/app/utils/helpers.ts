import { randomBytes } from 'node:crypto'

/**
 * Génère un code OTP à 6 chiffres
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Génère un UUID v4 simple
 */
export function generateUUID(): string {
  return randomBytes(16)
    .toString('hex')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

/**
 * Normalise une chaîne pour la comparaison (supprime accents, espaces, etc.)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
}

/**
 * Valide un format d'email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un numéro de téléphone camerounais
 */
export function isValidCameroonPhone(phone: string): boolean {
  // Format: +237XXXXXXXXX ou 6XXXXXXXX ou 2XXXXXXXX
  const phoneRegex = /^(\+237)?[62]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Formate un numéro de téléphone camerounais
 */
export function formatCameroonPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '').replace(/^\+237/, '')
  if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('2'))) {
    return `+237${cleaned}`
  }
  return phone
}
