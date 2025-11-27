/**
 * Événement: Email de bienvenue à un manager d'acteur
 */
export interface ActorManagerWelcomePayload {
  email: string
  userName: string
  username: string
  tempPassword: string
  actorInfo: {
    name: string
    type: string
    location?: string
  }
}
