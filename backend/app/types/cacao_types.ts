/**
 * Types pour les qualités et standards de cacao
 *
 * Ces types sont utilisés pour la génération automatique de types frontend
 * via le script generate-cacao-types.ts
 */

/**
 * Qualités de produit cacao
 */
export const PRODUCT_QUALITIES = ['grade_1', 'grade_2', 'hs'] as const

export type ProductQuality = (typeof PRODUCT_QUALITIES)[number]

/**
 * Standards de cacao
 */
export const PRODUCT_STANDARDS = ['certifie', 'excellent', 'fin', 'conventionnel'] as const

export type ProductStandard = (typeof PRODUCT_STANDARDS)[number]

/**
 * Array pour itération - Qualités
 */
export const PRODUCT_QUALITIES_ARRAY: readonly ProductQuality[] = PRODUCT_QUALITIES

/**
 * Array pour itération - Standards
 */
export const PRODUCT_STANDARDS_ARRAY: readonly ProductStandard[] = PRODUCT_STANDARDS

/**
 * Labels d'affichage pour les qualités (français)
 */
export const PRODUCT_QUALITY_LABELS: Record<ProductQuality, string> = {
  grade_1: 'Grade 1',
  grade_2: 'Grade 2',
  hs: 'Hors Standards (HS)',
}

/**
 * Labels d'affichage pour les standards (français)
 */
export const PRODUCT_STANDARD_LABELS: Record<ProductStandard, string> = {
  certifie: 'Certifié',
  excellent: 'Excellent',
  fin: 'Fin',
  conventionnel: 'Conventionnel',
}
