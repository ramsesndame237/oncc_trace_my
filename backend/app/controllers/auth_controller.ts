import Session from '#models/session'
import User from '#models/user'
import UserService from '#services/user_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import emitter from '@adonisjs/core/services/emitter'
import {
  changePasswordValidator,
  forgotPasswordValidator,
  forgotUsernameValidator,
  getSecurityQuestionsValidator,
  initializeAccountValidator,
  loginValidator,
  resendOtpValidator,
  resetPasswordValidator,
  verifyOtpValidator,
  verifySecurityAnswersValidator,
} from '#validators/auth'
import {
  updateSelfNameValidator,
  updateSelfOtherValidator,
  updateSelfPasswordValidator,
} from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class AuthController {
  /**
   * Connexion utilisateur avec pseudo/mot de passe
   */
  async login({ request, response }: HttpContext) {
    try {
      const { username, password } = await request.validateUsing(loginValidator)

      // Utiliser la méthode verifyCredentials du mixin AuthFinder
      // qui gère automatiquement la recherche et la vérification du mot de passe
      let user: User
      try {
        user = await User.verifyCredentials(username, password)
      } catch (error) {
        console.log('error', error)
        return ApiResponse.authError(response, ErrorCodes.AUTH_LOGIN_INVALID_CREDENTIALS)
      }

      // Charger l'acteur associé (si existe)
      await user.load('actor')

      // Vérifier le statut du compte utilisateur
      if (!user.isActive()) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_LOGIN_ACCOUNT_INACTIVE)
      }

      // Vérifier le statut de l'acteur si l'utilisateur est un actor_manager
      if (user.role === 'actor_manager' && user.actor) {
        if (user.actor.status === 'inactive') {
          return ApiResponse.authError(response, ErrorCodes.AUTH_LOGIN_ACTOR_INACTIVE)
        }
      }

      // Vérifier si l'utilisateur utilise encore le mot de passe par défaut
      const defaultPassword = process.env.DEFAULT_PASSWORD || '12345678'
      const isUsingDefaultPassword = await hash.verify(user.passwordHash, defaultPassword)

      // En mode QA, ignorer l'initialisation requise pour les mots de passe par défaut
      const isQaMode = process.env.DEPLOY_MODE === 'qa'

      if (isUsingDefaultPassword && !isQaMode) {
        const sessionToken = await Session.generateToken(user.id, 'init_account_session')
        return ApiResponse.success(response, SuccessCodes.AUTH_ACCOUNT_TO_BE_INITIALIZED, {
          user: {
            id: user.id,
            username: user.username,
            givenName: user.givenName,
            familyName: user.familyName,
            email: user.email,
            role: user.role,
            language: user.lang,
            status: user.status,
            phone: user.phone,
            position: user.position,
            productionBasin: user.productionBasin,
          },
          sessionToken,
          requiresInitialization: true,
        })
      }

      // Générer et envoyer l'OTP
      const otp = await Session.generateOtpCode(user.id)
      console.log('OTP:', otp)
      const sessionToken = await Session.generateToken(user.id, 'otp_session')

      // Stocker les métadonnées de session temporaires pour la validation
      await Session.storeSessionMetadata(user.id, {
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
        loginAt: DateTime.now(),
      })

      // Envoyer l'OTP par email
      try {
        await this.sendOtpEmail(user.email, otp, user.givenName)
      } catch (emailError) {
        console.error('Erreur envoi email OTP:', emailError)
        // return ApiResponse.serverError(response, ErrorCodes.AUTH_OTP_SEND_FAILED)
      }

      return ApiResponse.success(response, SuccessCodes.AUTH_LOGIN_OTP_SENT, {
        sessionToken, // Retourner la clé de session pour la vérification
        requiresInitialization: false,
        user: {
          id: user.id,
          username: user.username,
          givenName: user.givenName,
          familyName: user.familyName,
          email: user.email,
          role: user.role,
          language: user.lang,
          status: user.status,
          phone: user.phone,
          position: user.position,
          productionBasin: user.productionBasin,
        },
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur login:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_LOGIN_FAILED)
    }
  }

  /**
   * Vérification de l'OTP et finalisation de la connexion
   */
  async verifyOtp({ request, response }: HttpContext) {
    try {
      const { otp, sessionToken, userId } = await request.validateUsing(verifyOtpValidator)

      // Récupérer l'utilisateur
      const user = await User.find(userId)
      if (!user) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Extraire l'ID utilisateur de la clé de session
      const userIdMatch = Session.verifyToken(userId, 'otp_session', sessionToken)
      if (!userIdMatch) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_OTP_SESSION_INVALID)
      }

      // Vérifier l'OTP dans Redis
      const isOtpValid = await Session.verifyOtpCode(userId, otp)
      if (!isOtpValid) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_OTP_INVALID)
      }

      // Charger les relations nécessaires
      await user.load('productionBasin')
      await user.load('actor')

      // Générer le token d'accès
      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '30 days',
      })

      return ApiResponse.success(response, SuccessCodes.AUTH_LOGIN_SUCCESS, {
        user: {
          id: user.id,
          username: user.username,
          familyName: user.familyName,
          givenName: user.givenName,
          email: user.email,
          role: user.role,
          lang: user.lang,
          actor: user.actor,
          phone: user.phone,
          position: user.position,
          productionBasin: user.productionBasin,
        },
        token: {
          type: 'Bearer',
          value: token.value!.release(),
          expiresAt: token.expiresAt,
        },
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur vérification OTP:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_OTP_VERIFY_FAILED)
    }
  }

  /**
   * Renvoyer un nouveau code OTP
   */
  async resendOtp({ request, response }: HttpContext) {
    try {
      const { sessionToken, userId } = await request.validateUsing(resendOtpValidator)

      // Récupérer l'utilisateur
      const user = await User.find(userId)
      if (!user) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Vérifier la validité du token de session
      const userIdMatch = Session.verifyToken(userId, 'otp_session', sessionToken)
      if (!userIdMatch) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_OTP_SESSION_INVALID)
      }

      // Vérifier que le compte est toujours actif
      if (!user.isActive()) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_LOGIN_ACCOUNT_INACTIVE)
      }

      // Supprimer l'ancien code OTP pour le rendre réutilisable
      await Session.deleteOtpToken(userId)

      // Générer et envoyer un nouveau code OTP
      const newOtp = await Session.generateOtpCode(user.id)

      // Envoyer le nouveau OTP par email
      try {
        await this.sendOtpEmail(user.email, newOtp, user.givenName)
      } catch (emailError) {
        console.error('Erreur envoi email OTP:', emailError)
        // return ApiResponse.serverError(response, ErrorCodes.AUTH_OTP_SEND_FAILED)
      }

      return ApiResponse.success(response, SuccessCodes.AUTH_LOGIN_OTP_SENT, {
        message: 'Un nouveau code OTP a été envoyé à votre adresse email',
        user: {
          id: user.id,
          username: user.username,
          givenName: user.givenName,
          familyName: user.familyName,
          email: user.email,
          role: user.role,
          language: user.lang,
          status: user.status,
          phone: user.phone,
          position: user.position,
          productionBasin: user.productionBasin,
        },
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur renvoi OTP:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_OTP_SEND_FAILED)
    }
  }

  /**
   * Initialisation du compte utilisateur (première connexion)
   */
  async initializeAccount({ request, response }: HttpContext) {
    try {
      const {
        userId,
        newPassword,
        sessionToken,
        securityQuestion1,
        securityAnswer1,
        securityQuestion2,
        securityAnswer2,
        securityQuestion3,
        securityAnswer3,
      } = await request.validateUsing(initializeAccountValidator)

      // Extraire l'ID utilisateur de la clé de session
      // Extraire l'ID utilisateur de la clé de session
      const userIdMatch = Session.verifyToken(userId, 'init_account_session', sessionToken)
      if (!userIdMatch) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_INIT_TOKEN_INVALID)
      }

      const user = await User.find(userId)
      if (!user) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Validation des données requises
      if (!newPassword || newPassword.length < 8) {
        return ApiResponse.error(
          response,
          ErrorCodes.VALIDATION_INVALID_PASSWORD_FORMAT,
          400,
          'Le nouveau mot de passe doit contenir au moins 8 caractères'
        )
      }

      // Validation des questions de sécurité (au moins 2 requises)
      const questions = [
        { question: securityQuestion1, answer: securityAnswer1 },
        { question: securityQuestion2, answer: securityAnswer2 },
        { question: securityQuestion3, answer: securityAnswer3 },
      ].filter((q) => q.question && q.answer)

      if (questions.length < 2) {
        return ApiResponse.error(
          response,
          ErrorCodes.AUTH_SECURITY_QUESTIONS_SETUP_FAILED,
          400,
          'Au moins 2 questions de sécurité sont requises'
        )
      }

      // Mettre à jour le mot de passe
      user.passwordHash = newPassword
      user.passwordChangedAt = DateTime.now()
      user.mustChangePassword = false

      // Mettre à jour les questions de sécurité
      if (securityQuestion1 && securityAnswer1) {
        user.securityQuestion1 = securityQuestion1
        user.securityAnswer1Hash = await hash.make(securityAnswer1.toLowerCase().trim())
      }
      if (securityQuestion2 && securityAnswer2) {
        user.securityQuestion2 = securityQuestion2
        user.securityAnswer2Hash = await hash.make(securityAnswer2.toLowerCase().trim())
      }
      if (securityQuestion3 && securityAnswer3) {
        user.securityQuestion3 = securityQuestion3
        user.securityAnswer3Hash = await hash.make(securityAnswer3.toLowerCase().trim())
      }

      await user.save()

      // Émettre un événement pour envoyer une notification d'initialisation de compte en arrière-plan
      emitter.emit('auth:account-initialization', {
        email: user.email,
        userName: `${user.givenName} ${user.familyName}`,
      })

      return ApiResponse.success(response, SuccessCodes.AUTH_ACCOUNT_INITIALIZED, {
        user: {
          id: user.id,
          username: user.username,
          givenName: user.givenName,
          familyName: user.familyName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          lang: user.lang,
          status: user.status,
          position: user.position,
          productionBasin: user.productionBasin,
        },
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur initialisation compte:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_INIT_FAILED)
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const token = auth.user?.currentAccessToken

      if (token) {
        await User.accessTokens.delete(user, token.identifier)
      }

      // Nettoyer les sessions Redis (OTP, métadonnées, tokens de réinitialisation)
      await Session.clearUserSessions(user.id)

      return ApiResponse.success(response, SuccessCodes.AUTH_LOGOUT_SUCCESS)
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_LOGOUT_FAILED)
    }
  }

  /**
   * Changement de mot de passe
   */
  async changePassword({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await hash.verify(user.passwordHash, currentPassword)
      if (!isCurrentPasswordValid) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_PASSWORD_CHANGE_CURRENT_INVALID)
      }

      // Mettre à jour le mot de passe
      user.passwordHash = await hash.make(newPassword)
      user.passwordChangedAt = DateTime.now()
      user.mustChangePassword = false
      await user.save()

      // Émettre un événement pour envoyer une notification de changement de mot de passe en arrière-plan
      emitter.emit('auth:password-change', {
        email: user.email,
        userName: `${user.givenName} ${user.familyName}`,
      })

      return ApiResponse.success(response, SuccessCodes.AUTH_PASSWORD_CHANGED)
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur changement mot de passe:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_PASSWORD_CHANGE_FAILED)
    }
  }

  /**
   * Mise à jour du profil de l'utilisateur connecté
   * Supporte 3 types de modifications:
   * - type: 'name' -> givenName, familyName
   * - type: 'password' -> currentPassword, newPassword
   * - type: 'other' -> email, phone, position, lang
   */
  async updateSelf({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = request.body()
      const userService = new UserService()

      let validatedData: any

      // Valider selon le type de modification
      switch (data.type) {
        case 'name':
          validatedData = await request.validateUsing(updateSelfNameValidator)
          // Mettre à jour le nom
          await userService.update(
            user.id,
            {
              givenName: validatedData.givenName,
              familyName: validatedData.familyName,
            },
            {
              userId: user.id,
              userRole: user.role,
              ipAddress: request.ip(),
              userAgent: request.header('user-agent'),
            }
          )
          break

        case 'password':
          validatedData = await request.validateUsing(updateSelfPasswordValidator)
          // Vérifier le mot de passe actuel
          const isCurrentPasswordValid = await hash.verify(
            user.passwordHash,
            validatedData.currentPassword
          )
          if (!isCurrentPasswordValid) {
            return ApiResponse.authError(response, ErrorCodes.AUTH_PASSWORD_CHANGE_CURRENT_INVALID)
          }
          // Mettre à jour le mot de passe
          user.passwordHash = await hash.make(validatedData.newPassword)
          user.passwordChangedAt = DateTime.now()
          user.mustChangePassword = false
          await user.save()

          // Émettre un événement pour envoyer une notification en arrière-plan
          emitter.emit('auth:password-change', {
            email: user.email,
            userName: `${user.givenName} ${user.familyName}`,
          })
          break

        case 'other':
          validatedData = await request.validateUsing(updateSelfOtherValidator)
          // Mettre à jour les autres informations (email, phone, position, lang)
          const updateData: any = {}
          if (validatedData.email !== undefined) updateData.email = validatedData.email
          if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
          if (validatedData.position !== undefined) updateData.position = validatedData.position
          if (validatedData.lang !== undefined) updateData.lang = validatedData.lang

          await userService.update(user.id, updateData, {
            userId: user.id,
            userRole: user.role,
            ipAddress: request.ip(),
            userAgent: request.header('user-agent'),
          })
          break

        default:
          return ApiResponse.error(
            response,
            ErrorCodes.VALIDATION_FAILED,
            400,
            "Type de modification invalide. Utilisez 'name', 'password' ou 'other'."
          )
      }

      // Récupérer l'utilisateur mis à jour
      const updatedUser = await User.find(user.id)
      if (!updatedUser) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      await updatedUser.load('productionBasin')
      await updatedUser.load('actor')

      return ApiResponse.success(response, SuccessCodes.USER_UPDATED, {
        id: updatedUser.id,
        username: updatedUser.username,
        givenName: updatedUser.givenName,
        familyName: updatedUser.familyName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        position: updatedUser.position,
        role: updatedUser.role,
        lang: updatedUser.lang,
        productionBasin: updatedUser.productionBasin,
        actor: updatedUser.actor,
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur mise à jour profil:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_UPDATE_FAILED)
    }
  }

  /**
   * Récupération de nom d'utilisateur par email
   */
  async forgotUsername({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(forgotUsernameValidator)

      const user = await User.findBy('email', email)
      if (!user) {
        // Ne pas révéler si l'utilisateur existe ou non pour des raisons de sécurité
        // Utiliser le même message de succès
        return ApiResponse.success(
          response,
          SuccessCodes.AUTH_PASSWORD_RESET_EMAIL_SENT,
          undefined,
          200,
          "Si ce compte existe, le nom d'utilisateur a été envoyé par email"
        )
      }

      console.log("Envoyer le nom d'utilisateur par email", user.username)
      // Émettre un événement pour envoyer le nom d'utilisateur par email en arrière-plan
      emitter.emit('auth:username-recovery', {
        email: user.email,
        username: user.username,
        userName: `${user.givenName} ${user.familyName}`,
      })

      return ApiResponse.success(
        response,
        SuccessCodes.AUTH_PASSWORD_RESET_EMAIL_SENT,
        undefined,
        200,
        "Si ce compte existe, le nom d'utilisateur a été envoyé par email"
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error("Erreur récupération nom d'utilisateur:", error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_PASSWORD_FORGOT_SEND_FAILED)
    }
  }

  /**
   * Récupération de mot de passe via email avec lien de réinitialisation
   */
  async forgotPassword({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(forgotPasswordValidator)

      const user = await User.findBy('email', email)
      if (!user) {
        // Ne pas révéler si l'utilisateur existe ou non
        return ApiResponse.success(
          response,
          SuccessCodes.AUTH_PASSWORD_RESET_EMAIL_SENT,
          undefined,
          200,
          'Si ce compte existe, un lien de réinitialisation a été envoyé par email'
        )
      }

      // Vérifier que l'utilisateur a des questions de sécurité configurées
      const hasSecurityQuestions = user.securityQuestion1 && user.securityQuestion2
      if (!hasSecurityQuestions) {
        return ApiResponse.error(
          response,
          ErrorCodes.AUTH_SECURITY_QUESTIONS_NOT_FOUND,
          400,
          "Ce compte n'a pas de questions de sécurité configurées. Contactez l'administrateur."
        )
      }

      // Générer un token de réinitialisation sécurisé
      const resetToken = Session.generateSecureToken(32)

      // Stocker le token dans Redis avec expiration de 30 minutes
      await Session.storePasswordResetToken(resetToken, user.id, 30)

      console.log('Envoyer le lien de réinitialisation par email', resetToken)

      // Émettre un événement pour envoyer le lien de réinitialisation par email en arrière-plan
      emitter.emit('auth:password-reset-link', {
        email: user.email,
        resetToken: resetToken,
        userName: `${user.givenName} ${user.familyName}`,
      })

      return ApiResponse.success(
        response,
        SuccessCodes.AUTH_PASSWORD_RESET_EMAIL_SENT,
        undefined,
        200,
        'Si ce compte existe, un lien de réinitialisation a été envoyé par email'
      )
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur récupération mot de passe:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_PASSWORD_FORGOT_SEND_FAILED)
    }
  }

  /**
   * Obtenir les questions de sécurité pour un token de réinitialisation
   */
  async getSecurityQuestions({ request, response }: HttpContext) {
    try {
      const { resetToken } = await request.validateUsing(getSecurityQuestionsValidator)

      // Récupérer et valider le token de réinitialisation depuis Redis
      const passwordReset = await Session.getPasswordResetToken(resetToken)
      if (!passwordReset) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_INVALID)
      }

      const user = await User.find(passwordReset.userId)
      if (!user) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Retourner les questions de sécurité (sans les réponses)
      const securityQuestions = [
        { id: 1, question: user.securityQuestion1 },
        { id: 2, question: user.securityQuestion2 },
        { id: 3, question: user.securityQuestion3 },
      ].filter((q) => q.question)

      return ApiResponse.success(response, SuccessCodes.AUTH_SECURITY_QUESTIONS_SETUP, {
        securityQuestions,
        userInfo: {
          username: user.username,
          email: user.email,
          givenName: user.givenName,
          familyName: user.familyName,
        },
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur récupération questions sécurité:', error)
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.AUTH_SECURITY_QUESTIONS_NOT_FOUND
      )
    }
  }

  /**
   * Vérifier les réponses aux questions de sécurité sans réinitialiser le mot de passe
   */
  async verifySecurityQuestionsAnswers({ request, response }: HttpContext) {
    try {
      const { resetToken, answers } = await request.validateUsing(verifySecurityAnswersValidator)

      // Récupérer et valider le token de réinitialisation depuis Redis
      const passwordReset = await Session.getPasswordResetToken(resetToken)
      if (!passwordReset) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_INVALID)
      }

      const user = await User.find(passwordReset.userId)
      if (!user) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Vérifier les réponses aux questions de sécurité
      const isValid = await this.verifySecurityAnswers(user, answers)
      if (!isValid) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_SECURITY_QUESTIONS_INVALID_ANSWERS)
      }

      return ApiResponse.success(response, SuccessCodes.AUTH_SECURITY_QUESTIONS_SETUP, {
        verified: true,
        userInfo: {
          username: user.username,
          email: user.email,
          givenName: user.givenName,
          familyName: user.familyName,
        },
      })
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur vérification réponses sécurité:', error)
      return ApiResponse.fromException(
        response,
        error,
        ErrorCodes.AUTH_SECURITY_QUESTIONS_INVALID_ANSWERS
      )
    }
  }

  /**
   * Réinitialisation du mot de passe après vérification des questions de sécurité
   */
  async resetPassword({ request, response }: HttpContext) {
    try {
      const { answers, newPassword, resetToken } =
        await request.validateUsing(resetPasswordValidator)

      // Récupérer et valider le token de réinitialisation depuis Redis
      const passwordReset = await Session.getPasswordResetToken(resetToken)
      if (!passwordReset) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_INVALID)
      }

      const user = await User.find(passwordReset.userId)
      if (!user) {
        return ApiResponse.notFoundError(response, ErrorCodes.USER_NOT_FOUND)
      }

      // Vérifier les réponses aux questions de sécurité
      const isValid = await this.verifySecurityAnswers(user, answers)
      if (!isValid) {
        return ApiResponse.authError(response, ErrorCodes.AUTH_SECURITY_QUESTIONS_INVALID_ANSWERS)
      }

      // Réinitialiser le mot de passe
      user.passwordHash = newPassword
      user.passwordChangedAt = DateTime.now()
      user.mustChangePassword = false
      await user.save()

      // Émettre un événement pour envoyer une notification de changement de mot de passe en arrière-plan
      emitter.emit('auth:password-change', {
        email: user.email,
        userName: `${user.givenName} ${user.familyName}`,
      })

      // Supprimer le token de réinitialisation utilisé
      await Session.deletePasswordResetToken(resetToken)

      return ApiResponse.success(response, SuccessCodes.AUTH_PASSWORD_RESET_SUCCESS)
    } catch (error) {
      // Gérer les erreurs de validation
      if (error.messages) {
        return ApiResponse.fromVineValidationError(response, error)
      }

      console.error('Erreur réinitialisation mot de passe:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.AUTH_PASSWORD_RESET_FAILED)
    }
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      await user.load('productionBasin')
      await user.load('actor')

      return ApiResponse.success(response, SuccessCodes.USER_DETAILS_SUCCESS, {
        id: user.id,
        username: user.username,
        givenName: user.givenName,
        familyName: user.familyName,
        email: user.email,
        phone: user.phone,
        position: user.position,
        role: user.role,
        lang: user.lang,
        status: user.status,
        productionBasin: user.productionBasin,
        actor: user.actor,
        mustChangePassword: user.mustChangePasswordOnLogin(),
      })
    } catch (error) {
      console.error('Erreur récupération profil utilisateur:', error)
      return ApiResponse.fromException(response, error, ErrorCodes.USER_NOT_FOUND)
    }
  }

  /**
   * Méthodes utilitaires privées
   */
  private async sendOtpEmail(email: string, otp: string, givenName: string) {
    // Émettre un événement pour envoyer l'OTP en arrière-plan
    emitter.emit('auth:otp', {
      email: email,
      otpCode: otp,
      userName: givenName,
    })

    // Toujours retourner true car l'événement a été émis avec succès
    // Les échecs d'envoi seront gérés dans le listener
    return true
  }

  private async verifySecurityAnswers(
    user: User,
    answers: { id: number; answer: string }[]
  ): Promise<boolean> {
    for (const answer of answers) {
      let storedHash: string | null = null

      switch (answer.id) {
        case 1:
          storedHash = user.securityAnswer1Hash
          break
        case 2:
          storedHash = user.securityAnswer2Hash
          break
        case 3:
          storedHash = user.securityAnswer3Hash
          break
      }

      if (!storedHash) {
        return false
      }

      const isValid = await hash.verify(storedHash, answer.answer.toLowerCase().trim())
      if (!isValid) {
        return false
      }
    }

    return true
  }
}
