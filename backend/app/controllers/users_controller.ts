import User from '#models/user'
import ProductionBasinService from '#services/production_basin_service'
import UserService from '#services/user_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import { registerValidator } from '#validators/auth'
import { updateActorManagerValidator, updateUserInfoValidator } from '#validators/user_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UsersController {
  constructor(
    protected userService: UserService,
    protected productionBasinService: ProductionBasinService
  ) {}
  /**
   * Lister tous les utilisateurs (avec pagination et filtres)
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const role = request.input('role')
      const status = request.input('status')
      const bassinId = request.input('bassinId')
      const search = request.input('search')

      const query = User.query()

      // Filtrage basé sur le rôle de l'utilisateur connecté
      if (authUser.role === 'basin_admin') {
        // Les administrateurs de bassin ne voient que les utilisateurs de leur bassin
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        // Récupérer les codes de location du bassin avec propagation hiérarchique
        const basinLocationCodes =
          await this.productionBasinService.getLocationCodesWithPropagation(
            authUser.productionBasinId
          )

        // Filtrage conditionnel selon le rôle
        query.where((builder) => {
          // 1. Utilisateurs ONCC avec productionBasinId (basin_admin, field_agent)
          builder.where((subBuilder) => {
            subBuilder
              .where('productionBasinId', authUser.productionBasinId!)
              .whereIn('role', ['basin_admin', 'field_agent', 'technical_admin'])
          })

          // 2. actor_manager liés à des OPA (filtrage par bassin via location_code de l'OPA)
          if (basinLocationCodes.length > 0) {
            builder.orWhere((subBuilder) => {
              subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
                actorQuery
                  .where('actor_type', 'PRODUCERS')
                  .whereIn('location_code', basinLocationCodes)
              })
            })
          }

          // 3. actor_manager liés à des TRANSFORMER, BUYER, EXPORTER (tous visibles, pas de filtre)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        })
      }
      // Les technical_admin peuvent voir tous les utilisateurs (pas de filtre supplémentaire)

      // Filtres supplémentaires
      if (role) {
        query.where('role', role)
      }
      if (status) {
        query.where('status', status)
      }
      if (bassinId) {
        // Pour les basin_admin, ce filtre est ignoré car ils sont déjà limités à leur bassin
        if (authUser.role === 'technical_admin') {
          query.where('productionBasinId', bassinId)
        }
      }
      if (search) {
        query.where((builder) => {
          builder
            .whereILike('family_name', `%${search}%`)
            .orWhereILike('given_name', `%${search}%`)
            .orWhereILike('username', `%${search}%`)
            .orWhereILike('email', `%${search}%`)
        })
      }

      // Relations
      query.preload('productionBasin')
      query.preload('actor')

      query.orderBy('created_at', 'desc')

      // Pagination
      const users = await query.paginate(page, limit)

      return ApiResponse.success(
        response,
        SuccessCodes.USER_LIST_SUCCESS,
        users.serialize({
          fields: {
            omit: [
              'passwordHash',
              'securityAnswer1Hash',
              'securityAnswer2Hash',
              'securityAnswer3Hash',
            ],
          },
          relations: {
            productionBasin: {
              fields: {
                pick: ['id', 'name', 'description'],
              },
            },
            actor: {
              fields: {
                pick: ['id', 'actorType', 'familyName', 'givenName'],
              },
            },
          },
        })
      )
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_LIST_FAILED)
    }
  }

  /**
   * Créer un nouvel utilisateur ONCC
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const data = await request.validateUsing(registerValidator)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Créer l'utilisateur via le service avec audit log intégré
      const { user, emailSent } = await this.userService.create(data, auditContext)

      // Charger les relations pour la réponse
      await user.load('productionBasin')

      const successMessage = emailSent
        ? 'Utilisateur créé avec succès. Un email de bienvenue a été envoyé.'
        : "Utilisateur créé avec succès. Attention: l'email de bienvenue n'a pas pu être envoyé."

      return ApiResponse.created(
        response,
        SuccessCodes.USER_CREATED,
        user.serialize({
          fields: {
            omit: [
              'passwordHash',
              'securityAnswer1Hash',
              'securityAnswer2Hash',
              'securityAnswer3Hash',
            ],
          },
        }),
        successMessage
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.code === ErrorCodes.USER_CREATE_EMAIL_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.USER_CREATE_EMAIL_EXISTS)
      }

      if (error.code === ErrorCodes.USER_CREATE_BASSIN_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.USER_CREATE_BASSIN_NOT_FOUND)
      }

      return ApiResponse.fromException(response, error, ErrorCodes.USER_CREATE_FAILED)
    }
  }

  /**
   * Afficher un utilisateur spécifique
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!
      const query = User.query().where('id', params.id)

      // Filtrage basé sur le rôle de l'utilisateur connecté
      if (authUser.role === 'basin_admin') {
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        // Filtrage conditionnel selon le rôle
        query.where((builder) => {
          // 1. Utilisateurs ONCC avec productionBasinId (basin_admin, field_agent)
          builder.where((subBuilder) => {
            subBuilder
              .where('productionBasinId', authUser.productionBasinId!)
              .whereIn('role', ['basin_admin', 'field_agent', 'technical_admin'])
          })

          // 2. actor_manager liés à des PRODUCERS (filtrage par bassin via location)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.where('actor_type', 'PRODUCERS').whereHas('location', (locationQuery) => {
                locationQuery.whereHas('productionBasins', (basinQuery) => {
                  basinQuery.where('production_basins.id', authUser.productionBasinId!)
                })
              })
            })
          })

          // 3. actor_manager liés à des TRANSFORMER, BUYER, EXPORTER (tous visibles, pas de filtre)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        })
      }

      const user = await query.preload('productionBasin').preload('actor').firstOrFail()

      return ApiResponse.success(
        response,
        SuccessCodes.USER_DETAILS_SUCCESS,
        user.serialize({
          fields: {
            omit: [
              'passwordHash',
              'securityAnswer1Hash',
              'securityAnswer2Hash',
              'securityAnswer3Hash',
            ],
          },
          relations: {
            productionBasin: {
              fields: {
                pick: ['id', 'name', 'description'],
              },
            },
            actor: {
              fields: {
                pick: ['id', 'actorType', 'familyName', 'givenName'],
              },
            },
          },
        })
      )
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
      return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
    }
  }

  /**
   * Mettre à jour les informations d'un utilisateur
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Vérification des autorisations - seuls les admins peuvent modifier d'autres utilisateurs
      if (!['technical_admin', 'basin_admin'].includes(authUser.role)) {
        return ApiResponse.error(
          response,
          ErrorCodes.SYSTEM_FORBIDDEN,
          403,
          "Vous n'avez pas l'autorisation de modifier les informations des utilisateurs"
        )
      }

      // Vérifier d'abord si l'utilisateur existe et si l'admin de bassin y a accès
      const query = User.query().where('id', params.id)

      if (authUser.role === 'basin_admin') {
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        // Filtrage conditionnel selon le rôle
        query.where((builder) => {
          // 1. Utilisateurs ONCC avec productionBasinId (basin_admin, field_agent)
          builder.where((subBuilder) => {
            subBuilder
              .where('productionBasinId', authUser.productionBasinId!)
              .whereIn('role', ['basin_admin', 'field_agent', 'technical_admin'])
          })

          // 2. actor_manager liés à des PRODUCERS (filtrage par bassin via location)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.where('actor_type', 'PRODUCERS').whereHas('location', (locationQuery) => {
                locationQuery.whereHas('productionBasins', (basinQuery) => {
                  basinQuery.where('production_basins.id', authUser.productionBasinId!)
                })
              })
            })
          })

          // 3. actor_manager liés à des TRANSFORMER, BUYER, EXPORTER (tous visibles, pas de filtre)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        })
      }

      const userToUpdate = await query.firstOrFail()

      // Choisir le validateur selon le rôle de l'utilisateur à modifier
      let data
      if (userToUpdate.role === 'actor_manager') {
        data = await request.validateUsing(updateActorManagerValidator)
      } else {
        data = await request.validateUsing(updateUserInfoValidator)
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Mettre à jour l'utilisateur via le service avec audit log intégré
      const user = await this.userService.update(params.id, data, auditContext)

      // Charger les relations pour la réponse
      await user.load('productionBasin')

      return ApiResponse.success(
        response,
        SuccessCodes.USER_UPDATED,
        user.serialize({
          fields: {
            omit: [
              'passwordHash',
              'securityAnswer1Hash',
              'securityAnswer2Hash',
              'securityAnswer3Hash',
            ],
          },
        })
      )
    } catch (error) {
      console.log(error)
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      if (error.code === ErrorCodes.USER_UPDATE_EMAIL_EXISTS) {
        return ApiResponse.fromException(response, error, ErrorCodes.USER_UPDATE_EMAIL_EXISTS)
      }

      if (error.code === ErrorCodes.USER_CREATE_BASSIN_NOT_FOUND) {
        return ApiResponse.fromException(response, error, ErrorCodes.USER_CREATE_BASSIN_NOT_FOUND)
      }

      if (error.code === ErrorCodes.USER_CREATE_BASSIN_REQUIRED) {
        return ApiResponse.fromException(response, error, ErrorCodes.USER_CREATE_BASSIN_REQUIRED)
      }

      if (error.code === ErrorCodes.USER_UPDATE_ACTOR_MANAGER_RESTRICTED) {
        return ApiResponse.fromException(
          response,
          error,
          ErrorCodes.USER_UPDATE_ACTOR_MANAGER_RESTRICTED
        )
      }

      return ApiResponse.fromException(response, error, ErrorCodes.USER_UPDATE_FAILED)
    }
  }

  /**
   * Changer le statut d'un utilisateur (active/inactive/blocked)
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Vérifier que l'utilisateur a le droit de modifier des comptes
      if (!['technical_admin', 'basin_admin'].includes(authUser.role)) {
        return ApiResponse.error(
          response,
          ErrorCodes.SYSTEM_FORBIDDEN,
          403,
          "Vous n'avez pas l'autorisation de modifier le statut des comptes utilisateurs"
        )
      }

      // Vérifier d'abord si l'utilisateur existe et si l'admin de bassin y a accès
      const query = User.query().where('id', params.id)

      if (authUser.role === 'basin_admin') {
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        // Filtrage conditionnel selon le rôle
        query.where((builder) => {
          // 1. Utilisateurs ONCC avec productionBasinId (basin_admin, field_agent)
          builder.where((subBuilder) => {
            subBuilder
              .where('productionBasinId', authUser.productionBasinId!)
              .whereIn('role', ['basin_admin', 'field_agent', 'technical_admin'])
          })

          // 2. actor_manager liés à des PRODUCERS (filtrage par bassin via location)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.where('actor_type', 'PRODUCERS').whereHas('location', (locationQuery) => {
                locationQuery.whereHas('productionBasins', (basinQuery) => {
                  basinQuery.where('production_basins.id', authUser.productionBasinId!)
                })
              })
            })
          })

          // 3. actor_manager liés à des TRANSFORMER, BUYER, EXPORTER (tous visibles, pas de filtre)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        })
      }

      const user = await query.firstOrFail()
      const { status, reason } = request.only(['status', 'reason'])

      if (!['active', 'inactive', 'blocked'].includes(status)) {
        return ApiResponse.error(
          response,
          ErrorCodes.USER_STATUS_UPDATE_INVALID,
          400,
          'Statut invalide. Valeurs autorisées: active, inactive, blocked'
        )
      }

      // Prevent user from modifying their own status
      if (user.id === authUser.id) {
        return ApiResponse.error(
          response,
          ErrorCodes.USER_STATUS_UPDATE_INVALID,
          400,
          'Vous ne pouvez pas modifier le statut de votre propre compte'
        )
      }

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Changer le statut via le service avec audit log intégré
      const { user: updatedUser } = await this.userService.updateStatus(
        params.id,
        status,
        reason,
        auditContext
      )

      const statusMessages = {
        active: 'Utilisateur activé avec succès',
        inactive: 'Utilisateur désactivé avec succès',
        blocked: 'Utilisateur bloqué avec succès',
      }

      return ApiResponse.success(
        response,
        SuccessCodes.USER_STATUS_UPDATED,
        { user: updatedUser },
        200,
        statusMessages[status as keyof typeof statusMessages]
      )
    } catch (error) {
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      console.error('Erreur mise à jour statut utilisateur:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_STATUS_UPDATE_FAILED)
    }
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur par un administrateur
   */
  async adminResetPassword({ params, request, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Vérifier l'autorisation (seuls les admin techniques et admin bassins peuvent réinitialiser)
      if (!['technical_admin', 'basin_admin'].includes(authUser.role)) {
        return ApiResponse.error(
          response,
          ErrorCodes.SYSTEM_FORBIDDEN,
          403,
          "Vous n'avez pas l'autorisation de réinitialiser les mots de passe"
        )
      }

      // Vérifier d'abord si l'utilisateur existe et si l'admin de bassin y a accès
      const query = User.query().where('id', params.id)

      if (authUser.role === 'basin_admin') {
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        // Filtrage conditionnel selon le rôle
        query.where((builder) => {
          // 1. Utilisateurs ONCC avec productionBasinId (basin_admin, field_agent)
          builder.where((subBuilder) => {
            subBuilder
              .where('productionBasinId', authUser.productionBasinId!)
              .whereIn('role', ['basin_admin', 'field_agent', 'technical_admin'])
          })

          // 2. actor_manager liés à des PRODUCERS (filtrage par bassin via location)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.where('actor_type', 'PRODUCERS').whereHas('location', (locationQuery) => {
                locationQuery.whereHas('productionBasins', (basinQuery) => {
                  basinQuery.where('production_basins.id', authUser.productionBasinId!)
                })
              })
            })
          })

          // 3. actor_manager liés à des TRANSFORMER, BUYER, EXPORTER (tous visibles, pas de filtre)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        })
      }

      await query.firstOrFail()

      // Préparer le contexte d'audit
      const auditContext = {
        userId: authUser.id,
        userRole: authUser.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Réinitialiser le mot de passe via le service avec audit log intégré
      const { user, emailSent } = await this.userService.adminResetPassword(
        params.id,
        {
          id: authUser.id,
          familyName: authUser.familyName,
          givenName: authUser.givenName,
          role: authUser.role,
        },
        auditContext
      )

      const successMessage = emailSent
        ? "Mot de passe réinitialisé avec succès. Un email de notification a été envoyé à l'utilisateur."
        : "Mot de passe réinitialisé avec succès. Attention: l'email de notification n'a pas pu être envoyé."

      return ApiResponse.success(
        response,
        SuccessCodes.USER_PASSWORD_RESET,
        {
          user: user.serialize({
            fields: {
              omit: [
                'passwordHash',
                'securityAnswer1Hash',
                'securityAnswer2Hash',
                'securityAnswer3Hash',
              ],
            },
          }),
          emailSent,
        },
        200,
        successMessage
      )
    } catch (error) {
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      console.error('Erreur lors de la réinitialisation administrative du mot de passe:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_PASSWORD_RESET_FAILED)
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Vérifier l'autorisation (seuls les admin peuvent supprimer)
      if (!['technical_admin', 'basin_admin'].includes(authUser.role)) {
        return ApiResponse.error(
          response,
          ErrorCodes.SYSTEM_FORBIDDEN,
          403,
          "Vous n'avez pas l'autorisation de supprimer des utilisateurs"
        )
      }

      // Vérifier d'abord si l'utilisateur existe et si l'admin de bassin y a accès
      const query = User.query().where('id', params.id)

      if (authUser.role === 'basin_admin') {
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        // Filtrage conditionnel selon le rôle
        query.where((builder) => {
          // 1. Utilisateurs ONCC avec productionBasinId (basin_admin, field_agent)
          builder.where((subBuilder) => {
            subBuilder
              .where('productionBasinId', authUser.productionBasinId!)
              .whereIn('role', ['basin_admin', 'field_agent', 'technical_admin'])
          })

          // 2. actor_manager liés à des PRODUCERS (filtrage par bassin via location)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.where('actor_type', 'PRODUCERS').whereHas('location', (locationQuery) => {
                locationQuery.whereHas('productionBasins', (basinQuery) => {
                  basinQuery.where('production_basins.id', authUser.productionBasinId!)
                })
              })
            })
          })

          // 3. actor_manager liés à des TRANSFORMER, BUYER, EXPORTER (tous visibles, pas de filtre)
          builder.orWhere((subBuilder) => {
            subBuilder.where('role', 'actor_manager').whereHas('actor', (actorQuery) => {
              actorQuery.whereIn('actor_type', ['TRANSFORMER', 'BUYER', 'EXPORTER'])
            })
          })
        })
      }

      await query.firstOrFail()

      // Supprimer l'utilisateur via le service
      await this.userService.delete(params.id)

      return ApiResponse.success(response, SuccessCodes.USER_DELETED)
    } catch (error) {
      if (error.status === 404) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      console.error('Erreur suppression utilisateur:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_DELETE_FAILED)
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async stats({ response, auth }: HttpContext) {
    try {
      const authUser = auth.use('api').user!

      // Base queries
      let statsQuery = User.query().select('role', 'status').groupBy('role', 'status')
      let totalQuery = User.query()
      let activeQuery = User.query().where('status', 'active')

      // Filtrage basé sur le rôle de l'utilisateur connecté
      if (authUser.role === 'basin_admin') {
        if (!authUser.productionBasinId) {
          return ApiResponse.error(
            response,
            ErrorCodes.SYSTEM_FORBIDDEN,
            403,
            "Votre compte administrateur de bassin n'est pas associé à un bassin de production"
          )
        }

        statsQuery = statsQuery.where('productionBasinId', authUser.productionBasinId)
        totalQuery = totalQuery.where('productionBasinId', authUser.productionBasinId)
        activeQuery = activeQuery.where('productionBasinId', authUser.productionBasinId)
      }

      const stats = await statsQuery.count('* as total')
      const totalUsers = await totalQuery.count('* as total')
      const activeUsers = await activeQuery.count('* as total')

      return ApiResponse.success(response, SuccessCodes.USER_LIST_SUCCESS, {
        total: totalUsers[0].$extras.total,
        active: activeUsers[0].$extras.total,
        byRoleAndStatus: stats.map((stat) => ({
          role: stat.role,
          status: stat.status,
          count: stat.$extras.total,
        })),
      })
    } catch (error) {
      console.error('Erreur récupération statistiques utilisateurs:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_LIST_FAILED)
    }
  }
}
