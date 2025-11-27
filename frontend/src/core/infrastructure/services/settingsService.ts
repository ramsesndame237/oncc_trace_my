import {
  db,
  type ActiveCampaignData,
  type OfflineSettingsData,
} from "../database/db";

/**
 * Clés de paramètres constantes pour l'application
 */
export const SETTINGS_KEYS = {
  ACTIVE_CAMPAIGN: "activeCampaign",
} as const;

/**
 * Service pour gérer les paramètres de l'application stockés en local
 */
export class SettingsService {
  /**
   * Récupère un paramètre par sa clé
   */
  public static async getSetting(key: string): Promise<string | null> {
    try {
      const setting = await db.settings.where("key").equals(key).first();
      return setting?.value || null;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du paramètre ${key}:`,
        error
      );
      return null;
    }
  }

  /**
   * Sauvegarde ou met à jour un paramètre
   */
  public static async setSetting(key: string, value: string): Promise<void> {
    try {
      const existingSetting = await db.settings
        .where("key")
        .equals(key)
        .first();

      if (existingSetting) {
        // Mettre à jour le paramètre existant
        await db.settings.update(existingSetting.id!, {
          value,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Créer un nouveau paramètre
        await db.settings.add({
          key,
          value,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du paramètre ${key}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un paramètre
   */
  public static async deleteSetting(key: string): Promise<void> {
    try {
      const setting = await db.settings.where("key").equals(key).first();
      if (setting) {
        await db.settings.delete(setting.id!);
      }
    } catch (error) {
      console.error(
        `Erreur lors de la suppression du paramètre ${key}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Récupère la campagne active stockée localement
   */
  public static async getActiveCampaign(): Promise<ActiveCampaignData | null> {
    try {
      const campaignData = await this.getSetting(SETTINGS_KEYS.ACTIVE_CAMPAIGN);
      if (campaignData) {
        return JSON.parse(campaignData) as ActiveCampaignData;
      }
      return null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la campagne active:",
        error
      );
      return null;
    }
  }

  /**
   * Sauvegarde la campagne active en local
   */
  public static async setActiveCampaign(
    campaign: ActiveCampaignData
  ): Promise<void> {
    try {
      await this.setSetting(
        SETTINGS_KEYS.ACTIVE_CAMPAIGN,
        JSON.stringify(campaign)
      );
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde de la campagne active:",
        error
      );
      throw error;
    }
  }

  /**
   * Supprime la campagne active stockée localement
   */
  public static async clearActiveCampaign(): Promise<void> {
    try {
      await this.deleteSetting(SETTINGS_KEYS.ACTIVE_CAMPAIGN);
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de la campagne active:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère tous les paramètres
   */
  public static async getAllSettings(): Promise<OfflineSettingsData[]> {
    try {
      return await db.settings.toArray();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de tous les paramètres:",
        error
      );
      return [];
    }
  }
}
