import {
  db,
  type OfflineConventionData,
} from "@/core/infrastructure/database/db";

/**
 * Service centralisé pour résoudre les IDs locaux vers serveur.
 *
 * Stratégie de résolution :
 * 1. Chercher dans les tables offline par localId
 * 2. Si trouvé avec serverId → retourner serverId
 * 3. Sinon, c'est probablement déjà un serverId → retourner tel quel
 *
 * ⚠️ NOTE IMPORTANTE :
 * - Les conventions sont maintenant dans une table séparée (db.conventions)
 * - Les calendriers sont maintenant dans une table séparée (db.calendars)
 */
export class IdResolutionService {
  /**
   * Résout un actorId (local ou serveur) vers serverId.
   */
  async resolveActorId(actorId: string): Promise<string> {
    // 2. Vérifier dans OfflineActorData par localId
    const actorByLocalId = await db.actors
      .where("localId")
      .equals(actorId)
      .first();

    if (actorByLocalId?.serverId) {
      return actorByLocalId.serverId; // Acteur déjà synchronisé
    }

    // 3. Sinon, c'est probablement déjà un serverId
    return actorId;
  }

  /**
   * Résout un conventionId (local ou serveur) vers serverId.
   * ⚠️ Les conventions sont maintenant dans db.conventions (table séparée)
   */
  async resolveConventionId(
    conventionId: string | undefined
  ): Promise<string | undefined> {
    if (!conventionId) return undefined;

    // 2. Chercher dans db.conventions par localId
    const conventionByLocalId = await db.conventions
      .where("localId")
      .equals(conventionId)
      .first();

    if (conventionByLocalId?.serverId) {
      return conventionByLocalId.serverId;
    }

    // 4. Sinon, retourner l'ID tel quel
    return conventionId;
  }

  /**
   * Résout un calendarId (local ou serveur) vers serverId.
   * ⚠️ Les calendriers sont maintenant dans db.calendars (table séparée)
   */
  async resolveCalendarId(
    calendarId: string | undefined
  ): Promise<string | undefined> {
    if (!calendarId) return undefined;

    // Chercher dans db.calendars par localId
    const calendarByLocalId = await db.calendars
      .where("localId")
      .equals(calendarId)
      .first();

    if (calendarByLocalId?.serverId) {
      return calendarByLocalId.serverId;
    }

    // 3. Chercher dans db.calendars par serverId
    const calendarByServerId = await db.calendars
      .where("serverId")
      .equals(calendarId)
      .first();

    if (calendarByServerId) {
      return calendarId; // C'est déjà un serverId
    }

    // 4. Sinon, retourner l'ID tel quel
    return calendarId;
  }

  /**
   * Recherche un acteur par id OU localId (stratégie OR).
   */
  async findActorByIdOrLocalId(idOrLocalId: string) {
    // Chercher par id
    let actor = await db.actors.where("id").equals(idOrLocalId).first();

    if (!actor) {
      // Chercher par localId
      actor = await db.actors.where("localId").equals(idOrLocalId).first();
    }

    return actor;
  }

  /**
   * Trouve une convention dans db.conventions par son ID (local ou serveur).
   * Retourne l'objet convention.
   * ⚠️ Les conventions sont maintenant dans db.conventions (table séparée)
   */
  async findConventionByIdOrLocalId(
    conventionId: string
  ): Promise<OfflineConventionData | null> {
    // 1. Chercher par localId
    const conventionByLocalId = await db.conventions
      .where("localId")
      .equals(conventionId)
      .first();

    if (conventionByLocalId) {
      return conventionByLocalId;
    }

    // 2. Chercher par serverId
    const conventionByServerId = await db.conventions
      .where("serverId")
      .equals(conventionId)
      .first();

    if (conventionByServerId) {
      return conventionByServerId;
    }

    return null;
  }
}

// Instance singleton
export const idResolutionService = new IdResolutionService();
