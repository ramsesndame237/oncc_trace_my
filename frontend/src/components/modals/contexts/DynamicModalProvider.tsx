"use client";

import React, { createContext, use } from "react";
import {
  registerContextProvider,
  type ContextProviderProps,
} from "./ContextRegistry";

// Interface ultra-minimaliste : JUSTE data
interface DynamicModalContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

const DynamicModalContext = createContext<DynamicModalContextType | null>(null);

/**
 * Provider ultra-pur : ZERO logique, ZERO ajout, tout vient de contextData
 */
export const DynamicModalProvider: React.FC<ContextProviderProps> = ({
  children,
  initialData = {},
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<Record<string, any>>(initialData);

  const updateData = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updates: Partial<Record<string, any>>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const dataWithUpdater = React.useMemo(
    () => ({
      ...data,
      _setData: updateData,
    }),
    [data, updateData]
  );

  const contextValue: DynamicModalContextType = {
    data: dataWithUpdater,
  };

  return (
    <DynamicModalContext.Provider value={contextValue}>
      {children}
    </DynamicModalContext.Provider>
  );
};

/**
 * Hook avec typage générique - Solution 1
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useModalContext = <T = Record<string, any>,>(): T => {
  const context = use(DynamicModalContext);
  if (!context) {
    throw new Error("useModalContext must be used within DynamicModalProvider");
  }
  return context.data as T;
};

// Enregistrement universel du provider
registerContextProvider("dynamic", DynamicModalProvider);
