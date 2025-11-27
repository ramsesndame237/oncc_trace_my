import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Metadata from '#models/metadata'
import User from '#models/user'
import ProductionBasinService from '#services/production_basin_service'
import {
  ACTOR_TYPES_OBJECT,
  ActorStatus,
  CreateActorData,
  UpdateActorData,
} from '#types/actor_types'
import { ActorErrorCodes } from '#types/errors/actor'
import { UserErrorCodes } from '#types/errors/user'
import { generateUniquePseudo } from '#utils/pseudo_generator'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

@inject()
export default class ActorService {
  constructor(protected productionBasinService: ProductionBasinService) {}

  /**
   * Fonction helper pour créer un utilisateur manager/acheteur
   */
  private async createActorUser(
    trx: any,
    userData: {
      email: string
      givenName: string
      familyName: string
      phone?: string | null
    },
    actor: Actor,
    actorTypeLabel: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    // Vérifier l'unicité de l'email
    const existingUser = await User.query({ client: trx }).where('email', userData.email).first()

    if (existingUser) {
      throw new Exception(`Un utilisateur avec l'email ${userData.email} existe déjà.`, {
        code: UserErrorCodes.CREATE_EMAIL_EXISTS,
        status: 409,
      })
    }

    // Générer un nom d'utilisateur unique
    const username = await generateUniquePseudo(userData.givenName, userData.familyName)

    // Obtenir le mot de passe par défaut
    const defaultPassword = process.env.DEFAULT_PASSWORD || '12345678'

    // Créer l'utilisateur
    const user = await User.create(
      {
        username,
        familyName: userData.familyName,
        givenName: userData.givenName,
        email: userData.email,
        phone: userData.phone,
        passwordHash: defaultPassword,
        role: 'actor_manager',
        actorId: actor.id,
        lang: 'fr',
        status: 'active',
        mustChangePassword: true,
      },
      { client: trx }
    )

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
            username: user.username,
            familyName: user.familyName,
            givenName: user.givenName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            actorId: user.actorId,
            lang: user.lang,
            status: user.status,
            mustChangePassword: user.mustChangePassword,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log du manager:", auditError)
        // On ne bloque pas la création du manager si l'audit log échoue
      }
    }

    // Émettre un événement pour envoyer l'email de bienvenue en arrière-plan
    try {
      // Charger les informations de localisation pour l'email
      await actor.load('location')

      emitter.emit('user:actor-manager-welcome', {
        email: userData.email,
        userName: `${userData.givenName} ${userData.familyName}`,
        username,
        tempPassword: defaultPassword,
        actorInfo: {
          name: `${userData.familyName} ${userData.givenName}`,
          type: actorTypeLabel,
          location: actor.location?.name || undefined,
        },
      })
    } catch (error) {
      // Log l'erreur d'événement mais ne fait pas échouer la transaction
      console.error("Erreur lors de l'émission de l'événement email:", error)
    }
  }

  /**
   * Crée un nouvel acteur avec validation et gestion des métadonnées et audit log
   */
  async create(
    data: CreateActorData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    },
    userRole?: string
  ): Promise<Actor> {
    return await db.transaction(async (trx) => {
      // Validation : au moins l'email ou le téléphone doit être renseigné
      if (!data.email && !data.phone && data.actorType === ACTOR_TYPES_OBJECT.PRODUCER) {
        throw new Exception("Au moins l'email ou le numéro de téléphone doit être renseigné.", {
          code: ActorErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED,
          status: 400,
        })
      }

      // Validation : l'email est obligatoire pour les acheteurs
      if (data.actorType === ACTOR_TYPES_OBJECT.BUYER && !data.email) {
        throw new Exception("L'email est obligatoire pour un acheteur.", {
          code: ActorErrorCodes.ACTOR_EMAIL_REQUIRED,
          status: 400,
        })
      }

      // Validation conditionnelle : managerInfo obligatoire uniquement pour PRODUCERS (OPA)
      if (
        (data.actorType === ACTOR_TYPES_OBJECT.PRODUCERS ||
          data.actorType === ACTOR_TYPES_OBJECT.EXPORTER ||
          data.actorType === ACTOR_TYPES_OBJECT.TRANSFORMER) &&
        !data.managerInfo
      ) {
        throw new Exception(
          "Les informations du manager sont obligatoires pour ce type d'acteur.",
          {
            code: ActorErrorCodes.ACTOR_MANAGER_INFO_REQUIRED,
            status: 400,
          }
        )
      }
      // Vérification spécifique pour les OPA : l'email du manager doit être unique
      if (
        (data.actorType === ACTOR_TYPES_OBJECT.PRODUCERS ||
          data.actorType === ACTOR_TYPES_OBJECT.EXPORTER ||
          data.actorType === ACTOR_TYPES_OBJECT.TRANSFORMER) &&
        data.managerInfo
      ) {
        const existingManager = await User.query({ client: trx })
          .where('email', data.managerInfo.email)
          .first()

        if (existingManager) {
          throw new Exception(
            `Un utilisateur avec l'email ${data.managerInfo.email} existe déjà.`,
            {
              code: UserErrorCodes.CREATE_EMAIL_EXISTS,
              status: 409,
            }
          )
        }
      }

      // Vérification spécifique pour les acheteurs : l'email doit être unique
      if (data.actorType === ACTOR_TYPES_OBJECT.BUYER && data.email) {
        const existingUser = await User.query({ client: trx }).where('email', data.email).first()

        if (existingUser) {
          throw new Exception(`Un utilisateur avec l'email ${data.email} existe déjà.`, {
            code: UserErrorCodes.CREATE_EMAIL_EXISTS,
            status: 409,
          })
        }
      }

      // Vérifier l'unicité des identifiants s'ils sont fournis
      if (data.onccId) {
        const existingWithOnccId = await Actor.query({ client: trx })
          .where('oncc_id', data.onccId)
          .first()

        if (existingWithOnccId) {
          throw new Exception('Un acteur avec cet identifiant ONCC existe déjà.', {
            code: ActorErrorCodes.ACTOR_ONCC_ID_EXISTS,
            status: 409,
          })
        }
      }

      if (data.identifiantId) {
        const existingWithIdentifiantId = await Actor.query({ client: trx })
          .where('identifiant_id', data.identifiantId)
          .first()

        if (existingWithIdentifiantId) {
          throw new Exception('Un acteur avec cet identifiant unique existe déjà.', {
            code: ActorErrorCodes.ACTOR_IDENTIFIANT_EXISTS,
            status: 409,
          })
        }
      }

      // Calculer la date d'expiration pour les OPA si une déclaration d'existence est fournie
      let existenceExpiryDate: DateTime | null | undefined = undefined
      if (
        (data.actorType === ACTOR_TYPES_OBJECT.PRODUCERS ||
          data.actorType === ACTOR_TYPES_OBJECT.EXPORTER ||
          data.actorType === ACTOR_TYPES_OBJECT.TRANSFORMER) &&
        data.existenceDeclarationDate &&
        data.existenceDeclarationYears
      ) {
        const declarationDate = DateTime.fromISO(data.existenceDeclarationDate)
        existenceExpiryDate = declarationDate.plus({ years: data.existenceDeclarationYears })
      } else if (
        data.existenceDeclarationDate === null ||
        data.existenceDeclarationYears === null
      ) {
        // Si les champs sont explicitement null, vider existenceExpiryDate
        existenceExpiryDate = null
      }

      // Déterminer le statut automatiquement selon le rôle de l'utilisateur
      let finalStatus: ActorStatus
      if (data.status) {
        // Si un statut est explicitement fourni, l'utiliser
        finalStatus = data.status
      } else if (userRole === 'field_agent') {
        // Si l'utilisateur est un field_agent et qu'aucun statut n'est fourni, utiliser "pending"
        finalStatus = 'pending'
      } else {
        // Sinon, utiliser "active" par défaut
        finalStatus = 'active'
      }

      // Créer l'acteur
      const actor = await Actor.create(
        {
          actorType: data.actorType,
          familyName: data.familyName,
          givenName: data.givenName,
          phone: data.phone,
          email: data.email,
          onccId: data.onccId,
          identifiantId: data.identifiantId,
          locationCode: data.locationCode,
          managerInfo: data.managerInfo,
          status: finalStatus,
          existenceDeclarationDate:
            data.existenceDeclarationDate === null
              ? null
              : data.existenceDeclarationDate
                ? DateTime.fromISO(data.existenceDeclarationDate)
                : undefined,
          existenceDeclarationCode:
            data.existenceDeclarationCode === null ? null : data.existenceDeclarationCode,
          existenceDeclarationYears:
            data.existenceDeclarationYears === null ? null : data.existenceDeclarationYears,
          existenceExpiryDate: existenceExpiryDate === undefined ? undefined : existenceExpiryDate,
        },
        { client: trx }
      )

      // Gérer les métadonnées supplémentaires
      if (data.metadata) {
        for (const [key, value] of Object.entries(data.metadata)) {
          // Ignorer les valeurs undefined ou vides
          if (value !== undefined && value !== '') {
            await Metadata.create(
              {
                metadatableType: 'actor',
                metadatableId: actor.id,
                metaKey: key,
                metaValue: value,
              },
              { client: trx }
            )
          }
        }
      }

      const actorTypeLabels: Record<string, string> = {
        PRODUCER: 'Producteur',
        TRANSFORMER: 'Transformateur',
        PRODUCERS: 'Groupement de Producteurs',
        BUYER: 'Acheteur',
        EXPORTER: 'Exportateur',
      }

      // Créer un utilisateur manager si les informations sont fournies
      if (data.managerInfo) {
        await this.createActorUser(
          trx,
          {
            email: data.managerInfo.email,
            givenName: data.managerInfo.prenom,
            familyName: data.managerInfo.nom,
            phone: data.managerInfo.phone,
          },
          actor,
          actorTypeLabels[data.actorType] || data.actorType,
          auditContext
        )
      }

      // Créer un utilisateur pour les acheteurs (BUYER)
      if (data.actorType === ACTOR_TYPES_OBJECT.BUYER && data.email) {
        await this.createActorUser(
          trx,
          {
            email: data.email,
            givenName: data.givenName,
            familyName: data.familyName,
            phone: data.phone,
          },
          actor,
          actorTypeLabels[data.actorType] || data.actorType,
          auditContext
        )
      }

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'Actor',
            auditableId: actor.id,
            action: 'create',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: null,
            newValues: {
              actorType: actor.actorType,
              familyName: actor.familyName,
              givenName: actor.givenName,
              phone: actor.phone,
              email: actor.email,
              onccId: actor.onccId,
              identifiantId: actor.identifiantId,
              locationCode: actor.locationCode,
              managerInfo: actor.managerInfo as any,
              status: actor.status,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
          // On ne bloque pas la création de l'acteur si l'audit log échoue
        }
      }

      return actor
    })
  }

  /**
   * Met à jour un acteur existant avec audit log
   */
  async update(
    actorId: string,
    data: UpdateActorData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Actor> {
    return await db.transaction(async (trx) => {
      const actor = await Actor.query({ client: trx }).where('id', actorId).firstOrFail()

      // Sauvegarder les valeurs originales pour l'audit log
      const originalValues = {
        actorType: actor.actorType,
        familyName: actor.familyName,
        givenName: actor.givenName,
        phone: actor.phone,
        email: actor.email,
        onccId: actor.onccId,
        identifiantId: actor.identifiantId,
        locationCode: actor.locationCode,
        managerInfo: actor.managerInfo,
      }

      // Validation : au moins l'email ou le téléphone doit être renseigné
      // Utiliser les nouvelles valeurs si fournies, sinon garder les anciennes
      const finalEmail = data.email !== undefined ? data.email : actor.email
      const finalPhone = data.phone !== undefined ? data.phone : actor.phone

      if (!finalEmail && !finalPhone && actor.actorType === ACTOR_TYPES_OBJECT.PRODUCER) {
        throw new Exception("Au moins l'email ou le numéro de téléphone doit être renseigné.", {
          code: ActorErrorCodes.ACTOR_EMAIL_OR_PHONE_REQUIRED,
          status: 400,
        })
      }

      // Vérifier l'unicité des identifiants s'ils sont modifiés
      if (data.onccId && data.onccId !== actor.onccId) {
        const existingWithOnccId = await Actor.query({ client: trx })
          .where('oncc_id', data.onccId)
          .whereNot('id', actorId)
          .whereNull('deleted_at')
          .first()

        if (existingWithOnccId) {
          throw new Exception('Un acteur avec cet identifiant ONCC existe déjà.', {
            code: ActorErrorCodes.ACTOR_ONCC_ID_EXISTS,
            status: 409,
          })
        }
      }

      if (data.identifiantId && data.identifiantId !== actor.identifiantId) {
        const existingWithIdentifiantId = await Actor.query({ client: trx })
          .where('identifiant_id', data.identifiantId)
          .whereNot('id', actorId)
          .whereNull('deleted_at')
          .first()

        if (existingWithIdentifiantId) {
          throw new Exception('Un acteur avec cet identifiant unique existe déjà.', {
            code: ActorErrorCodes.ACTOR_IDENTIFIANT_EXISTS,
            status: 409,
          })
        }
      }

      // Calculer la date d'expiration pour les OPA si les données de déclaration sont mises à jour
      let existenceExpiryDate: DateTime | null | undefined = undefined
      if (data.existenceDeclarationDate && data.existenceDeclarationYears) {
        const declarationDate = DateTime.fromISO(data.existenceDeclarationDate)
        existenceExpiryDate = declarationDate.plus({ years: data.existenceDeclarationYears })
      } else if (
        data.existenceDeclarationDate === null ||
        data.existenceDeclarationYears === null
      ) {
        // Si l'une des valeurs est explicitement null, on vide la date d'expiration
        existenceExpiryDate = null
      }

      // Mettre à jour l'acteur
      actor.merge({
        actorType: data.actorType,
        familyName: data.familyName,
        givenName: data.givenName,
        phone: data.phone,
        email: data.email,
        onccId: data.onccId,
        identifiantId: data.identifiantId,
        locationCode: data.locationCode,
        managerInfo: data.managerInfo,
        existenceDeclarationDate:
          data.existenceDeclarationDate === null
            ? null
            : data.existenceDeclarationDate
              ? DateTime.fromISO(data.existenceDeclarationDate)
              : undefined,
        existenceDeclarationCode:
          data.existenceDeclarationCode === null ? null : data.existenceDeclarationCode,
        existenceDeclarationYears:
          data.existenceDeclarationYears === null ? null : data.existenceDeclarationYears,
        existenceExpiryDate: existenceExpiryDate === undefined ? undefined : existenceExpiryDate,
      })

      actor.useTransaction(trx)
      await actor.save()

      // Gérer les métadonnées supplémentaires
      if (data.metadata) {
        for (const [key, value] of Object.entries(data.metadata)) {
          // Traiter toutes les métadonnées, y compris les valeurs vides (pour suppression)
          if (value !== undefined) {
            await Metadata.setMetadataFor('actor', actor.id, key, value)
          }
        }
      }

      // Créer un manager user si managerInfo est fourni et qu'il n'existe pas encore
      if (
        data.managerInfo &&
        (actor.actorType === ACTOR_TYPES_OBJECT.PRODUCERS ||
          actor.actorType === ACTOR_TYPES_OBJECT.EXPORTER ||
          actor.actorType === ACTOR_TYPES_OBJECT.TRANSFORMER)
      ) {
        // Vérifier si un manager user existe déjà pour cet acteur
        const existingManager = await User.query({ client: trx })
          .where('actor_id', actor.id)
          .where('role', 'actor_manager')
          .first()

        if (!existingManager) {
          // Créer le manager user
          const actorTypeLabels: Record<string, string> = {
            PRODUCERS: 'OPA (Groupement de Producteurs)',
            EXPORTER: 'Exportateur',
            TRANSFORMER: 'Transformateur',
          }

          await this.createActorUser(
            trx,
            {
              email: data.managerInfo.email,
              givenName: data.managerInfo.prenom,
              familyName: data.managerInfo.nom,
              phone: data.managerInfo.phone,
            },
            actor,
            actorTypeLabels[actor.actorType] || actor.actorType,
            auditContext
          )
        }
      }

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          const changedFields: Record<string, any> = {}
          const newValues: Record<string, any> = {}
          const oldValues: Record<string, any> = {}

          // Comparer les valeurs et enregistrer les changements
          Object.keys(data).forEach((key) => {
            const newValue = (data as any)[key]
            const oldValue = (originalValues as any)[key]

            if (newValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
              changedFields[key] = newValue
              newValues[key] = newValue
              oldValues[key] = oldValue
            }
          })

          // Enregistrer l'audit log seulement s'il y a des modifications
          if (Object.keys(changedFields).length > 0) {
            await AuditLog.logAction({
              auditableType: 'Actor',
              auditableId: actor.id,
              action: 'update',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues,
              newValues,
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })
          }
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
          // On ne bloque pas la mise à jour si l'audit log échoue
        }
      }

      return actor
    })
  }

  /**
   * Active un acteur avec audit log et validation des documents obligatoires
   */
  async activate(
    actorId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Actor> {
    const actor = await Actor.findOrFail(actorId)

    if (actor.status === 'active') {
      throw new Exception("L'acteur est déjà actif.", {
        code: ActorErrorCodes.ACTOR_ALREADY_ACTIVE,
        status: 409,
      })
    }

    // Validation des documents obligatoires pour pending → active
    if (actor.status === 'pending') {
      // Charger les documents de l'acteur
      await actor.load('documents')

      // Définir les documents obligatoires selon le type d'acteur
      const requiredDocuments: Record<string, string[]> = {
        PRODUCER: ['producer_photo', 'producer_card', 'producer_rccm'],
        BUYER: ['rccm', 'conformity_certificate_facilities', 'commercial_license'],
        TRANSFORMER: ['rccm', 'conformity_certificate_facilities', 'commercial_license'],
        EXPORTER: ['rccm', 'conformity_certificate_facilities', 'commercial_license'],
        PRODUCERS: ['cobget_registration_form'], // OPA
      }

      const requiredDocs = requiredDocuments[actor.actorType] || []

      if (requiredDocs.length > 0) {
        // Vérifier si tous les documents obligatoires sont présents
        const existingDocTypes = actor.documents.map((doc: any) => doc.documentType)
        const missingDocs = requiredDocs.filter((docType) => !existingDocTypes.includes(docType))

        if (missingDocs.length > 0) {
          throw new Exception(
            "Documents justificatifs obligatoires manquants. Veuillez ajouter tous les documents requis avant de valider l'acteur.",
            {
              code: ActorErrorCodes.ACTOR_MISSING_REQUIRED_DOCUMENTS,
              status: 400,
            }
          )
        }
      }
    }

    const oldStatus = actor.status
    actor.status = 'active'
    await actor.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Actor',
          auditableId: actor.id,
          action: 'activate',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { status: oldStatus },
          newValues: { status: 'active' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return actor
  }

  /**
   * Désactive un acteur avec audit log
   */
  async deactivate(
    actorId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<Actor> {
    const actor = await Actor.findOrFail(actorId)

    if (actor.status === 'inactive') {
      throw new Exception("L'acteur est déjà inactif.", {
        code: ActorErrorCodes.ACTOR_ALREADY_INACTIVE,
        status: 409,
      })
    }

    const oldStatus = actor.status
    actor.status = 'inactive'
    await actor.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Actor',
          auditableId: actor.id,
          action: 'deactivate',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { status: oldStatus },
          newValues: { status: 'inactive' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }

    return actor
  }

  /**
   * Récupère la liste des acteurs avec pagination et filtres
   */
  async list(
    options: {
      page?: number
      limit?: number
      actorType?: string
      status?: string
      locationCode?: string
      search?: string
      userRole?: string
      userProductionBasinId?: string
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      actorType,
      status,
      locationCode,
      search,
      userRole,
      userProductionBasinId,
    } = options

    let query = Actor.query().preload('location').preload('metadata')

    // Précharger les exportateurs mandants pour les acheteurs
    if (actorType === 'BUYER') {
      query = query.preload('exporters', (exportersQuery) => {
        exportersQuery.pivotColumns(['mandate_date', 'status', 'campaign_id'])
      })
    }

    // Filtres
    if (actorType) {
      query = query.where('actor_type', actorType)
    }

    if (status) {
      query = query.where('status', status)
    }

    if (locationCode) {
      query = query.where('location_code', locationCode)
    }

    // Filtrage par bassin de production pour les admins de bassin
    // Uniquement pour les producteurs individuels et les OPA
    if (
      (userRole === 'basin_admin' || userRole === 'field_agent') &&
      userProductionBasinId &&
      (actorType === 'PRODUCER' || actorType === 'PRODUCERS')
    ) {
      try {
        // Récupérer les locationCodes du bassin avec propagation hiérarchique
        const basinLocationCodes =
          await this.productionBasinService.getLocationCodesWithPropagation(userProductionBasinId)

        if (basinLocationCodes.length > 0) {
          // Pour les producteurs individuels, vérifier si au moins une parcelle est dans le bassin
          if (actorType === 'PRODUCER') {
            query = query.whereHas('parcels', (parcelQuery) => {
              parcelQuery.whereIn('location_code', basinLocationCodes).whereNull('deleted_at')
            })
          } else if (actorType === 'PRODUCERS') {
            // Pour les OPA, filtrer par leur locationCode (siège)
            query = query.whereIn('location_code', basinLocationCodes)
          }
        } else {
          // Si le bassin n'a aucune location, ne retourner aucun résultat pour ces types
          // Utiliser une condition qui retourne toujours false (plus propre que 'non-existent-id')
          query = query.whereRaw('1 = 0')
        }
      } catch (error) {
        // En cas d'erreur, ne retourner aucun résultat pour ces types
        query = query.whereRaw('1 = 0')
      }
    }

    // Recherche textuelle
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('family_name', `%${search}%`)
          .orWhereILike('given_name', `%${search}%`)
          .orWhereILike('oncc_id', `%${search}%`)
          .orWhereILike('identifiant_id', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('phone', `%${search}%`)
      })
    }

    query = query.orderBy('created_at', 'desc')

    return await query.paginate(page, limit)
  }

  /**
   * Récupère un acteur par son ID avec ses relations
   */
  async findById(actorId: string): Promise<Actor> {
    const actor = await Actor.query()
      .where('id', actorId)
      .whereNull('deleted_at')
      .preload('location')
      .preload('metadata')
      .preload('auditLogs')
      .preload('producers', (query) => {
        query.whereNull('deleted_at').pivotColumns(['membership_date', 'status'])
      })
      .preload('buyers', (query) => {
        query.whereNull('deleted_at').pivotColumns(['mandate_date', 'status', 'campaign_id'])
      })
      .firstOrFail()

    console.log('[DEBUG] findById - Actor trouvé:', {
      id: actor.id,
      actorType: actor.actorType,
      producersCount: actor.producers?.length || 0,
    })

    if (actor.producers && actor.producers.length > 0) {
      console.log(
        '[DEBUG] findById - Producteurs chargés:',
        actor.producers.map((p) => ({
          id: p.id,
          familyName: p.familyName,
          givenName: p.givenName,
          $extras: p.$extras,
        }))
      )
    } else {
      console.log('[DEBUG] findById - Aucun producteur chargé')
    }

    return actor
  }

  /**
   * Récupère un acteur par son code ONCC
   */
  async findByOnccId(onccId: string): Promise<Actor | null> {
    return await Actor.query().where('oncc_id', onccId).whereNull('deleted_at').first()
  }

  /**
   * Récupère un acteur par son code d'identification unique
   */
  async findByIdentifiantId(identifiantId: string): Promise<Actor | null> {
    return await Actor.query()
      .where('identifiant_id', identifiantId)
      .whereNull('deleted_at')
      .first()
  }

  /**
   * Supprime définitivement un acteur (soft delete)
   */
  async delete(
    actorId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    const actor = await Actor.findOrFail(actorId)

    // Vérifier s'il y a des utilisateurs liés
    await actor.load('users')
    if (actor.users.length > 0) {
      throw new Exception(
        'Impossible de supprimer cet acteur car il a des utilisateurs associés.',
        {
          code: ActorErrorCodes.ACTOR_HAS_USERS,
          status: 409,
        }
      )
    }

    // Sauvegarder les valeurs pour l'audit log
    const oldValues = {
      actorType: actor.actorType,
      familyName: actor.familyName,
      givenName: actor.givenName,
      status: actor.status,
    }

    // Soft delete
    actor.deletedAt = DateTime.now()
    await actor.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'Actor',
          auditableId: actor.id,
          action: 'delete',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues,
          newValues: { deletedAt: actor.deletedAt.toISO() },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (auditError) {
        console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
      }
    }
  }

  /**
   * Ajoute un producteur à un OPA avec audit log
   */
  async addProducerToOpa(
    opaId: string,
    producerId: string,
    data: {
      membershipDate?: string
      status?: 'active' | 'inactive'
    },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    console.log('[DEBUG] addProducerToOpa - Début:', { opaId, producerId, data })
    return await db.transaction(async (trx) => {
      // Vérifier que l'OPA existe et est bien de type PRODUCERS
      console.log("[DEBUG] Vérification de l'OPA:", opaId)
      const opa = await Actor.query({ client: trx })
        .where('id', opaId)
        .whereNull('deleted_at')
        .firstOrFail()
      console.log('[DEBUG] OPA trouvé:', { id: opa.id, actorType: opa.actorType })

      if (opa.actorType !== ACTOR_TYPES_OBJECT.PRODUCERS) {
        throw new Exception("L'acteur n'est pas un groupement de producteurs (OPA).", {
          code: ActorErrorCodes.ACTOR_NOT_OPA,
          status: 400,
        })
      }

      // Vérifier que le producteur existe et est bien de type PRODUCER
      console.log('[DEBUG] Vérification du producteur:', producerId)
      const producer = await Actor.query({ client: trx })
        .where('id', producerId)
        .whereNull('deleted_at')
        .firstOrFail()
      console.log('[DEBUG] Producteur trouvé:', { id: producer.id, actorType: producer.actorType })

      if (producer.actorType !== ACTOR_TYPES_OBJECT.PRODUCER) {
        throw new Exception("L'acteur n'est pas un producteur.", {
          code: ActorErrorCodes.ACTOR_NOT_PRODUCER,
          status: 400,
        })
      }

      // Vérifier si la relation existe déjà
      console.log('[DEBUG] Vérification de la relation existante')
      const existingRelation = await db
        .from('producer_opa')
        .where('producer_id', producerId)
        .where('opa_id', opaId)
        .first()
      console.log('[DEBUG] Relation existante:', existingRelation)

      if (existingRelation) {
        throw new Exception('Ce producteur est déjà membre de cet OPA.', {
          code: ActorErrorCodes.PRODUCER_ALREADY_IN_OPA,
          status: 409,
        })
      }

      // Ajouter la relation
      console.log('[DEBUG] Insertion de la relation dans producer_opa')
      const insertData = {
        id: trx.raw('gen_random_uuid()'),
        producer_id: producerId,
        opa_id: opaId,
        membership_date: data.membershipDate || DateTime.now().toFormat('yyyy-MM-dd'),
        status: data.status || 'active',
        created_at: DateTime.now().toSQL(),
      }
      console.log("[DEBUG] Données d'insertion:", insertData)
      await trx.table('producer_opa').insert(insertData)
      console.log('[DEBUG] Relation insérée avec succès')

      // Mettre à jour updated_at de l'OPA pour permettre la synchronisation
      await Actor.query({ client: trx }).where('id', opaId).update({
        updated_at: DateTime.now().toSQL(),
      })

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'Actor',
            auditableId: opaId,
            action: 'add_producer',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: null,
            newValues: {
              producerId,
              producerName: `${producer.familyName} ${producer.givenName}`,
              membershipDate: data.membershipDate || null,
              status: data.status || 'active',
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        }
      }
    })
  }

  /**
   * Gère les producteurs d'un OPA (ajout, suppression, conservation) avec logique différentielle
   */
  async manageOpaProducers(
    opaId: string,
    producerIds: string[],
    data: {
      membershipDate?: string
      status?: 'active' | 'inactive'
    },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    return await db.transaction(async (trx) => {
      // Vérifier que l'OPA existe et est bien de type PRODUCERS
      const opa = await Actor.query({ client: trx })
        .where('id', opaId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (opa.actorType !== ACTOR_TYPES_OBJECT.PRODUCERS) {
        throw new Exception("L'acteur n'est pas un groupement de producteurs (OPA).", {
          code: ActorErrorCodes.ACTOR_NOT_OPA,
          status: 400,
        })
      }

      // Récupérer les producteurs actuellement associés à cet OPA
      const existingProducers = await trx
        .from('producer_opa')
        .where('opa_id', opaId)
        .select('producer_id')

      const existingProducerIds = existingProducers.map((p) => p.producer_id)

      // Identifier les producteurs à ajouter et supprimer
      const producersToAdd = producerIds.filter((id) => !existingProducerIds.includes(id))
      const producersToRemove = existingProducerIds.filter((id) => !producerIds.includes(id))

      // Supprimer les producteurs qui ne sont plus dans la liste
      if (producersToRemove.length > 0) {
        await trx
          .from('producer_opa')
          .where('opa_id', opaId)
          .whereIn('producer_id', producersToRemove)
          .delete()

        // Audit log pour chaque suppression
        if (auditContext) {
          for (const producerId of producersToRemove) {
            try {
              await AuditLog.logAction({
                auditableType: 'Actor',
                auditableId: opaId,
                action: 'remove_producer',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: { producerId },
                newValues: null,
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            } catch (auditError) {
              console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
            }
          }
        }
      }

      // Ajouter les nouveaux producteurs
      if (producersToAdd.length > 0) {
        // Vérifier que tous les producteurs à ajouter existent et sont bien de type PRODUCER
        const producers = await Actor.query({ client: trx })
          .whereIn('id', producersToAdd)
          .whereNull('deleted_at')

        if (producers.length !== producersToAdd.length) {
          throw new Exception('Certains producteurs sont introuvables.', {
            code: ActorErrorCodes.ACTOR_NOT_FOUND,
            status: 404,
          })
        }

        const invalidProducers = producers.filter((p) => p.actorType !== ACTOR_TYPES_OBJECT.PRODUCER)
        if (invalidProducers.length > 0) {
          throw new Exception('Certains acteurs ne sont pas des producteurs.', {
            code: ActorErrorCodes.ACTOR_NOT_PRODUCER,
            status: 400,
          })
        }

        // Insérer les nouvelles relations
        const insertData = producersToAdd.map((producerId) => ({
          id: trx.raw('gen_random_uuid()'),
          producer_id: producerId,
          opa_id: opaId,
          membership_date: data.membershipDate || DateTime.now().toFormat('yyyy-MM-dd'),
          status: data.status || 'active',
          created_at: DateTime.now().toSQL(),
        }))

        await trx.table('producer_opa').insert(insertData)

        // Audit log pour chaque ajout
        if (auditContext) {
          for (const producerId of producersToAdd) {
            try {
              await AuditLog.logAction({
                auditableType: 'Actor',
                auditableId: opaId,
                action: 'add_producer',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: null,
                newValues: { producerId },
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            } catch (auditError) {
              console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
            }
          }
        }
      }

      // Mettre à jour updated_at de l'OPA pour permettre la synchronisation
      await Actor.query({ client: trx }).where('id', opaId).update({
        updated_at: DateTime.now().toSQL(),
      })
    })
  }

  /**
   * Retire un producteur d'un OPA avec audit log
   */
  async removeProducerFromOpa(
    opaId: string,
    producerId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    return await db.transaction(async (trx) => {
      // Vérifier que l'OPA existe et est bien de type PRODUCERS
      const opa = await Actor.query({ client: trx })
        .where('id', opaId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (opa.actorType !== ACTOR_TYPES_OBJECT.PRODUCERS) {
        throw new Exception("L'acteur n'est pas un groupement de producteurs (OPA).", {
          code: ActorErrorCodes.ACTOR_NOT_OPA,
          status: 400,
        })
      }

      // Vérifier que le producteur existe
      const producer = await Actor.query({ client: trx })
        .where('id', producerId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (producer.actorType !== ACTOR_TYPES_OBJECT.PRODUCER) {
        throw new Exception("L'acteur n'est pas un producteur.", {
          code: ActorErrorCodes.ACTOR_NOT_PRODUCER,
          status: 400,
        })
      }

      // Vérifier si la relation existe
      const existingRelation = await trx
        .from('producer_opa')
        .where('producer_id', producerId)
        .where('opa_id', opaId)
        .first()

      if (!existingRelation) {
        throw new Exception("Ce producteur n'est pas membre de cet OPA.", {
          code: ActorErrorCodes.PRODUCER_NOT_IN_OPA,
          status: 404,
        })
      }

      // Supprimer la relation
      await trx
        .from('producer_opa')
        .where('producer_id', producerId)
        .where('opa_id', opaId)
        .delete()

      // Mettre à jour updated_at de l'OPA pour permettre la synchronisation
      await Actor.query({ client: trx }).where('id', opaId).update({
        updated_at: DateTime.now().toSQL(),
      })

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'Actor',
            auditableId: opaId,
            action: 'remove_producer',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: {
              producerId,
              producerName: `${producer.familyName} ${producer.givenName}`,
              membershipDate: existingRelation.membership_date || null,
              status: existingRelation.status || null,
            },
            newValues: null,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        }
      }
    })
  }

  /**
   * Récupère les OPA d'un producteur avec pagination
   */
  async getOPAsForProducer(producerId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options

    // Vérifier que le producteur existe et est bien de type PRODUCER
    const producer = await Actor.query()
      .where('id', producerId)
      .whereNull('deleted_at')
      .firstOrFail()

    if (producer.actorType !== ACTOR_TYPES_OBJECT.PRODUCER) {
      throw new Exception("L'acteur n'est pas un producteur.", {
        code: ActorErrorCodes.ACTOR_NOT_PRODUCER,
        status: 400,
      })
    }

    // Créer une query pour les OPA avec pagination
    const opasQuery = await db
      .from('producer_opa')
      .join('actors', 'producer_opa.opa_id', 'actors.id')
      .where('producer_opa.producer_id', producerId)
      .whereNull('actors.deleted_at')
      .select(
        'actors.*',
        'producer_opa.membership_date as pivot_membership_date',
        'producer_opa.status as pivot_status'
      )
      .paginate(page, limit)

    return opasQuery
  }

  /**
   * Récupère les producteurs d'un OPA avec pagination
   */
  async getProducersForOPA(opaId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options

    // Vérifier que l'OPA existe et est bien de type PRODUCERS
    const opa = await Actor.query().where('id', opaId).whereNull('deleted_at').firstOrFail()

    if (opa.actorType !== ACTOR_TYPES_OBJECT.PRODUCERS) {
      throw new Exception("L'acteur n'est pas un groupement de producteurs (OPA).", {
        code: ActorErrorCodes.ACTOR_NOT_OPA,
        status: 400,
      })
    }

    // Créer une query pour les producteurs avec pagination
    const producersQuery = await db
      .from('producer_opa')
      .join('actors', 'producer_opa.producer_id', 'actors.id')
      .where('producer_opa.opa_id', opaId)
      .whereNull('actors.deleted_at')
      .select(
        'actors.*',
        'producer_opa.membership_date as pivot_membership_date',
        'producer_opa.status as pivot_status'
      )
      .paginate(page, limit)

    return producersQuery
  }

  /**
   * Récupère les exportateurs pour lesquels un acheteur est mandataire pour la campagne en cours avec pagination
   */
  async getExportersForBuyer(buyerId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options

    // Vérifier que l'acheteur existe et est bien de type BUYER
    const buyer = await Actor.query().where('id', buyerId).whereNull('deleted_at').firstOrFail()

    if (buyer.actorType !== ACTOR_TYPES_OBJECT.BUYER) {
      throw new Exception("L'acteur n'est pas un acheteur.", {
        code: ActorErrorCodes.ACTOR_NOT_BUYER,
        status: 400,
      })
    }

    // Récupérer la campagne active
    const activeCampaign = await Campaign.getActiveCampaign()

    if (!activeCampaign) {
      throw new Exception("Aucune campagne active n'est disponible.", {
        code: ActorErrorCodes.NO_ACTIVE_CAMPAIGN,
        status: 404,
      })
    }

    // Créer une query pour les exportateurs avec pagination
    const exportersQuery = await db
      .from('exporter_mandates')
      .join('actors', 'exporter_mandates.exporter_id', 'actors.id')
      .where('exporter_mandates.buyer_id', buyerId)
      .where('exporter_mandates.campaign_id', activeCampaign.id)
      .whereNull('actors.deleted_at')
      .select(
        'actors.*',
        'exporter_mandates.mandate_date as pivot_mandate_date',
        'exporter_mandates.status as pivot_status',
        'exporter_mandates.campaign_id as pivot_campaign_id'
      )
      .paginate(page, limit)

    return exportersQuery
  }

  /**
   * Récupère les acheteurs mandataires d'un exportateur pour la campagne en cours avec pagination
   */
  async getBuyersForExporter(exporterId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options

    // Vérifier que l'exportateur existe et est bien de type EXPORTER
    const exporter = await Actor.query()
      .where('id', exporterId)
      .whereNull('deleted_at')
      .firstOrFail()

    if (exporter.actorType !== ACTOR_TYPES_OBJECT.EXPORTER) {
      throw new Exception("L'acteur n'est pas un exportateur.", {
        code: ActorErrorCodes.ACTOR_NOT_EXPORTER,
        status: 400,
      })
    }

    // Récupérer la campagne active
    const activeCampaign = await Campaign.getActiveCampaign()

    if (!activeCampaign) {
      throw new Exception("Aucune campagne active n'est disponible.", {
        code: ActorErrorCodes.NO_ACTIVE_CAMPAIGN,
        status: 404,
      })
    }

    // Créer une query pour les acheteurs avec pagination
    const buyersQuery = await db
      .from('exporter_mandates')
      .join('actors', 'exporter_mandates.buyer_id', 'actors.id')
      .where('exporter_mandates.exporter_id', exporterId)
      .where('exporter_mandates.campaign_id', activeCampaign.id)
      .whereNull('actors.deleted_at')
      .select(
        'actors.*',
        'exporter_mandates.mandate_date as pivot_mandate_date',
        'exporter_mandates.status as pivot_status',
        'exporter_mandates.campaign_id as pivot_campaign_id'
      )
      .paginate(page, limit)

    return buyersQuery
  }

  /**
   * Ajoute un acheteur comme mandataire d'un exportateur
   */
  async addBuyerToExporter(
    exporterId: string,
    buyerId: string,
    data: {
      mandateDate?: string
      status?: 'active' | 'inactive'
    },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    return await db.transaction(async (trx) => {
      // Vérifier que l'exportateur existe et est bien de type EXPORTER
      const exporter = await Actor.query({ client: trx })
        .where('id', exporterId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (exporter.actorType !== ACTOR_TYPES_OBJECT.EXPORTER) {
        throw new Exception("L'acteur n'est pas un exportateur.", {
          code: ActorErrorCodes.ACTOR_NOT_EXPORTER,
          status: 400,
        })
      }

      // Vérifier que l'acheteur existe et est bien de type BUYER
      const buyer = await Actor.query({ client: trx })
        .where('id', buyerId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (buyer.actorType !== ACTOR_TYPES_OBJECT.BUYER) {
        throw new Exception("L'acteur n'est pas un acheteur.", {
          code: ActorErrorCodes.ACTOR_NOT_BUYER,
          status: 400,
        })
      }

      // Utiliser la campagne active par défaut
      const activeCampaign = await Campaign.getActiveCampaign()

      if (!activeCampaign) {
        throw new Exception("Aucune campagne active n'est disponible.", {
          code: ActorErrorCodes.NO_ACTIVE_CAMPAIGN,
          status: 400,
        })
      }
      const campaignId = activeCampaign.id

      // Vérifier si l'acheteur est déjà affecté à UN AUTRE exportateur pour cette campagne
      const existingBuyerRelation = await trx
        .from('exporter_mandates')
        .where('buyer_id', buyerId)
        .where('campaign_id', campaignId)
        .first()

      if (existingBuyerRelation) {
        // Si la relation existe avec le même exportateur
        if (existingBuyerRelation.exporter_id === exporterId) {
          throw new Exception('Cet acheteur est déjà mandataire de cet exportateur.', {
            code: ActorErrorCodes.BUYER_ALREADY_IN_EXPORTER,
            status: 409,
          })
        } else {
          // Si la relation existe avec un autre exportateur
          const otherExporter = await Actor.query({ client: trx })
            .where('id', existingBuyerRelation.exporter_id)
            .first()

          const exporterName = otherExporter
            ? `${otherExporter.familyName} ${otherExporter.givenName}`
            : 'un autre exportateur'

          throw new Exception(
            `Cet acheteur est déjà mandataire de ${exporterName} pour la campagne en cours.`,
            {
              code: ActorErrorCodes.BUYER_ALREADY_ASSIGNED_TO_OTHER_EXPORTER,
              status: 409,
            }
          )
        }
      }

      // Créer la relation
      const insertData = {
        id: crypto.randomUUID(),
        exporter_id: exporterId,
        buyer_id: buyerId,
        campaign_id: campaignId,
        mandate_date: data.mandateDate || null,
        status: data.status || 'active',
        created_at: new Date(),
      }

      await trx.table('exporter_mandates').insert(insertData)

      // Mettre à jour updated_at de l'acheteur pour permettre la synchronisation
      await Actor.query({ client: trx }).where('id', exporterId).update({
        updated_at: DateTime.now().toSQL(),
      })

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'Actor',
            auditableId: exporterId,
            action: 'add_buyer',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: null,
            newValues: {
              buyerId,
              buyerName: `${buyer.familyName} ${buyer.givenName}`,
              mandateDate: data.mandateDate || null,
              status: data.status || 'active',
              campaignId: campaignId,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        }
      }
    })
  }

  /**
   * Gère les buyers d'un exportateur avec logique différentielle (ajout en masse)
   * Ajoute de nouveaux buyers et retire ceux qui ne sont plus dans la liste
   */
  async manageExporterBuyers(
    exporterId: string,
    buyerIds: string[],
    data: {
      mandateDate?: string
      status?: 'active' | 'inactive'
    },
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    return await db.transaction(async (trx) => {
      // Vérifier que l'exportateur existe et est bien de type EXPORTER
      const exporter = await Actor.query({ client: trx })
        .where('id', exporterId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (exporter.actorType !== ACTOR_TYPES_OBJECT.EXPORTER) {
        throw new Exception("L'acteur n'est pas un exportateur.", {
          code: ActorErrorCodes.ACTOR_NOT_EXPORTER,
          status: 400,
        })
      }

      // Récupérer les buyers actuellement associés à cet exportateur
      const existingBuyers = await trx
        .from('exporter_buyer')
        .where('exporter_id', exporterId)
        .select('buyer_id')

      const existingBuyerIds = existingBuyers.map((b) => b.buyer_id)

      // Identifier les buyers à ajouter et supprimer
      const buyersToAdd = buyerIds.filter((id) => !existingBuyerIds.includes(id))
      const buyersToRemove = existingBuyerIds.filter((id) => !buyerIds.includes(id))

      // Supprimer les buyers qui ne sont plus dans la liste
      if (buyersToRemove.length > 0) {
        await trx
          .from('exporter_buyer')
          .where('exporter_id', exporterId)
          .whereIn('buyer_id', buyersToRemove)
          .delete()

        // Audit log pour chaque suppression
        if (auditContext) {
          for (const buyerId of buyersToRemove) {
            try {
              await AuditLog.logAction({
                auditableType: 'Actor',
                auditableId: exporterId,
                action: 'remove_buyer',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: { buyerId },
                newValues: null,
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            } catch (auditError) {
              console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
            }
          }
        }
      }

      // Ajouter les nouveaux buyers
      if (buyersToAdd.length > 0) {
        // Vérifier que tous les buyers à ajouter existent et sont bien de type BUYER
        const buyers = await Actor.query({ client: trx })
          .whereIn('id', buyersToAdd)
          .whereNull('deleted_at')

        if (buyers.length !== buyersToAdd.length) {
          throw new Exception('Certains acheteurs sont introuvables.', {
            code: ActorErrorCodes.ACTOR_NOT_FOUND,
            status: 404,
          })
        }

        const invalidBuyers = buyers.filter((b) => b.actorType !== ACTOR_TYPES_OBJECT.BUYER)
        if (invalidBuyers.length > 0) {
          throw new Exception('Certains acteurs ne sont pas des acheteurs.', {
            code: ActorErrorCodes.ACTOR_NOT_BUYER,
            status: 400,
          })
        }

        // Insérer les nouvelles relations
        const insertData = buyersToAdd.map((buyerId) => ({
          id: trx.raw('gen_random_uuid()'),
          buyer_id: buyerId,
          exporter_id: exporterId,
          mandate_date: data.mandateDate || DateTime.now().toFormat('yyyy-MM-dd'),
          status: data.status || 'active',
          created_at: DateTime.now().toSQL(),
        }))

        await trx.table('exporter_buyer').insert(insertData)

        // Audit log pour chaque ajout
        if (auditContext) {
          for (const buyerId of buyersToAdd) {
            try {
              await AuditLog.logAction({
                auditableType: 'Actor',
                auditableId: exporterId,
                action: 'add_buyer',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: null,
                newValues: { buyerId },
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            } catch (auditError) {
              console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
            }
          }
        }
      }

      // Mettre à jour updated_at de l'exportateur pour permettre la synchronisation
      await Actor.query({ client: trx }).where('id', exporterId).update({
        updated_at: DateTime.now().toSQL(),
      })
    })
  }

  /**
   * Retire un acheteur comme mandataire d'un exportateur
   */
  async removeBuyerFromExporter(
    exporterId: string,
    buyerId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    return await db.transaction(async (trx) => {
      // Vérifier que l'exportateur existe et est bien de type EXPORTER
      const exporter = await Actor.query({ client: trx })
        .where('id', exporterId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (exporter.actorType !== ACTOR_TYPES_OBJECT.EXPORTER) {
        throw new Exception("L'acteur n'est pas un exportateur.", {
          code: ActorErrorCodes.ACTOR_NOT_EXPORTER,
          status: 400,
        })
      }

      // Vérifier que l'acheteur existe
      const buyer = await Actor.query({ client: trx })
        .where('id', buyerId)
        .whereNull('deleted_at')
        .firstOrFail()

      if (buyer.actorType !== ACTOR_TYPES_OBJECT.BUYER) {
        throw new Exception("L'acteur n'est pas un acheteur.", {
          code: ActorErrorCodes.ACTOR_NOT_BUYER,
          status: 400,
        })
      }

      // Vérifier si la relation existe
      const existingRelation = await trx
        .from('exporter_mandates')
        .where('exporter_id', exporterId)
        .where('buyer_id', buyerId)
        .first()

      if (!existingRelation) {
        throw new Exception("Cet acheteur n'est pas mandataire de cet exportateur.", {
          code: ActorErrorCodes.BUYER_NOT_IN_EXPORTER,
          status: 404,
        })
      }

      // Mettre à jour updated_at de l'acheteur pour permettre la synchronisation
      await Actor.query({ client: trx }).where('id', exporterId).update({
        updated_at: DateTime.now().toSQL(),
      })

      // Supprimer la relation
      await trx
        .from('exporter_mandates')
        .where('exporter_id', exporterId)
        .where('buyer_id', buyerId)
        .delete()

      // Créer l'audit log si le contexte est fourni
      if (auditContext) {
        try {
          await AuditLog.logAction({
            auditableType: 'Actor',
            auditableId: exporterId,
            action: 'remove_buyer',
            userId: auditContext.userId,
            userRole: auditContext.userRole,
            oldValues: {
              buyerId,
              buyerName: `${buyer.familyName} ${buyer.givenName}`,
              mandateDate: existingRelation.mandate_date || null,
              status: existingRelation.status || null,
              campaignId: existingRelation.campaign_id || null,
            },
            newValues: null,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        } catch (auditError) {
          console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
        }
      }
    })
  }

  /**
   * Récupère tous les acteurs pour la synchronisation initiale (sans pagination)
   * Filtré par bassin de production pour basin_admin
   */
  async getAllForSync(options: {
    userRole: string
    userProductionBasinId?: string
    actorTypes?: string[]
  }): Promise<Actor[]> {
    const { userRole, userProductionBasinId, actorTypes } = options

    // Récupérer la campagne active pour déterminer le statut des stores
    const activeCampaign = await Campaign.getActiveCampaign()

    let query = Actor.query()
      .whereNull('deleted_at')
      .preload('location')
      .preload('stores', (storesQuery) => {
        storesQuery.preload('campaigns')
      })
      .preload('calendars', (calendarsQuery) => {
        calendarsQuery
          .whereNull('deleted_at')
          .where('status', 'active')
          .whereIn('type', ['MARCHE', 'ENLEVEMENT'])
          .if(activeCampaign, (query) => {
            query.where('campaign_id', activeCampaign!.id)
          })
          .preload('convention')
      })
      // Preload mandate relations for EXPORTER and BUYER
      .preload('buyers', (buyersQuery) => {
        // Acheteurs mandataires de l'exportateur (pour la campagne active)
        buyersQuery
          .pivotColumns(['mandate_date', 'status', 'campaign_id'])
          .if(activeCampaign, (q) => {
            q.wherePivot('campaign_id', activeCampaign!.id).wherePivot('status', 'active')
          })
      })
      .preload('exporters', (exportersQuery) => {
        // Exportateurs mandants de l'acheteur (pour la campagne active)
        exportersQuery
          .pivotColumns(['mandate_date', 'status', 'campaign_id'])
          .if(activeCampaign, (q) => {
            q.wherePivot('campaign_id', activeCampaign!.id).wherePivot('status', 'active')
          })
      })
      // Preload OPA relations for PRODUCER and producers for OPA (PRODUCERS)
      .preload('opas', (opasQuery) => {
        // OPA auxquelles appartient le producteur
        opasQuery.pivotColumns(['membership_date', 'status']).wherePivot('status', 'active')
      })
      .preload('producers', (producersQuery) => {
        // Producteurs appartenant à l'OPA
        producersQuery.pivotColumns(['membership_date', 'status']).wherePivot('status', 'active')
      })
      .orderBy('updated_at', 'desc')

    // Filtrer par actor_type si spécifié
    if (actorTypes && actorTypes.length > 0) {
      query = query.whereIn('actor_type', actorTypes)
    }

    // Si basin_admin ou field_agent, filtrer par bassin de production
    // Uniquement pour les producteurs individuels et les OPA
    if ((userRole === 'basin_admin' || userRole === 'field_agent') && userProductionBasinId) {
      try {
        // Récupérer les locationCodes du bassin avec propagation hiérarchique
        const basinLocationCodes =
          await this.productionBasinService.getLocationCodesWithPropagation(userProductionBasinId)

        if (basinLocationCodes.length > 0) {
          // Filtrer les acteurs qui appartiennent au bassin
          query = query.where((builder) => {
            // Producteurs individuels: au moins une parcelle dans le bassin
            builder.orWhere((producerBuilder) => {
              producerBuilder.where('actor_type', 'PRODUCER').whereHas('parcels', (parcelQuery) => {
                parcelQuery.whereIn('location_code', basinLocationCodes).whereNull('deleted_at')
              })
            })
            // OPA: locationCode (siège) dans le bassin
            builder.orWhere((opaBuilder) => {
              opaBuilder
                .where('actor_type', 'PRODUCERS')
                .whereIn('location_code', basinLocationCodes)
            })
            // EXPORTER, BUYER, TRANSFORMER: filtrer par leur locationCode (siège) dans le bassin
            builder.orWhere((otherBuilder) => {
              otherBuilder.whereIn('actor_type', ['EXPORTER', 'BUYER', 'TRANSFORMER'])
            })
          })
        } else {
          // Si le bassin n'a aucune location, retourner un tableau vide
          return []
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des locations du bassin:', error)
        return []
      }
    }

    const actors = await query

    // Sérialiser les acteurs et calculer le statut des stores
    return actors.map((actor) => {
      // Calculer le statut de chaque store
      const storesWithStatus = actor.stores?.map((store) => {
        // Le store est actif s'il est affecté à la campagne active
        const isActive =
          activeCampaign && store.campaigns?.some((campaign) => campaign.id === activeCampaign.id)

        return {
          id: store.id,
          name: store.name,
          code: store.code,
          status: isActive ? 'active' : 'inactive',
        }
      })

      // Traiter les calendriers actifs pour les OPA de la campagne active
      const calendarsData =
        actor.actorType === ACTOR_TYPES_OBJECT.PRODUCERS && actor.calendars
          ? actor.calendars.map((calendar) => {
              return {
                id: calendar.id,
                code: calendar.code,
                type: calendar.type,
                status: calendar.status,
                location: calendar.location,
                locationCode: calendar.locationCode,
                startDate: calendar.startDate?.toISODate() || '',
                endDate: calendar.endDate?.toISODate() || '',
                eventTime: calendar.eventTime,
                // Pour type ENLEVEMENT, inclure la convention
                convention:
                  calendar.type === 'ENLEVEMENT' && calendar.convention
                    ? {
                        id: calendar.convention.id,
                        opaId: calendar.convention.producersId,
                        buyerExporterId: calendar.convention.buyerExporterId,
                        signatureDate: calendar.convention.signatureDate?.toISODate() || '',
                      }
                    : null,
              }
            })
          : []

      // Traiter les acheteurs mandataires (pour EXPORTER)
      const buyersData =
        actor.actorType === ACTOR_TYPES_OBJECT.EXPORTER && actor.buyers
          ? actor.buyers.map((buyer) => ({
              id: buyer.id,
              familyName: buyer.familyName,
              givenName: buyer.givenName,
              onccId: buyer.onccId,
              mandateDate: buyer.$extras.pivot_mandate_date || null,
              status: buyer.$extras.pivot_status || 'active',
              campaignId: buyer.$extras.pivot_campaign_id || null,
            }))
          : []

      // Traiter les exportateurs mandants (pour BUYER)
      const exportersData =
        actor.actorType === ACTOR_TYPES_OBJECT.BUYER && actor.exporters
          ? actor.exporters.map((exporter) => ({
              id: exporter.id,
              familyName: exporter.familyName,
              givenName: exporter.givenName,
              onccId: exporter.onccId,
              mandateDate: exporter.$extras.pivot_mandate_date || null,
              status: exporter.$extras.pivot_status || 'active',
              campaignId: exporter.$extras.pivot_campaign_id || null,
            }))
          : []

      // Traiter les OPA auxquelles appartient le producteur (pour PRODUCER)
      const opasData =
        actor.actorType === ACTOR_TYPES_OBJECT.PRODUCER && actor.opas
          ? actor.opas.map((opa) => ({
              id: opa.id,
              familyName: opa.familyName,
              givenName: opa.givenName,
              onccId: opa.onccId,
              membershipDate: opa.$extras.pivot_membership_date || null,
              status: opa.$extras.pivot_status || 'active',
            }))
          : []

      // Traiter les producteurs appartenant à l'OPA (pour PRODUCERS/OPA)
      const producersData =
        actor.actorType === ACTOR_TYPES_OBJECT.PRODUCERS && actor.producers
          ? actor.producers.map((producer) => ({
              id: producer.id,
              familyName: producer.familyName,
              givenName: producer.givenName,
              onccId: producer.onccId,
              membershipDate: producer.$extras.pivot_membership_date || null,
              status: producer.$extras.pivot_status || 'active',
            }))
          : []

      const serialized = actor.serialize({
        fields: {
          pick: [
            'id',
            'actorType',
            'familyName',
            'givenName',
            'locationCode',
            'status',
            'phone',
            'email',
            'onccId',
            'createdAt',
            'updatedAt',
          ],
        },
        relations: {
          location: {
            fields: {
              pick: ['code', 'name', 'type'],
            },
          },
        },
      })

      // Ajouter manuellement les stores, conventions et calendriers avec le statut calculé
      // ⚠️ IMPORTANT: Forcer le statut à 'active' pour les clients (même si l'acteur est 'pending' en DB)
      return {
        ...serialized,
        status: 'active',
        stores: storesWithStatus || [],
        calendars: calendarsData || [],
        buyers: buyersData || [],
        mandators: exportersData || [],
        opas: opasData || [],
        producers: producersData || [],
      } as unknown as Actor
    })
  }

  /**
   * Récupère les acteurs modifiés depuis une date donnée
   * Filtré par bassin de production pour basin_admin
   * Pour actor_manager de type PRODUCERS: son propre OPA + tous les autres types d'acteurs (sauf autres PRODUCERS)
   */
  async getUpdatedSince(options: {
    since: Date
    userRole: string
    userProductionBasinId?: string
  }): Promise<Actor[]> {
    const { since, userRole, userProductionBasinId } = options

    // Récupérer la campagne active pour déterminer le statut des stores
    const activeCampaign = await Campaign.getActiveCampaign()

    let query = Actor.query()
      .whereNull('deleted_at')
      .where('updated_at', '>', since.toISOString())
      .preload('location')
      .preload('stores', (storesQuery) => {
        storesQuery.preload('campaigns')
      })
      .preload('calendars', (calendarsQuery) => {
        calendarsQuery
          .whereNull('deleted_at')
          .where('status', 'active')
          .whereIn('type', ['MARCHE', 'ENLEVEMENT'])
          .if(activeCampaign, (query) => {
            query.where('campaign_id', activeCampaign!.id)
          })
          .preload('convention')
      })
      // Preload mandate relations for EXPORTER and BUYER
      .preload('buyers', (buyersQuery) => {
        // Acheteurs mandataires de l'exportateur (pour la campagne active)
        buyersQuery
          .pivotColumns(['mandate_date', 'status', 'campaign_id'])
          .if(activeCampaign, (q) => {
            q.wherePivot('campaign_id', activeCampaign!.id).wherePivot('status', 'active')
          })
      })
      .preload('exporters', (exportersQuery) => {
        // Exportateurs mandants de l'acheteur (pour la campagne active)
        exportersQuery
          .pivotColumns(['mandate_date', 'status', 'campaign_id'])
          .if(activeCampaign, (q) => {
            q.wherePivot('campaign_id', activeCampaign!.id).wherePivot('status', 'active')
          })
      })
      // Preload OPA relations for PRODUCER and producers for OPA (PRODUCERS)
      .preload('opas', (opasQuery) => {
        // OPA auxquelles appartient le producteur
        opasQuery.pivotColumns(['membership_date', 'status']).wherePivot('status', 'active')
      })
      .preload('producers', (producersQuery) => {
        // Producteurs appartenant à l'OPA
        producersQuery.pivotColumns(['membership_date', 'status']).wherePivot('status', 'active')
      })
      .orderBy('updated_at', 'desc')

    // Si basin_admin ou field_agent, filtrer par bassin de production
    // Uniquement pour les producteurs individuels et les OPA
    if ((userRole === 'basin_admin' || userRole === 'field_agent') && userProductionBasinId) {
      try {
        // Récupérer les locationCodes du bassin avec propagation hiérarchique
        const basinLocationCodes =
          await this.productionBasinService.getLocationCodesWithPropagation(userProductionBasinId)

        if (basinLocationCodes.length > 0) {
          // Filtrer les acteurs qui appartiennent au bassin
          query = query.where((builder) => {
            // Producteurs individuels: au moins une parcelle dans le bassin
            builder.orWhere((producerBuilder) => {
              producerBuilder.where('actor_type', 'PRODUCER').whereHas('parcels', (parcelQuery) => {
                parcelQuery.whereIn('location_code', basinLocationCodes).whereNull('deleted_at')
              })
            })
            // OPA: locationCode (siège) dans le bassin
            builder.orWhere((opaBuilder) => {
              opaBuilder
                .where('actor_type', 'PRODUCERS')
                .whereIn('location_code', basinLocationCodes)
            })
            // EXPORTER, BUYER, TRANSFORMER: filtrer par leur locationCode (siège) dans le bassin
            builder.orWhere((otherBuilder) => {
              otherBuilder.whereIn('actor_type', ['EXPORTER', 'BUYER', 'TRANSFORMER'])
            })
          })
        } else {
          // Si le bassin n'a aucune location, retourner un tableau vide
          return []
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des locations du bassin:', error)
        return []
      }
    }

    const actors = await query

    // Sérialiser les acteurs et calculer le statut des stores
    return actors.map((actor) => {
      // Calculer le statut de chaque store
      const storesWithStatus = actor.stores?.map((store) => {
        // Le store est actif s'il est affecté à la campagne active
        const isActive =
          activeCampaign && store.campaigns?.some((campaign) => campaign.id === activeCampaign.id)

        return {
          id: store.id,
          name: store.name,
          code: store.code,
          status: isActive ? 'active' : 'inactive',
        }
      })

      // Traiter les calendriers actifs pour les OPA de la campagne active
      const calendarsData =
        actor.actorType === ACTOR_TYPES_OBJECT.PRODUCERS && actor.calendars
          ? actor.calendars.map((calendar) => {
              return {
                id: calendar.id,
                code: calendar.code,
                type: calendar.type,
                status: calendar.status,
                location: calendar.location,
                locationCode: calendar.locationCode,
                startDate: calendar.startDate?.toISODate() || '',
                endDate: calendar.endDate?.toISODate() || '',
                eventTime: calendar.eventTime,
                // Pour type ENLEVEMENT, inclure la convention
                convention:
                  calendar.type === 'ENLEVEMENT' && calendar.convention
                    ? {
                        id: calendar.convention.id,
                        opaId: calendar.convention.producersId,
                        buyerExporterId: calendar.convention.buyerExporterId,
                        signatureDate: calendar.convention.signatureDate?.toISODate() || '',
                      }
                    : null,
              }
            })
          : []

      // Traiter les acheteurs mandataires (pour EXPORTER)
      const buyersData =
        actor.actorType === ACTOR_TYPES_OBJECT.EXPORTER && actor.buyers
          ? actor.buyers.map((buyer) => ({
              id: buyer.id,
              familyName: buyer.familyName,
              givenName: buyer.givenName,
              onccId: buyer.onccId,
              mandateDate: buyer.$extras.pivot_mandate_date || null,
              status: buyer.$extras.pivot_status || 'active',
              campaignId: buyer.$extras.pivot_campaign_id || null,
            }))
          : []

      // Traiter les exportateurs mandants (pour BUYER)
      const exportersData =
        actor.actorType === ACTOR_TYPES_OBJECT.BUYER && actor.exporters
          ? actor.exporters.map((exporter) => ({
              id: exporter.id,
              familyName: exporter.familyName,
              givenName: exporter.givenName,
              onccId: exporter.onccId,
              mandateDate: exporter.$extras.pivot_mandate_date || null,
              status: exporter.$extras.pivot_status || 'active',
              campaignId: exporter.$extras.pivot_campaign_id || null,
            }))
          : []

      // Traiter les OPA auxquelles appartient le producteur (pour PRODUCER)
      const opasData =
        actor.actorType === ACTOR_TYPES_OBJECT.PRODUCER && actor.opas
          ? actor.opas.map((opa) => ({
              id: opa.id,
              familyName: opa.familyName,
              givenName: opa.givenName,
              onccId: opa.onccId,
              membershipDate: opa.$extras.pivot_membership_date || null,
              status: opa.$extras.pivot_status || 'active',
            }))
          : []

      // Traiter les producteurs appartenant à l'OPA (pour PRODUCERS/OPA)
      const producersData =
        actor.actorType === ACTOR_TYPES_OBJECT.PRODUCERS && actor.producers
          ? actor.producers.map((producer) => ({
              id: producer.id,
              familyName: producer.familyName,
              givenName: producer.givenName,
              onccId: producer.onccId,
              membershipDate: producer.$extras.pivot_membership_date || null,
              status: producer.$extras.pivot_status || 'active',
            }))
          : []

      const serialized = actor.serialize({
        fields: {
          pick: [
            'id',
            'actorType',
            'familyName',
            'givenName',
            'locationCode',
            'status',
            'phone',
            'email',
            'onccId',
            'createdAt',
            'updatedAt',
          ],
        },
        relations: {
          location: {
            fields: {
              pick: ['code', 'name', 'type'],
            },
          },
        },
      })

      // Ajouter manuellement les stores, conventions et calendriers avec le statut calculé
      // ⚠️ IMPORTANT: Forcer le statut à 'active' pour les clients (même si l'acteur est 'pending' en DB)
      return {
        ...serialized,
        status: 'active',
        stores: storesWithStatus || [],
        calendars: calendarsData || [],
        buyers: buyersData || [],
        mandators: exportersData || [],
        opas: opasData || [],
        producers: producersData || [],
      } as unknown as Actor
    })
  }

  /**
   * Récupère les productions d'un producteur (actor_product_quantities)
   * Avec filtre optionnel par OPA
   * Par défaut, utilise la campagne active
   */
  async getProducerProductionQuantities(
    producerId: string,
    options: {
      opaId?: string
      campaignId?: string
    } = {}
  ) {
    const { opaId, campaignId } = options

    // Vérifier que le producteur existe et est bien de type PRODUCER
    const producer = await Actor.query()
      .where('id', producerId)
      .whereNull('deleted_at')
      .firstOrFail()

    if (producer.actorType !== ACTOR_TYPES_OBJECT.PRODUCER) {
      throw new Exception("L'acteur n'est pas un producteur.", {
        code: ActorErrorCodes.ACTOR_NOT_PRODUCER,
        status: 400,
      })
    }

    // Si aucune campagne n'est spécifiée, utiliser la campagne active
    let finalCampaignId = campaignId
    if (!finalCampaignId) {
      const activeCampaign = await Campaign.getActiveCampaign()
      if (activeCampaign) {
        finalCampaignId = activeCampaign.id
      }
    }

    // Construire la requête
    let query = db
      .from('actor_product_quantities')
      .where('actor_id', producerId)
      .select(
        'id',
        'actor_id',
        'campaign_id',
        'parcel_id',
        'opa_id',
        'quality',
        'total_weight',
        'total_bags',
        'created_at',
        'updated_at'
      )

    // Filtre par campagne (active par défaut ou spécifiée)
    if (finalCampaignId) {
      query = query.where('campaign_id', finalCampaignId)
    }

    // Filtre optionnel par OPA
    if (opaId) {
      query = query.where('opa_id', opaId)
    }

    const productions = await query

    // Grouper et calculer les totaux par qualité
    const totalsByQuality: Record<
      string,
      { quality: string; totalWeight: number; totalBags: number }
    > = {}
    let globalTotalWeight = 0
    let globalTotalBags = 0

    productions.forEach((prod) => {
      const quality = prod.quality
      const weight = Number(prod.total_weight) || 0
      const bags = Number(prod.total_bags) || 0

      // Ajouter aux totaux par qualité
      if (!totalsByQuality[quality]) {
        totalsByQuality[quality] = {
          quality,
          totalWeight: 0,
          totalBags: 0,
        }
      }
      totalsByQuality[quality].totalWeight += weight
      totalsByQuality[quality].totalBags += bags

      // Ajouter aux totaux globaux
      globalTotalWeight += weight
      globalTotalBags += bags
    })

    // Convertir l'objet en tableau
    const totalsByQualityArray = Object.values(totalsByQuality)

    return {
      productions,
      totalsByQuality: totalsByQualityArray,
      totals: {
        totalWeight: globalTotalWeight,
        totalBags: globalTotalBags,
      },
      campaignId: finalCampaignId,
    }
  }

  /**
   * Récupère les collectes d'un OPA (actor_product_quantities)
   * Par défaut, utilise la campagne active
   */
  async getOpaCollections(
    opaId: string,
    options: {
      campaignId?: string
    } = {}
  ) {
    const { campaignId } = options

    // Vérifier que l'OPA existe et est bien de type PRODUCERS (OPA)
    const opa = await Actor.query().where('id', opaId).whereNull('deleted_at').firstOrFail()

    if (opa.actorType !== ACTOR_TYPES_OBJECT.PRODUCERS) {
      throw new Exception("L'acteur n'est pas un OPA.", {
        code: ActorErrorCodes.ACTOR_NOT_OPA,
        status: 400,
      })
    }

    // Si aucune campagne n'est spécifiée, utiliser la campagne active
    let finalCampaignId = campaignId
    if (!finalCampaignId) {
      const activeCampaign = await Campaign.getActiveCampaign()
      if (activeCampaign) {
        finalCampaignId = activeCampaign.id
      }
    }

    // Construire la requête - Récupérer toutes les collectes de l'OPA
    let query = db
      .from('actor_product_quantities')
      .where('opa_id', opaId)
      .select(
        'id',
        'actor_id',
        'campaign_id',
        'parcel_id',
        'opa_id',
        'quality',
        'total_weight',
        'total_bags',
        'created_at',
        'updated_at'
      )

    // Filtre par campagne (active par défaut ou spécifiée)
    if (finalCampaignId) {
      query = query.where('campaign_id', finalCampaignId)
    }

    const collections = await query

    // Grouper et calculer les totaux par qualité
    const totalsByQuality: Record<
      string,
      { quality: string; totalWeight: number; totalBags: number }
    > = {}
    let globalTotalWeight = 0
    let globalTotalBags = 0

    collections.forEach((col) => {
      const quality = col.quality
      const weight = Number(col.total_weight) || 0
      const bags = Number(col.total_bags) || 0

      // Ajouter aux totaux par qualité
      if (!totalsByQuality[quality]) {
        totalsByQuality[quality] = {
          quality,
          totalWeight: 0,
          totalBags: 0,
        }
      }
      totalsByQuality[quality].totalWeight += weight
      totalsByQuality[quality].totalBags += bags

      // Ajouter aux totaux globaux
      globalTotalWeight += weight
      globalTotalBags += bags
    })

    // Convertir l'objet en tableau
    const totalsByQualityArray = Object.values(totalsByQuality)

    return {
      collections,
      totalsByQuality: totalsByQualityArray,
      totals: {
        totalWeight: globalTotalWeight,
        totalBags: globalTotalBags,
      },
      campaignId: finalCampaignId,
    }
  }
}
