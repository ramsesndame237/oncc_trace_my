import { getSession } from "next-auth/react";
import { inject, injectable } from "tsyringe";
import { usePinAuthStore } from "@/features/pin/infrastructure/store/pinAuthStore";
import { apiClient } from "../api/client";
import { DI_TOKENS } from "../di/tokens";
import { CheckUpdatesResponse } from "../types/api.type";
import { SyncService } from "./syncService";

/**
 * Service de polling pour vérifier les mises à jour du serveur
 * Vérifie périodiquement (toutes les 15 min) s'il y a des changements côté serveur
 * en utilisant un système de delta counts pour optimiser la synchronisation
 */
@injectable()
export class PollingService {
  private interval: NodeJS.Timeout | null = null;
  private isActive = false;
  private static readonly LAST_SYNC_KEY = "last_sync_time";
  private static readonly SYNC_COUNTS_KEY = "sync_counts";
  private static readonly LAST_USER_ID_KEY = "last_user_id";
  private userChangeCallbacks: Array<(oldUserId: string, newUserId: string) => Promise<void>> = [];

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService
  ) {}

  /**
   * Récupère la date de dernière synchronisation depuis le localStorage
   */
  private getLastSyncTime(): number {
    if (typeof window === "undefined") return 0;

    const stored = localStorage.getItem(PollingService.LAST_SYNC_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Sauvegarde la date de dernière synchronisation dans le localStorage
   */
  private setLastSyncTime(timestamp: number): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(PollingService.LAST_SYNC_KEY, timestamp.toString());
    console.log(
      `💾 Last sync time sauvegardé: ${new Date(timestamp).toISOString()}`
    );
  }

  /**
   * Récupère les counts de synchronisation depuis le localStorage
   */
  private getSyncCounts(): Record<string, number> {
    if (typeof window === "undefined") return {};

    const stored = localStorage.getItem(PollingService.SYNC_COUNTS_KEY);
    if (!stored) return {};

    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  /**
   * Sauvegarde les counts de synchronisation dans le localStorage
   */
  private setSyncCounts(counts: Record<string, number>): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      PollingService.SYNC_COUNTS_KEY,
      JSON.stringify(counts)
    );
  }

  /**
   * Obtient le count d'une entité spécifique (API publique pour les repositories)
   * @param entityType Type d'entité (ex: "locations", "campaigns")
   * @returns Nombre d'entités modifiées
   */
  public getEntityCount(entityType: string): number {
    const counts = this.getSyncCounts();
    return counts[entityType] || 0;
  }

  /**
   * Met à jour le count d'une entité spécifique (API publique pour les repositories)
   * @param entityType Type d'entité (ex: "locations", "campaigns")
   * @param count Nouveau count à sauvegarder
   */
  public setEntityCount(entityType: string, count: number): void {
    const counts = this.getSyncCounts();
    counts[entityType] = count;
    this.setSyncCounts(counts);
    console.log(`💾 Count mis à jour pour ${entityType}: ${count}`);
  }

  /**
   * Récupère l'ID du dernier utilisateur connecté (API publique pour les repositories)
   * @returns ID de l'utilisateur ou null si aucun
   */
  public getLastUserId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PollingService.LAST_USER_ID_KEY);
  }

  /**
   * Sauvegarde l'ID du dernier utilisateur connecté (API publique pour les repositories)
   * @param userId ID de l'utilisateur à sauvegarder
   */
  public setLastUserId(userId: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PollingService.LAST_USER_ID_KEY, userId);
    console.log(`💾 Last user ID sauvegardé: ${userId}`);
  }

  /**
   * Enregistre un callback qui sera appelé lors d'un changement d'utilisateur
   * @param callback Fonction à appeler avec (oldUserId, newUserId)
   */
  public onUserChange(callback: (oldUserId: string, newUserId: string) => Promise<void>): void {
    this.userChangeCallbacks.push(callback);
  }

  /**
   * Vérifie si l'utilisateur a changé et notifie les callbacks si nécessaire
   * @param currentUserId ID de l'utilisateur actuel
   * @returns true si changement détecté, false sinon
   */
  private async checkUserChange(currentUserId: string): Promise<boolean> {
    const lastUserId = this.getLastUserId();

    // Première connexion ou même utilisateur
    if (!lastUserId || lastUserId === currentUserId) {
      // Sauvegarder l'utilisateur si c'est la première fois
      if (!lastUserId) {
        this.setLastUserId(currentUserId);
      }
      return false;
    }

    // ⭐ CHANGEMENT D'UTILISATEUR DÉTECTÉ
    console.log(`🔄 Changement d'utilisateur détecté: ${lastUserId} → ${currentUserId}`);

    // Notifier tous les callbacks enregistrés
    console.log(`📢 Notification de ${this.userChangeCallbacks.length} callback(s)...`);
    for (const callback of this.userChangeCallbacks) {
      try {
        await callback(lastUserId, currentUserId);
      } catch (error) {
        console.error("❌ Erreur lors de l'exécution d'un callback de changement d'utilisateur:", error);
      }
    }

    // Sauvegarder le nouvel utilisateur
    this.setLastUserId(currentUserId);
    console.log(`✅ Changement d'utilisateur traité avec succès`);

    return true;
  }

  /**
   * Démarre le polling avec un intervalle fixe
   */
  start(): void {
    if (this.isActive) {
      console.log("📡 Polling déjà actif");
      return;
    }

    this.isActive = true;

    console.log("🚀 Démarrage du polling de synchronisation");

    // Premier check immédiat
    this.checkForUpdates();

    // Polling toutes les 15 minutes
    this.interval = setInterval(() => {
      this.checkForUpdates();
    }, 900000);
  }

  /**
   * Arrête le polling
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isActive = false;
    console.log("🛑 Polling arrêté");
  }

  /**
   * Vérifie s'il y a des mises à jour sur le serveur
   */
  private async checkForUpdates(): Promise<void> {
    if (!this.isActive || !navigator.onLine) {
      return;
    }

    // ⭐ Vérifier si le PIN est authentifié AVANT de faire des appels API
    const pinAuthState = usePinAuthStore.getState();
    if (!pinAuthState.authState) {
      console.log("⚠️ Polling ignoré: PIN non vérifié");
      return;
    }

    // ⭐ Vérifier si l'utilisateur est authentifié via NextAuth
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        console.log("⚠️ Polling ignoré: utilisateur non authentifié");
        return;
      }

      // Synchroniser le token avec l'apiClient si nécessaire
      if (apiClient.getToken() !== session.accessToken) {
        apiClient.handleSessionUpdate(session);
        console.log("🔄 Token synchronisé avec NextAuth dans le polling");
      }

      // ⭐ Vérifier si l'utilisateur a changé (avant de faire la requête)
      if (session.user?.id) {
        const userChanged = await this.checkUserChange(session.user.id);
        if (userChanged) {
          // Si l'utilisateur a changé, ne pas continuer la vérification de mises à jour
          // Les callbacks ont déjà nettoyé les données et lancé une sync initiale
          console.log("⏸️ Polling interrompu : changement d'utilisateur traité");
          return;
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la vérification de la session:", error);
      return;
    }

    try {
      const lastSync = this.getLastSyncTime();
      const params = new URLSearchParams({
        lastSync: lastSync.toString(),
      });

      const response = await apiClient.get<CheckUpdatesResponse>(
        `/sync/check-updates?${params.toString()}`
      );

      if (response.success && response.data) {
        const { hasUpdates, counts } = response.data;

        console.log(
          "🔄 Réponse de vérification des mises à jour:",
          response.data
        );

        if (hasUpdates) {
          console.log("📡 Mises à jour détectées:", {
            counts,
          });

          // ⭐ SAUVEGARDER LES COUNTS REÇUS DU SERVEUR
          if (counts && Object.keys(counts).length > 0) {
            this.setSyncCounts(counts);
            console.log("💾 Counts sauvegardés dans localStorage:", counts);
          }

          // Déclencher la synchronisation
          await this.triggerSync();

          // Sauvegarder la date de synchronisation réussie
          this.setLastSyncTime(Date.now());
        } else {
          console.log("👍 Aucune mise à jour disponible");
          // Pas de mises à jour, sauvegarder le serverTime pour usage ultérieur
          this.setLastSyncTime(response.data.serverTime || Date.now());
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la vérification des mises à jour:",
        error
      );
    }
  }

  /**
   * Déclenche la synchronisation en appelant tous les handlers enregistrés
   */
  private async triggerSync(): Promise<void> {
    console.log("🔄 Déclenchement de la synchronisation post-login");
    await this.syncService.forcePostLoginSync();
  }

  /**
   * Ajuste la fréquence selon l'état de l'application
   */
  adjustFrequency(state: "active" | "background" | "offline"): void {
    if (!this.isActive) return;

    // Arrêter le polling actuel
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    switch (state) {
      case "active":
        // Utilisateur actif : 15 minutes
        this.interval = setInterval(() => this.checkForUpdates(), 900000);
        console.log("📡 Polling ajusté : mode actif (15min)");
        break;

      case "background":
        // Arrière-plan : 30 minutes
        this.interval = setInterval(() => this.checkForUpdates(), 1800000);
        console.log("📡 Polling ajusté : mode arrière-plan (30min)");
        break;

      case "offline":
        // Arrêter le polling actuel
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
        console.log("📡 Polling arrêté : mode hors ligne");
        break;
    }
  }

  /**
   * Force une vérification immédiate
   */
  async forceCheck(): Promise<void> {
    console.log("🔄 Vérification forcée des mises à jour");
    await this.checkForUpdates();
  }

  /**
   * Obtient l'état du polling
   */
  getStatus(): {
    isActive: boolean;
    lastSyncTime: number;
    timeSinceLastSync: number;
  } {
    const lastSync = this.getLastSyncTime();
    return {
      isActive: this.isActive,
      lastSyncTime: lastSync,
      timeSinceLastSync: Date.now() - lastSync,
    };
  }
}
