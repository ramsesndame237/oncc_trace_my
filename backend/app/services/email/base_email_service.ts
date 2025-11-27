import env from '#start/env'

/**
 * Service de base pour tous les services d'email
 * Contient les configurations communes
 */
export class BaseEmailService {
  /**
   * Récupère les variables d'environnement pour les emails
   */
  protected static getEmailConfig() {
    const fromEmail = env.get('SENDER_EMAIL') || 'noreply@oncc.cm'
    const fromName = env.get('SENDER_NAME') || env.get('APP_NAME', 'ONCC TRACE')

    return {
      fromEmail,
      fromName,
      appName: env.get('APP_NAME', 'ONCC TRACE'),
      supportEmail: env.get('SUPPORT_EMAIL') || 'support@oncc.cm',
      supportPhone: env.get('SUPPORT_PHONE') || undefined, // Ne pas afficher de valeur par défaut
      frontendUrl: env.get('FRONTEND_URL', 'http://localhost:3000'),
      year: new Date().getFullYear(),
    }
  }
}
