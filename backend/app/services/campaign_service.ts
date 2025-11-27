import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import { CampaignErrorCodes } from '#types/errors/campaign'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class CampaignService {
  /**
   * Crée une nouvelle campagne avec validation de non-chevauchement et génération de code unique avec audit log.
   * @param data - Contient les dates de début/fin.
   * @param auditContext - Contexte pour l'audit log (optionnel).
   * @returns La campagne nouvellement créée.
   */
  async create(
    data: { startDate: DateTime | Date; endDate: DateTime | Date },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Campaign> {
    let { startDate, endDate } = data

    // S'assurer que nous travaillons avec des objets DateTime
    if (startDate instanceof Date) {
      startDate = DateTime.fromJSDate(startDate)
    } else if (typeof startDate === 'string') {
      startDate = DateTime.fromISO(startDate)
    }

    if (endDate instanceof Date) {
      endDate = DateTime.fromJSDate(endDate)
    } else if (typeof endDate === 'string') {
      endDate = DateTime.fromISO(endDate)
    }

    if (!startDate.isValid || !endDate.isValid) {
      throw new Exception('Invalid date format provided.', { status: 422 })
    }

    const sqlStartDate = startDate.toSQLDate()!
    const sqlEndDate = endDate.toSQLDate()!

    // 1. Valider le chevauchement des dates
    const overlappingCampaign = await Campaign.query()
      .where((query) => {
        query
          .whereBetween('startDate', [sqlStartDate, sqlEndDate])
          .orWhereBetween('endDate', [sqlStartDate, sqlEndDate])
          .orWhere((subQuery) => {
            subQuery.where('startDate', '<=', sqlStartDate).andWhere('endDate', '>=', sqlEndDate)
          })
      })
      .first()

    if (overlappingCampaign) {
      throw new Exception(
        `Impossible de créer la campagne. Les dates se chevauchent avec la campagne "${overlappingCampaign.code}" (${overlappingCampaign.startDate.toFormat('dd/MM/yyyy')} - ${overlappingCampaign.endDate.toFormat('dd/MM/yyyy')}). Veuillez désactiver ou supprimer la campagne existante ou choisir des dates différentes.`,
        {
          code: CampaignErrorCodes.CAMPAIGN_OVERLAP,
          status: 409,
        }
      )
    }

    // 2. Générer le code unique de la campagne
    const code = await this.generateUniqueCode(startDate, endDate)

    // 3. Créer la campagne
    const campaign = await Campaign.create({
      code,
      startDate,
      endDate,
      status: 'inactive', // Par défaut, une nouvelle campagne est inactive
    })

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Campaign',
          auditableId: campaign.id,
          action: 'create',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: null,
          newValues: {
            code: campaign.code,
            startDate: campaign.startDate.toISO(),
            endDate: campaign.endDate.toISO(),
            status: campaign.status,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return campaign
  }

  /**
   * Active une campagne et désactive l'ancienne campagne active.
   * @param campaignId - L'ID de la campagne à activer.
   * @returns La campagne activée.
   */
  async activate(campaignId: string): Promise<Campaign> {
    const campaignToActivate = await Campaign.findOrFail(campaignId)

    try {
      const campaign = await db.transaction(async (trx) => {
        // Mettre la campagne en transaction
        campaignToActivate.useTransaction(trx)

        // 1. Trouver et désactiver la campagne actuellement active (s'il y en a une)
        const currentActive = await Campaign.query({ client: trx })
          .where('status', 'active')
          .andWhereNot('id', campaignId)
          .first()

        if (currentActive) {
          currentActive.useTransaction(trx)
          currentActive.status = 'inactive'
          await currentActive.save()
        }

        // 2. Activer la nouvelle campagne
        campaignToActivate.status = 'active'
        await campaignToActivate.save()

        return campaignToActivate
      })
      return campaign
    } catch (error) {
      throw new Exception("Échec de l'activation de la campagne.", {
        code: CampaignErrorCodes.CAMPAIGN_ACTIVATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Désactive une campagne spécifique.
   * @param campaignId - L'ID de la campagne à désactiver.
   * @returns La campagne désactivée.
   */
  async deactivate(campaignId: string): Promise<Campaign> {
    const campaignToDeactivate = await Campaign.findOrFail(campaignId)

    // Vérifier que la campagne est actuellement active
    if (campaignToDeactivate.status !== 'active') {
      throw new Exception('La campagne est déjà inactive.', {
        code: CampaignErrorCodes.CAMPAIGN_DEACTIVATION_FAILED,
        status: 409,
      })
    }

    // Vérifier qu'il y a plus d'une campagne dans le système
    const totalCampaigns = await Campaign.query().count('* as total')
    const campaignCount = Number(totalCampaigns[0].$extras.total)

    if (campaignCount <= 1) {
      throw new Exception(
        'Vous ne pouvez pas désactiver cette campagne car elle est la seule campagne présente dans le système.',
        {
          code: CampaignErrorCodes.CAMPAIGN_DEACTIVATION_NOT_ALLOWED,
          status: 422,
        }
      )
    }

    try {
      campaignToDeactivate.status = 'inactive'
      await campaignToDeactivate.save()
      return campaignToDeactivate
    } catch (error) {
      throw new Exception('Échec de la désactivation de la campagne.', {
        code: CampaignErrorCodes.CAMPAIGN_DEACTIVATION_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Met à jour une campagne existante avec validation de non-chevauchement.
   * @param campaignId - L'ID de la campagne à mettre à jour.
   * @param data - Contient les nouveaux données de la campagne.
   * @returns La campagne mise à jour.
   */
  async update(
    campaignId: string,
    data: { startDate?: DateTime | Date; endDate?: DateTime | Date }
  ): Promise<Campaign> {
    const campaign = await Campaign.findOrFail(campaignId)

    let { startDate, endDate } = data

    // Si des dates sont fournies, les valider
    if (startDate || endDate) {
      // Utiliser les dates existantes si les nouvelles ne sont pas fournies
      const newStartDate = startDate
        ? startDate instanceof Date
          ? DateTime.fromJSDate(startDate)
          : startDate
        : campaign.startDate
      const newEndDate = endDate
        ? endDate instanceof Date
          ? DateTime.fromJSDate(endDate)
          : endDate
        : campaign.endDate

      if (!newStartDate.isValid || !newEndDate.isValid) {
        throw new Exception('Invalid date format provided.', { status: 422 })
      }

      const sqlStartDate = newStartDate.toSQLDate()!
      const sqlEndDate = newEndDate.toSQLDate()!

      // Valider le chevauchement avec d'autres campagnes (exclure la campagne actuelle)
      const overlappingCampaign = await Campaign.query()
        .whereNot('id', campaignId)
        .where((query) => {
          query
            .whereBetween('startDate', [sqlStartDate, sqlEndDate])
            .orWhereBetween('endDate', [sqlStartDate, sqlEndDate])
            .orWhere((subQuery) => {
              subQuery.where('startDate', '<=', sqlStartDate).andWhere('endDate', '>=', sqlEndDate)
            })
        })
        .first()

      if (overlappingCampaign) {
        throw new Exception('Les dates se chevauchent avec une campagne existante.', {
          code: CampaignErrorCodes.CAMPAIGN_OVERLAP,
          status: 409,
        })
      }

      // Mettre à jour les dates
      if (startDate) campaign.startDate = newStartDate
      if (endDate) campaign.endDate = newEndDate
    }

    try {
      await campaign.save()
      return campaign
    } catch (error) {
      throw new Exception('Impossible de mettre à jour la campagne.', {
        code: CampaignErrorCodes.CAMPAIGN_UPDATE_FAILED,
        status: 500,
        cause: error,
      })
    }
  }

  /**
   * Génère un code de campagne unique basé sur les années de début et de fin.
   * Ex: 2023-2024. Si le code existe, ajoute un suffixe numérique (2023-2024-1).
   * Si les dates sont dans la même année, utilise annee-1 comme année de début.
   */
  private async generateUniqueCode(startDate: DateTime, endDate: DateTime): Promise<string> {
    let startYear = startDate.year
    const endYear = endDate.year

    if (startYear === endYear) {
      startYear = startYear - 1
    }

    const baseCode = `${startYear}-${endYear}`
    let finalCode = baseCode
    let suffix = 0

    while (true) {
      const existing = await Campaign.query().where('code', finalCode).first()
      if (!existing) {
        break
      }
      suffix++
      finalCode = `${baseCode}-${suffix}`
    }

    return finalCode
  }
}
