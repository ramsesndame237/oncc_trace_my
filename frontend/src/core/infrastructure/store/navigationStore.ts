import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavigationState {
  returnPath: string | null;
  setReturnPath: (path: string) => void;
  getReturnPath: () => string | null;
  clearReturnPath: () => void;
}

/**
 * Store global pour gérer la navigation et les chemins de retour
 * Utilisé notamment pour sauvegarder la page d'origine avant d'aller au quick-menu
 */
export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      returnPath: null,

      setReturnPath: (path: string) => {
        set({ returnPath: path });
      },

      getReturnPath: () => {
        const path = get().returnPath;
        return path;
      },

      clearReturnPath: () => {
        set({ returnPath: null });
      },
    }),
    {
      name: "navigation-storage",
      version: 1,
    }
  )
);
