/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test', 'qa'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  DEFAULT_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring QA environment
  |----------------------------------------------------------
  */
  QA_DEFAULT_OTP: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Redis connection
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_DB: Env.schema.number.optional(),
  REDIS_SESSION_DB: Env.schema.number.optional(),
  REDIS_CACHE_DB: Env.schema.number.optional(),
  REDIS_KEY_PREFIX: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring email sending
  |----------------------------------------------------------
  */
  MAIL_MAILER: Env.schema.string.optional(),

  // Configuration SendGrid
  SENDGRID_API_KEY: Env.schema.string.optional(),
  SENDER_EMAIL: Env.schema.string.optional(), // Email d'envoi
  SENDER_NAME: Env.schema.string.optional(), // Nom de l'expéditeur

  // Configuration SMTP générique
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.string.optional(),
  SMTP_USER: Env.schema.string.optional(), // Utilisateur SMTP (pour SendGrid: 'apikey')
  SMTP_USERNAME: Env.schema.string.optional(), // Deprecated: Use SMTP_USER
  SMTP_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for application branding and support
  |----------------------------------------------------------
  */
  APP_NAME: Env.schema.string.optional(),
  SUPPORT_EMAIL: Env.schema.string.optional(),
  SUPPORT_PHONE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for frontend URL
  |----------------------------------------------------------
  */
  FRONTEND_URL: Env.schema.string.optional(),
})
