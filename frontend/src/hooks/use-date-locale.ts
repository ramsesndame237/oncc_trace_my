/**
 * Hook personnalisé pour obtenir la locale date-fns basée sur la langue i18next
 */

import { enUS, fr, Locale } from "date-fns/locale";
import { useTranslation } from "react-i18next";

/**
 * Hook qui retourne la locale date-fns appropriée
 * en fonction de la langue actuelle de i18next
 */
export const useDateLocale = (locale?: string): Locale => {
  const { i18n } = useTranslation();
  const currentLanguage = locale || i18n.language;

  // Map des langues i18next vers les locales date-fns
  const localeMap: Record<string, Locale> = {
    fr: fr,
    en: enUS,
  };

  // Retourner la locale correspondante ou français par défaut
  return localeMap[currentLanguage] || fr;
};
