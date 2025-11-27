/**
 * Système de codes d'erreur standardisé pour l'API ONCC
 *
 * @deprecated Ce fichier est maintenu pour la compatibilité.
 * Utilisez les imports spécifiques depuis `./errors/` pour les nouveaux développements.
 */

// Re-export pour la compatibilité avec l'ancien système
export { ErrorCodes, ErrorMessages, SuccessCodes, SuccessMessages } from './errors/index.js'

// Export des domaines spécifiques pour les nouveaux développements
export * from './errors/index.js'
