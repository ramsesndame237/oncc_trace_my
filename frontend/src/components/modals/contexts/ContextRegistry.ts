import React, { createContext, useState } from "react";

// Interface pour les props des Context Providers
export interface ContextProviderProps {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any>;
}

// Type pour les providers de contexte
type ContextProvider = React.FC<ContextProviderProps>;

// Registry des context providers
const contextProviders = new Map<string, ContextProvider>();

/**
 * Enregistre un nouveau context provider
 */
export const registerContextProvider = (
  type: string,
  provider: ContextProvider
) => {
  contextProviders.set(type, provider);
};

/**
 * Récupère un context provider par son type
 */
export const getContextProvider = (type: string): ContextProvider => {
  return contextProviders.get(type) || GenericModalProvider;
};

// Contexte générique par défaut
const GenericModalContext = createContext<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState: React.Dispatch<React.SetStateAction<Record<string, any>>>;
} | null>(null);

/**
 * Provider générique par défaut pour les modals simples
 */
const GenericModalProvider: ContextProvider = ({
  children,
  initialData = {},
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<Record<string, any>>(initialData);

  return React.createElement(
    GenericModalContext.Provider,
    { value: { state, setState } },
    children
  );
};

// Enregistrement du provider générique
registerContextProvider("generic", GenericModalProvider);
