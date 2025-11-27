import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER', 'smtp') as 'smtp' | 'sendgrid' | 'log',

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    // Configuration SMTP pour développement (MailHog/MailCatcher)
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'localhost'),
      port: Number(env.get('SMTP_PORT', '1025')),
      auth:
        env.get('SMTP_USER') || env.get('SMTP_USERNAME')
          ? {
              type: 'login',
              user: env.get('SMTP_USER') || env.get('SMTP_USERNAME', ''),
              pass: env.get('SMTP_PASSWORD', ''),
            }
          : undefined,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    }),

    // Configuration SendGrid pour production
    sendgrid: transports.smtp({
      host: env.get('SMTP_HOST', 'smtp.sendgrid.net'),
      port: Number(env.get('SMTP_PORT', '587')),
      auth: {
        type: 'login',
        user: env.get('SMTP_USER', 'apikey'),
        pass: env.get('SENDGRID_API_KEY', ''),
      },
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    }),

    // Configuration de test (logs uniquement)
    log: transports.smtp({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
      auth: undefined,
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
