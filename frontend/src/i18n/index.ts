/**
 * Point d'entrée du module i18n
 * Exports publics pour l'utilisation dans l'application
 */

export { I18nProvider } from './provider';
export { default as i18n } from './client';
export { locales, defaultLocale, namespaces } from './config';
export type { Locale, Namespace } from './config';
export type { TranslateFn } from './types';
