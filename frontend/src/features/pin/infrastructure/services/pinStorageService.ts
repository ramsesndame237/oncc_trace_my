import { db, type OfflinePinData } from "@/core/infrastructure/database/db";
import { PIN_CONFIG } from "../config/pinConfig";

// Utilitaires de chiffrement pour le stockage local
export class PinStorageService {
  // Map pour éviter les appels concurrents
  private static storageOperations = new Map<string, Promise<void>>();

  /**
   * Vérifie si Web Crypto API est disponible (nécessaire pour HTTPS)
   */
  private static isWebCryptoAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle !== undefined
    );
  }

  /**
   * Génère un UUID avec fallback pour compatibilité HTTP
   */
  private static generateUUID(): string {
    // Essayer d'utiliser crypto.randomUUID() si disponible
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      try {
        return crypto.randomUUID();
      } catch {
        console.warn(
          "crypto.randomUUID() non disponible, utilisation du fallback"
        );
      }
    }

    // Fallback: générer un UUID v4 manuellement
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Génère un salt aléatoire pour le chiffrement
   */
  private static generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  /**
   * Hash simple pour fallback en HTTP (NON SÉCURISÉ - uniquement pour tests)
   * @param input Chaîne à hasher
   * @returns Hash simple non sécurisé
   */
  private static simpleFallbackHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convertir en hex et padder pour ressembler à un hash
    return (
      Math.abs(hash).toString(16).padStart(16, "0") +
      input.length.toString(16).padStart(16, "0")
    );
  }

  /**
   * Chiffre un code PIN avec un salt
   * Utilise SHA-256 en HTTPS, hash simple en HTTP (non sécurisé)
   */
  private static async encryptPin(pin: string, salt: string): Promise<string> {
    // Si Web Crypto est disponible, utiliser SHA-256
    if (this.isWebCryptoAvailable()) {
      const encoder = new TextEncoder();
      const data = encoder.encode(pin + salt);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Fallback simple (NON SÉCURISÉ - uniquement pour les tests)
    // AVERTISSEMENT: Ne pas utiliser en production réelle
    console.warn(
      "⚠️ Web Crypto API non disponible. Utilisation d'un chiffrement simple (HTTP détecté). Pour la sécurité, utilisez HTTPS."
    );
    return this.simpleFallbackHash(pin + salt);
  }

  /**
   * Vérifie si un code PIN correspond au code chiffré stocké
   */
  private static async verifyPin(
    pin: string,
    encryptedPin: string,
    salt: string
  ): Promise<boolean> {
    const hashedInput = await this.encryptPin(pin, salt);
    return hashedInput === encryptedPin;
  }

  /**
   * Stocke un code PIN pour un utilisateur
   */
  static async storePinForUser(userId: string, pin: string): Promise<void> {
    // Vérifier s'il y a déjà une opération en cours pour cet utilisateur
    const existingOperation = this.storageOperations.get(userId);
    if (existingOperation) {
      console.log(
        "Opération de stockage déjà en cours pour l'utilisateur:",
        userId
      );
      return existingOperation;
    }

    // Créer une nouvelle opération
    const operation = this.performStorageOperation(userId, pin);
    this.storageOperations.set(userId, operation);

    try {
      await operation;
    } finally {
      // Nettoyer l'opération terminée
      this.storageOperations.delete(userId);
    }
  }

  /**
   * Effectue l'opération de stockage réelle
   */
  private static async performStorageOperation(
    userId: string,
    pin: string
  ): Promise<void> {
    try {
      // Générer un salt unique
      const salt = this.generateSalt();
      const encryptedPin = await this.encryptPin(pin, salt);

      // Supprimer tout PIN existant pour cet utilisateur
      await db.pins.where("userId").equals(userId).delete();

      // Créer le nouvel enregistrement PIN
      const pinData: OfflinePinData = {
        id: this.generateUUID(),
        userId,
        encryptedPin,
        salt,
        createdAt: new Date(),
        lastUsed: new Date(),
        failedAttempts: 0,
        isLocked: false,
      };

      await db.pins.add(pinData);
      console.log("PIN stocké avec succès pour l'utilisateur:", userId);
    } catch (error) {
      console.error("Erreur lors du stockage du PIN:", error);
      throw new Error("Impossible de stocker le code PIN");
    }
  }

  /**
   * Vérifie si un utilisateur a un code PIN défini
   */
  static async hasPinForUser(userId: string): Promise<boolean> {
    try {
      const pinData = await db.pins.where("userId").equals(userId).first();
      return !!pinData && !pinData.isLocked;
    } catch (error) {
      console.error("Erreur lors de la vérification du PIN:", error);
      return false;
    }
  }

  /**
   * Vérifie un code PIN pour un utilisateur
   */
  static async verifyPinForUser(
    userId: string,
    pin: string
  ): Promise<{
    success: boolean;
    error?: string;
    attemptsRemaining?: number;
  }> {
    try {
      const pinData = await db.pins.where("userId").equals(userId).first();

      if (!pinData) {
        return { success: false, error: "Aucun code PIN défini" };
      }

      // Vérifier si le compte est verrouillé
      if (pinData.isLocked && pinData.lockUntil) {
        if (new Date() < pinData.lockUntil) {
          const remainingMinutes = Math.ceil(
            (pinData.lockUntil.getTime() - new Date().getTime()) / (1000 * 60)
          );
          return {
            success: false,
            error: `Compte verrouillé pendant ${remainingMinutes} minute(s)`,
          };
        } else {
          // Déverrouiller le compte si la période est expirée
          await db.pins.update(pinData.id, {
            isLocked: false,
            failedAttempts: 0,
            lockUntil: undefined,
          });
          pinData.isLocked = false;
          pinData.failedAttempts = 0;
        }
      }

      // Vérifier le PIN
      const isValid = await this.verifyPin(
        pin,
        pinData.encryptedPin,
        pinData.salt
      );

      if (isValid) {
        // Réinitialiser les tentatives échouées et mettre à jour la dernière utilisation
        await db.pins.update(pinData.id, {
          failedAttempts: 0,
          lastUsed: new Date(),
          isLocked: false,
          lockUntil: undefined,
        });
        return { success: true };
      } else {
        // Incrémenter les tentatives échouées
        const newFailedAttempts = pinData.failedAttempts + 1;
        const shouldLock =
          newFailedAttempts >= PIN_CONFIG.security.maxFailedAttempts;

        const updateData: Partial<OfflinePinData> = {
          failedAttempts: newFailedAttempts,
        };

        if (shouldLock) {
          const lockUntil = new Date();
          lockUntil.setMinutes(
            lockUntil.getMinutes() + PIN_CONFIG.security.lockDurationMinutes
          );
          updateData.isLocked = true;
          updateData.lockUntil = lockUntil;
        }

        await db.pins.update(pinData.id, updateData);

        const attemptsRemaining =
          PIN_CONFIG.security.maxFailedAttempts - newFailedAttempts;
        return {
          success: false,
          error: shouldLock
            ? `Trop de tentatives échouées. Compte verrouillé pendant ${PIN_CONFIG.security.lockDurationMinutes} minutes.`
            : "Code PIN incorrect",
          attemptsRemaining: shouldLock ? 0 : attemptsRemaining,
        };
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du PIN:", error);
      return { success: false, error: "Erreur lors de la vérification" };
    }
  }

  /**
   * Supprime le code PIN d'un utilisateur
   */
  static async removePinForUser(userId: string): Promise<void> {
    try {
      await db.pins.where("userId").equals(userId).delete();
    } catch (error) {
      console.error("Erreur lors de la suppression du PIN:", error);
      throw new Error("Impossible de supprimer le code PIN");
    }
  }

  /**
   * Obtient les informations sur le code PIN d'un utilisateur (sans le PIN lui-même)
   */
  static async getPinInfoForUser(userId: string): Promise<{
    exists: boolean;
    isLocked: boolean;
    failedAttempts: number;
    lastUsed?: Date;
    lockUntil?: Date;
  }> {
    try {
      const pinData = await db.pins.where("userId").equals(userId).first();

      if (!pinData) {
        return {
          exists: false,
          isLocked: false,
          failedAttempts: 0,
        };
      }

      return {
        exists: true,
        isLocked: pinData.isLocked || false,
        failedAttempts: pinData.failedAttempts || 0,
        lastUsed: pinData.lastUsed,
        lockUntil: pinData.lockUntil,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des infos PIN:", error);
      return {
        exists: false,
        isLocked: false,
        failedAttempts: 0,
      };
    }
  }

  /**
   * Nettoie les codes PIN expirés (maintenance)
   */
  static async cleanupExpiredPins(maxAgeDays?: number): Promise<void> {
    const ageDays = maxAgeDays || PIN_CONFIG.maintenance.maxPinAgeDays;
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ageDays);

      await db.pins.where("lastUsed").below(cutoffDate).delete();
    } catch (error) {
      console.error("Erreur lors du nettoyage des PIN expirés:", error);
    }
  }
}
