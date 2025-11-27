import vine from '@vinejs/vine'

/**
 * Validateur pour la connexion
 */
export const loginValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(3).maxLength(50),
    password: vine.string().minLength(1),
  })
)

/**
 * Validateur pour l'enregistrement d'un utilisateur
 */
export const registerValidator = vine.compile(
  vine.object({
    familyName: vine.string().trim().minLength(2).maxLength(100),
    givenName: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().email().normalizeEmail(),
    phone: vine.string().optional(),
    role: vine.enum(['technical_admin', 'basin_admin', 'field_agent', 'actor_manager']),
    productionBasinId: vine.string().optional(),
    lang: vine.enum(['fr', 'en']).optional(),
  })
)

/**
 * Validateur pour la vérification OTP
 */
export const verifyOtpValidator = vine.compile(
  vine.object({
    otp: vine
      .string()
      .fixedLength(6)
      .regex(/^\d{6}$/),
    sessionToken: vine.string().minLength(10),
    userId: vine.string().minLength(1),
  })
)

/**
 * Validateur pour la vérification OTP
 */
export const resendOtpValidator = vine.compile(
  vine.object({
    sessionToken: vine.string().minLength(10),
    userId: vine.string().minLength(1),
  })
)

/**
 * Validateur pour le changement de mot de passe
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(1),
    newPassword: vine
      .string()
      .minLength(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .confirmed(),
  })
)

/**
 * Validateur pour l'initialisation de compte
 */
export const initializeAccountValidator = vine.compile(
  vine.object({
    userId: vine.string().minLength(1),
    sessionToken: vine.string().minLength(10),
    newPassword: vine
      .string()
      .minLength(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    securityQuestion1: vine.string().trim().minLength(2).maxLength(200),
    securityAnswer1: vine.string().trim().minLength(2).maxLength(100),
    securityQuestion2: vine.string().trim().minLength(2).maxLength(200),
    securityAnswer2: vine.string().trim().minLength(2).maxLength(100),
    securityQuestion3: vine.string().trim().minLength(2).maxLength(200),
    securityAnswer3: vine.string().trim().minLength(2).maxLength(100),
  })
)

/**
 * Validateur pour la récupération de nom d'utilisateur
 */
export const forgotUsernameValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
  })
)

/**
 * Validateur pour la récupération de mot de passe
 */
export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
  })
)

/**
 * Validateur pour obtenir les questions de sécurité
 */
export const getSecurityQuestionsValidator = vine.compile(
  vine.object({
    resetToken: vine.string().minLength(32),
  })
)

/**
 * Validateur pour la réinitialisation de mot de passe
 */
export const resetPasswordValidator = vine.compile(
  vine.object({
    resetToken: vine.string().minLength(32),
    answers: vine.array(
      vine.object({
        id: vine.number().min(1).max(3),
        answer: vine.string().trim().minLength(1),
      })
    ),
    newPassword: vine
      .string()
      .minLength(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .confirmed(),
  })
)

/**
 * Validateur pour la vérification des réponses aux questions de sécurité
 */
export const verifySecurityAnswersValidator = vine.compile(
  vine.object({
    resetToken: vine.string().minLength(32),
    answers: vine.array(
      vine.object({
        id: vine.number().min(1).max(3),
        answer: vine.string().trim().minLength(1),
      })
    ),
  })
)

/**
 * Validateur pour la mise à jour du profil
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    familyName: vine.string().trim().minLength(2).maxLength(100).optional(),
    givenName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine.string().email().normalizeEmail().optional(),
    phone: vine.string().optional(),
    lang: vine.enum(['fr', 'en']).optional(),
  })
)

/**
 * Validateur pour la configuration des questions de sécurité
 */
export const securityQuestionsValidator = vine.compile(
  vine.object({
    securityQuestion1: vine.string().trim().minLength(10).maxLength(255),
    securityAnswer1: vine.string().trim().minLength(2).maxLength(255),
    securityQuestion2: vine.string().trim().minLength(10).maxLength(255),
    securityAnswer2: vine.string().trim().minLength(2).maxLength(255),
    securityQuestion3: vine.string().trim().minLength(10).maxLength(255),
    securityAnswer3: vine.string().trim().minLength(2).maxLength(255),
  })
)
