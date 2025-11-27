/**
 * Hook pour gérer la langue de l'application
 */

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@/i18n';

/**
 * Hook pour gérer le changement de langue
 * Persiste automatiquement dans localStorage
 *
 * @returns Fonctions et état pour la gestion de langue
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  /**
   * Langue actuelle de l'application
   */
  const currentLocale = i18n.language.split('-')[0] as Locale;

  /**
   * Change la langue de l'application
   * Persiste automatiquement dans localStorage
   *
   * @param locale - Nouvelle langue ('fr' ou 'en')
   */
  const changeLocale = async (locale: Locale) => {
    if (currentLocale === locale || isChanging) return;

    setIsChanging(true);

    try {
      await i18n.changeLanguage(locale);
      // La persistance dans localStorage est gérée automatiquement par i18next-browser-languagedetector
    } catch (error) {
      console.error('Erreur lors du changement de langue:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return {
    /**
     * Langue actuelle ('fr' ou 'en')
     */
    currentLocale,
    /**
     * Fonction pour changer de langue
     */
    changeLocale,
    /**
     * État du changement de langue en cours
     */
    isChanging,
  };
}
