import { del, get, set } from "idb-keyval";

/**
 * ⭐ Adaptateur IndexedDB pour Zustand persist - Version RAW (sans JSON.stringify)
 *
 * ⚠️ IMPORTANT: Cet adapter ne JSON.stringify PAS les données
 * Il laisse IndexedDB gérer la sérialisation nativement avec "structured clone"
 *
 * Pourquoi ? JSON.stringify() détruit les Blobs:
 * JSON.stringify(new Blob(['test'])) → "{}" ❌
 *
 * IndexedDB supporte nativement les Blobs grâce à l'algorithme "structured clone"
 */
export const indexedDBStorage = {
  /**
   * Récupère une valeur depuis IndexedDB (retourne l'objet directement, pas JSON)
   */
  getItem: async (name: string): Promise<unknown | null> => {
    // ⚠️ IndexedDB n'est disponible que côté client (navigateur)
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const value = await get(name);

      if (value === undefined) {
        return null;
      }

      // ⭐ Retourner l'objet directement (pas de JSON.stringify)
      // Zustand persist gère la désérialisation
      return value;
    } catch (error) {
      console.error("❌ IndexedDB getItem error:", error);
      return null;
    }
  },

  /**
   * Stocke une valeur dans IndexedDB (objet brut, pas JSON)
   */
  setItem: async (name: string, value: unknown): Promise<void> => {
    // ⚠️ IndexedDB n'est disponible que côté client (navigateur)
    if (typeof window === "undefined") {
      return;
    }

    try {
      // ⭐ Stocker l'objet directement (pas de JSON.parse)
      // IndexedDB utilise "structured clone" pour sérialiser les Blobs
      await set(name, value);

      console.log("✅ Données sauvegardées dans IndexedDB:", name);
    } catch (error) {
      console.error("❌ IndexedDB setItem error:", error);

      if (error instanceof Error && error.name === "QuotaExceededError") {
        console.warn("⚠️ Quota IndexedDB dépassé, impossible de sauvegarder");
      }
    }
  },

  /**
   * Supprime une valeur depuis IndexedDB
   */
  removeItem: async (name: string): Promise<void> => {
    // ⚠️ IndexedDB n'est disponible que côté client (navigateur)
    if (typeof window === "undefined") {
      return;
    }

    try {
      await del(name);
      console.log("🗑️ Données supprimées de IndexedDB:", name);
    } catch (error) {
      console.error("❌ IndexedDB removeItem error:", error);
    }
  },
};
