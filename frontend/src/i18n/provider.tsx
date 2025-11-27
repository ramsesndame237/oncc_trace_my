/**
 * Provider i18n pour ONCC-V1
 * Enveloppe l'application avec le contexte de traduction
 */

'use client';

import { useDayjsLocale } from '@/hooks/useDayjsLocale';
import { I18nextProvider } from 'react-i18next';
import i18n from './client';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * Composant interne qui synchronise dayjs avec i18next
 */
function LocaleSynchronizer({ children }: { children: React.ReactNode }) {
  // Synchroniser dayjs avec la langue i18next
  useDayjsLocale();

  return <>{children}</>;
}

/**
 * Provider de traduction i18next
 * À placer au niveau racine de l'application
 */
export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleSynchronizer>{children}</LocaleSynchronizer>
    </I18nextProvider>
  );
}
