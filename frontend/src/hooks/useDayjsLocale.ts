/**
 * Hook pour synchroniser dayjs avec la langue i18next
 */

"use client";

import { dayjs } from "@/lib/dayjs";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hook pour synchroniser dayjs avec la langue de l'application
 * Change automatiquement la locale de dayjs quand la langue i18next change
 *
 * @returns Instance dayjs configurée
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const dayjs = useDayjsLocale();
 *
 *   return (
 *     <div>
 *       {dayjs().format('LL')}  // FR: "22 octobre 2025" | EN: "October 22, 2025"
 *     </div>
 *   );
 * }
 * ```
 */
export function useDayjsLocale() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Extraire la langue sans le code pays (fr-FR → fr)
    const currentLang = i18n.language.split("-")[0];

    // Changer la locale dayjs
    dayjs.locale(currentLang);
  }, [i18n.language]);

  return dayjs;
}
