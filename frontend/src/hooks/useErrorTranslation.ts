/**
 * Hook pour traduire les codes d'erreur et de succès
 */

'use client';

import { useTranslation } from 'react-i18next';
import { getErrorTranslationKey, getSuccessTranslationKey } from '@/i18n/utils/getErrorMessage';

/**
 * Hook pour traduire les codes d'erreur et de succès du backend
 * Utilise les fichiers errors.json et success.json
 *
 * @returns Fonctions de traduction
 */
export function useErrorTranslation() {
  const { t } = useTranslation(['errors', 'success']);

  /**
   * Traduit un code d'erreur
   *
   * @param code - Code d'erreur (ex: "AUTH_LOGIN_INVALID_CREDENTIALS")
   * @param fallback - Message de fallback si la traduction n'existe pas
   * @returns Message d'erreur traduit
   *
   * @example
   * ```tsx
   * const { translateError } = useErrorTranslation();
   * const message = translateError('AUTH_LOGIN_INVALID_CREDENTIALS');
   * // FR: "Identifiants invalides"
   * // EN: "Invalid credentials"
   * ```
   */
  const translateError = (code: string, fallback?: string): string => {
    const key = getErrorTranslationKey(code);
    const translation = t(key, { defaultValue: fallback || code });
    return translation;
  };

  /**
   * Traduit un code de succès
   *
   * @param code - Code de succès (ex: "USER_CREATED")
   * @param fallback - Message de fallback si la traduction n'existe pas
   * @returns Message de succès traduit
   *
   * @example
   * ```tsx
   * const { translateSuccess } = useErrorTranslation();
   * const message = translateSuccess('USER_CREATED');
   * // FR: "Utilisateur créé avec succès"
   * // EN: "User created successfully"
   * ```
   */
  const translateSuccess = (code: string, fallback?: string): string => {
    const key = getSuccessTranslationKey(code);
    const translation = t(key, { defaultValue: fallback || code });
    return translation;
  };

  return {
    translateError,
    translateSuccess,
  };
}
