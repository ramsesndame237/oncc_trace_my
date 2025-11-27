import AuditLog from '#models/audit_log'
import { ErrorCodes, SuccessCodes } from '#types/errors/index'
import { ApiResponse } from '#utils/api_response'
import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

export default class AuditLogsController {
  /**
   * Récupère l'historique d'audit avec pagination pour une entité donnée
   */
  async index({ request, response }: HttpContext) {
    try {
      // Validation des paramètres
      const payload = await request.validateUsing(
        vine.compile(
          vine.object({
            auditable_type: vine.string().trim().minLength(1),
            auditable_id: vine.string().trim().minLength(1),
            page: vine.number().min(1).optional(),
            limit: vine.number().min(1).max(100).optional(),
          })
        )
      )

      const {
        auditable_type: auditableType,
        auditable_id: auditableId,
        page = 1,
        limit = 20,
      } = payload

      // Récupération de l'historique avec pagination
      const paginatedLogs = await AuditLog.getHistoryWithPagination(
        auditableType,
        auditableId,
        page,
        limit
      )

      // Utiliser serialize comme dans users_controller
      const serializedData = paginatedLogs.serialize({
        relations: {
          user: {
            fields: {
              omit: [
                'passwordHash',
                'securityAnswer1Hash',
                'securityAnswer2Hash',
                'securityAnswer3Hash',
              ],
            },
          },
        },
      })

      // Ajouter les champs calculés aux données sérialisées
      serializedData.data = serializedData.data.map((logData: any, index: number) => {
        const log = paginatedLogs.all()[index]
        return {
          ...logData,
          formatted_action: log.getFormattedAction(),
          changed_fields: log.getChangedFields(),
        }
      })

      return ApiResponse.success(response, SuccessCodes.AUDIT_LOG_LIST_SUCCESS, serializedData)
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique d'audit:", error)

      if (error.status === 422) {
        return ApiResponse.fromException(response, error, ErrorCodes.VALIDATION_FAILED)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.AUDIT_LOG_LIST_FAILED)
    }
  }

  /**
   * Récupère les détails d'un log d'audit spécifique
   */
  async show({ params, response }: HttpContext) {
    try {
      const auditLog = await AuditLog.query().where('id', params.id).preload('user').firstOrFail()

      // Utiliser serialize comme dans l'index
      const serializedData = auditLog.serialize({
        relations: {
          user: {
            fields: {
              omit: [
                'passwordHash',
                'securityAnswer1Hash',
                'securityAnswer2Hash',
                'securityAnswer3Hash',
              ],
            },
          },
        },
      })

      // Ajouter les champs calculés
      const responseData = {
        ...serializedData,
        formatted_action: auditLog.getFormattedAction(),
        changed_fields: auditLog.getChangedFields(),
      }

      return ApiResponse.success(response, SuccessCodes.AUDIT_LOG_DETAILS_SUCCESS, responseData)
    } catch (error) {
      console.error("Erreur lors de la récupération du log d'audit:", error)

      if (error.code === 'E_ROW_NOT_FOUND') {
        return ApiResponse.error(response, ErrorCodes.AUDIT_LOG_NOT_FOUND, 404)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.AUDIT_LOG_DETAILS_FAILED)
    }
  }

  /**
   * Récupère les statistiques des actions d'audit pour une entité
   */
  async stats({ request, response }: HttpContext) {
    try {
      // Validation des paramètres
      const payload = await request.validateUsing(
        vine.compile(
          vine.object({
            auditable_type: vine.string().trim().minLength(1),
            auditable_id: vine.string().trim().minLength(1),
          })
        )
      )

      const { auditable_type: auditableType, auditable_id: auditableId } = payload

      // Récupération des statistiques
      const stats = await AuditLog.query()
        .where('auditable_type', auditableType)
        .where('auditable_id', auditableId)
        .select('action')
        .count('* as total')
        .groupBy('action')

      const totalLogs = await AuditLog.query()
        .where('auditable_type', auditableType)
        .where('auditable_id', auditableId)
        .count('* as total')

      // Créer une map pour les actions formatées
      const actionMap: Record<string, string> = {
        create: 'Création',
        update: 'Modification',
        delete: 'Suppression',
        validate: 'Validation',
        reject: 'Rejet',
        activate: 'Activation',
        deactivate: 'Désactivation',
        admin_info_update: 'Mise à jour des informations admin',
        admin_password_reset: 'Réinitialisation du mot de passe admin',
        add_parcel: 'Ajout de parcelle',
        add_document: 'Ajout de document',
      }

      return ApiResponse.success(response, SuccessCodes.AUDIT_LOG_STATS_SUCCESS, {
        total_logs: totalLogs.length > 0 ? Number(totalLogs[0].$extras.total) : 0,
        actions_stats: stats.map((stat: any) => ({
          action: stat.action,
          formatted_action: actionMap[stat.action] || stat.action,
          count: Number(stat.$extras.total),
        })),
      })
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques d'audit:", error)

      if (error.status === 422) {
        return ApiResponse.fromException(response, error, ErrorCodes.VALIDATION_FAILED)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.AUDIT_LOG_STATS_FAILED)
    }
  }
}
