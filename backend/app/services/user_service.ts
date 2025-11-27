import AuditLog from '#models/audit_log'
import ProductionBasin from '#models/production_basin'
import User from '#models/user'
import env from '#start/env'
import type { UserRole } from '#types/user_roles'
import { UserErrorCodes } from '#types/errors/user'
import { generateUniquePseudo } from '#utils/pseudo_generator'
import emitter from '@adonisjs/core/services/emitter'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

export interface CreateUserData {
  familyName: string
  givenName: string
  email: string
  phone?: string | null
  role: UserRole
  position?: string | null
  productionBasinId?: string | null
  lang?: 'fr' | 'en'
}

export interface UpdateUserData {
  familyName?: string
  givenName?: string
  email?: string
  phone?: string | null
  role?: UserRole
  position?: string | null
  productionBasinId?: string | null
  lang?: 'fr' | 'en'
}

export default class UserService {
  /**
   * Créer un nouvel utilisateur avec audit log
   */
  async create(
    data: CreateUserData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<{ user: User; emailSent: boolean }> {
    // Vérifier l'unicité de l'email
    const existingUser = await User.query().where('email', data.email).first()
    if (existingUser) {
      throw new Exception("Un utilisateur avec cet email existe déjà", {
        code: UserErrorCodes.CREATE_EMAIL_EXISTS,
        status: 400,
      })
    }

    // Générer un nom d'utilisateur unique automatiquement
    const username = await generateUniquePseudo(data.givenName, data.familyName)

    // Vérifier que le bassin de production existe si spécifié
    if (data.productionBasinId) {
      const bassin = await ProductionBasin.find(data.productionBasinId)
      if (!bassin) {
        throw new Exception('Bassin de production non trouvé', {
          code: UserErrorCodes.CREATE_BASSIN_NOT_FOUND,
          status: 400,
        })
      }
    }

    const defaultPassword = env.get('DEFAULT_PASSWORD', '12345678')

    // Créer l'utilisateur
    const user = new User()
    user.username = username
    user.familyName = data.familyName
    user.givenName = data.givenName
    user.email = data.email
    user.phone = data.phone || null
    user.passwordHash = defaultPassword
    user.role = data.role
    user.position = data.position || null
    user.productionBasinId = data.productionBasinId || null
    user.lang = data.lang || 'fr'
    user.status = 'active'
    user.mustChangePassword = true

    await user.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'User',
          auditableId: user.id,
          action: 'create',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: null,
          newValues: {
            familyName: user.familyName,
            givenName: user.givenName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            position: user.position,
            productionBasinId: user.productionBasinId,
            lang: user.lang,
            status: user.status,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    // Émettre un événement pour envoyer l'email de bienvenue en arrière-plan
    emitter.emit('user:welcome', {
      email: user.email,
      userName: `${user.givenName} ${user.familyName}`,
      username: user.username,
      tempPassword: defaultPassword,
    })

    return { user, emailSent: true }
  }

  /**
   * Mettre à jour un utilisateur avec audit log
   */
  async update(
    id: string,
    data: UpdateUserData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<User> {
    const user = await User.findOrFail(id)

    // Bloquer la modification de role et position pour actor_manager
    if (user.role === 'actor_manager') {
      if (data.role !== undefined || data.position !== undefined) {
        throw new Exception(
          "Le rôle et la position d'un gestionnaire d'acteur ne peuvent pas être modifiés",
          {
            code: UserErrorCodes.UPDATE_ACTOR_MANAGER_RESTRICTED,
            status: 403,
          }
        )
      }
    }

    // Sauvegarder les valeurs originales pour l'audit log
    const originalValues = {
      familyName: user.familyName,
      givenName: user.givenName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      position: user.position,
      productionBasinId: user.productionBasinId,
      lang: user.lang,
    }

    // Vérifier l'unicité de l'email si modifié
    if (data.email && data.email !== user.email) {
      const existingUser = await User.query()
        .where('email', data.email)
        .whereNot('id', id)
        .first()

      if (existingUser) {
        throw new Exception("Un utilisateur avec cet email existe déjà", {
          code: UserErrorCodes.UPDATE_EMAIL_EXISTS,
          status: 400,
        })
      }
    }

    // Validation métier : rôles nécessitant un bassin de production
    if (data.role) {
      const roleRequiresBassin = ['basin_admin', 'field_agent'].includes(data.role)
      const finalBassinId =
        data.productionBasinId !== undefined ? data.productionBasinId : user.productionBasinId

      if (roleRequiresBassin && !finalBassinId) {
        throw new Exception('Un bassin de production est requis pour ce rôle', {
          code: UserErrorCodes.CREATE_BASSIN_REQUIRED,
          status: 400,
        })
      }
    }

    // Vérifier que le bassin de production existe si spécifié
    if (data.productionBasinId) {
      const bassin = await ProductionBasin.find(data.productionBasinId)
      if (!bassin) {
        throw new Exception('Bassin de production non trouvé', {
          code: UserErrorCodes.CREATE_BASSIN_NOT_FOUND,
          status: 400,
        })
      }
    }

    // Déterminer les champs modifiés et mettre à jour
    const changedFields: Record<string, any> = {}

    if (data.familyName && data.familyName !== user.familyName) {
      user.familyName = data.familyName
      changedFields.familyName = data.familyName
    }

    if (data.givenName && data.givenName !== user.givenName) {
      user.givenName = data.givenName
      changedFields.givenName = data.givenName
    }

    if (data.email && data.email !== user.email) {
      user.email = data.email
      changedFields.email = data.email
    }

    if (data.phone !== undefined && data.phone !== user.phone) {
      user.phone = data.phone
      changedFields.phone = data.phone
    }

    if (data.role && data.role !== user.role) {
      user.role = data.role
      changedFields.role = data.role
    }

    if (data.position !== undefined && data.position !== user.position) {
      user.position = data.position
      changedFields.position = data.position
    }

    if (data.productionBasinId !== undefined && data.productionBasinId !== user.productionBasinId) {
      user.productionBasinId = data.productionBasinId
      changedFields.productionBasinId = data.productionBasinId
    }

    if (data.lang && data.lang !== user.lang) {
      user.lang = data.lang
      changedFields.lang = data.lang
    }

    // Sauvegarder seulement s'il y a des modifications
    if (Object.keys(changedFields).length > 0) {
      try {
        await user.save()
      } catch (saveError: any) {
        if (saveError.message.includes('unique') && saveError.message.includes('username')) {
          throw new Exception(
            "Erreur lors de la génération du nouveau nom d'utilisateur. Veuillez réessayer.",
            {
              code: UserErrorCodes.UPDATE_PSEUDO_EXISTS,
              status: 400,
            }
          )
        }
        throw saveError
      }
    }

    // Créer l'audit log si le contexte est fourni et qu'il y a des modifications
    if (auditContext && Object.keys(changedFields).length > 0) {
      try {
        const oldValues = Object.keys(changedFields).reduce(
          (acc, field) => {
            acc[field] = (originalValues as any)[field] || null
            return acc
          },
          {} as Record<string, any>
        )

        await AuditLog.logAction({
          auditableType: 'User',
          auditableId: user.id,
          action: 'admin_info_update',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues,
          newValues: changedFields,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return user
  }

  /**
   * Changer le statut d'un utilisateur avec audit log
   */
  async updateStatus(
    id: string,
    status: 'active' | 'inactive' | 'blocked',
    reason?: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<{ user: User; emailSent: boolean }> {
    const user = await User.findOrFail(id)

    // Vérifier que le statut est différent
    if (user.status === status) {
      throw new Exception(`Cet utilisateur a déjà le statut: ${status}`, {
        code: UserErrorCodes.STATUS_UPDATE_INVALID,
        status: 400,
      })
    }

    const previousStatus = user.status
    user.status = status
    await user.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        const auditAction =
          status === 'active' ? 'activate' : status === 'inactive' ? 'deactivate' : 'update'
        await AuditLog.logAction({
          auditableType: 'User',
          auditableId: user.id,
          action: auditAction,
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { status: previousStatus, reason: reason || null },
          newValues: { status: status, reason: reason || null },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error(
          "Erreur lors de l'enregistrement de l'audit log du changement de statut:",
          auditError
        )
      }
    }

    // Charger les relations pour l'email
    await user.load('productionBasin')

    // Envoyer l'email de notification
    let emailSent = false
    try {
      const userInfo = {
        fullName: `${user.familyName} ${user.givenName}`,
        username: user.username,
        role: user.role,
        productionBasin: user.productionBasin ? { name: user.productionBasin.name } : undefined,
      }

      if (status === 'active' && previousStatus !== 'active') {
        emitter.emit('user:account-activated', {
          email: user.email,
          userName: userInfo.fullName,
        })
        emailSent = true
      } else if (status === 'inactive' && previousStatus === 'active') {
        emitter.emit('user:account-deactivated', {
          email: user.email,
          userName: userInfo.fullName,
          reason,
        })
        emailSent = true
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'événement de changement de statut:', emailError)
    }

    return { user, emailSent }
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur par un administrateur
   */
  async adminResetPassword(
    id: string,
    adminUser: { id: string; familyName: string; givenName: string; role: string },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<{ user: User; emailSent: boolean }> {
    const user = await User.findOrFail(id)

    // Empêcher un utilisateur de réinitialiser son propre mot de passe
    if (user.id === adminUser.id) {
      throw new Exception(
        'Vous ne pouvez pas réinitialiser votre propre mot de passe via cette méthode',
        {
          status: 400,
        }
      )
    }

    const defaultPassword = env.get('DEFAULT_PASSWORD', '12345678')

    // Réinitialiser le mot de passe
    user.passwordHash = defaultPassword
    user.passwordChangedAt = DateTime.now()
    user.mustChangePassword = true
    await user.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'User',
          auditableId: user.id,
          action: 'admin_password_reset',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { password: '[MASKED]' },
          newValues: { password: '[MASKED]' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de la création du log d'audit:", auditError)
      }
    }

    // Émettre un événement pour envoyer l'email de notification en arrière-plan
    emitter.emit('user:admin-password-reset', {
      email: user.email,
      userName: `${user.familyName} ${user.givenName}`,
      newPassword: defaultPassword,
    })

    return { user, emailSent: true }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async delete(id: string): Promise<void> {
    const user = await User.findOrFail(id)

    // Soft delete
    user.deletedAt = DateTime.now()
    user.status = 'inactive'
    await user.save()

    // Supprimer tous les audit logs de cet utilisateur
    try {
      await AuditLog.query().where('auditable_type', 'User').where('auditable_id', user.id).delete()
    } catch (auditDeleteError) {
      console.error('Erreur lors de la suppression des audit logs:', auditDeleteError)
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async findById(id: string): Promise<User> {
    return await User.findOrFail(id)
  }
}
