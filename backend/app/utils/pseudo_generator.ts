import User from '#models/user'

/**
 * Helper pour la génération de noms d'utilisateur uniques
 */
export class UsernameGenerator {
  /**
   * Générer un nom d'utilisateur unique basé sur le prénom et le nom
   * @param givenName - Le prénom de l'utilisateur
   * @param familyName - Le nom de famille de l'utilisateur
   * @param excludeId - ID d'utilisateur à exclure de la vérification (pour les mises à jour)
   * @returns Promise<string> - Le nom d'utilisateur unique généré
   */
  static async generateUnique(
    givenName: string,
    familyName: string,
    excludeId?: string
  ): Promise<string> {
    // Nettoyer et normaliser les chaînes
    const cleanGivenName = givenName.trim().toLowerCase()
    const cleanFamilyName = familyName.trim().toLowerCase()

    // Extraire la première lettre du prénom (gérer les prénoms composés)
    const firstLetter = cleanGivenName.charAt(0)

    // Extraire le premier nom (gérer les noms composés)
    const firstName = cleanFamilyName.split(/[\s-]+/)[0]

    // Générer le nom d'utilisateur de base
    let baseUsername = firstLetter + '.' + firstName

    // Vérifier que le nom d'utilisateur de base accepte les points
    baseUsername = this.normalizeString(baseUsername)

    // Vérifier l'unicité
    let username = baseUsername
    let counter = 1

    while (await this.usernameExists(username, excludeId)) {
      counter++
      username = baseUsername + counter
    }

    return username
  }

  /**
   * Vérifier si un nom d'utilisateur existe déjà dans la base de données
   * @param username - Le nom d'utilisateur à vérifier
   * @param excludeId - ID d'utilisateur à exclure de la vérification
   * @returns Promise<boolean> - true si le nom d'utilisateur existe déjà
   */
  static async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    const query = User.query().where('username', username)

    if (excludeId) {
      query.whereNot('id', excludeId)
    }

    const existingUser = await query.first()
    return !!existingUser
  }

  /**
   * Normaliser une chaîne en supprimant les accents et caractères spéciaux
   * @param str - La chaîne à normaliser
   * @returns string - La chaîne normalisée
   */
  static normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9.]/g, '') // Garder seulement lettres, chiffres et points
  }

  /**
   * Valider un pseudo selon les règles métier
   * @param pseudo - Le pseudo à valider
   * @returns { isValid: boolean, errors: string[] }
   */
  static validatePseudo(pseudo: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifications de base
    if (!pseudo || pseudo.trim().length === 0) {
      errors.push('Le pseudo ne peut pas être vide')
    }

    if (pseudo.length < 2) {
      errors.push('Le pseudo doit contenir au moins 2 caractères')
    }

    if (pseudo.length > 50) {
      errors.push('Le pseudo ne peut pas dépasser 50 caractères')
    }

    // Vérifier que le pseudo ne contient que des caractères autorisés
    if (!/^[a-z0-9]+$/.test(pseudo)) {
      errors.push('Le pseudo ne peut contenir que des lettres minuscules et des chiffres')
    }

    // Vérifier qu'il commence par une lettre
    if (!/^[a-z]/.test(pseudo)) {
      errors.push('Le pseudo doit commencer par une lettre')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Générer plusieurs suggestions de pseudos basées sur le prénom et nom
   * @param prenom - Le prénom de l'utilisateur
   * @param nom - Le nom de famille de l'utilisateur
   * @param count - Nombre de suggestions à générer (défaut: 5)
   * @returns Promise<string[]> - Liste de pseudos suggérés
   */
  static async generateSuggestions(
    prenom: string,
    nom: string,
    count: number = 5
  ): Promise<string[]> {
    const suggestions: string[] = []
    const cleanPrenom = prenom.trim().toLowerCase()
    const cleanNom = nom.trim().toLowerCase()

    // Stratégies de génération
    const strategies = [
      // Première lettre prénom + nom complet
      () => this.normalizeString(cleanPrenom.charAt(0) + cleanNom.replace(/[\s-]+/g, '')),
      // Prénom complet + première lettre nom
      () => this.normalizeString(cleanPrenom.replace(/[\s-]+/g, '') + cleanNom.charAt(0)),
      // Premières lettres de chaque partie du prénom + nom
      () => {
        const prenomParts = cleanPrenom.split(/[\s-]+/)
        const prenomInitials = prenomParts.map((part) => part.charAt(0)).join('')
        return this.normalizeString(prenomInitials + cleanNom.split(/[\s-]+/)[0])
      },
      // Prénom + première lettre nom
      () => this.normalizeString(cleanPrenom.split(/[\s-]+/)[0] + cleanNom.charAt(0)),
      // Initiales + année courante
      () => {
        const initials = cleanPrenom.charAt(0) + cleanNom.charAt(0)
        return this.normalizeString(initials + new Date().getFullYear().toString())
      },
    ]

    for (const strategy of strategies) {
      if (suggestions.length >= count) break

      try {
        let basePseudo = strategy()
        let pseudo = basePseudo
        let counter = 1

        // Générer des variantes jusqu'à trouver des pseudos uniques
        while (suggestions.length < count && counter <= 10) {
          if (!(await this.usernameExists(pseudo))) {
            suggestions.push(pseudo)
          }
          counter++
          pseudo = basePseudo + counter
        }
      } catch (error) {
        // Ignorer les erreurs de stratégie et continuer
        continue
      }
    }

    return suggestions.slice(0, count)
  }

  /**
   * Générer un pseudo temporaire pour les tests
   * @param prefix - Préfixe optionnel (défaut: 'test')
   * @returns Promise<string> - Pseudo temporaire unique
   */
  static async generateTemporary(prefix: string = 'test'): Promise<string> {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    let pseudo = `${prefix}${timestamp}${random}`

    // S'assurer que le pseudo est unique
    let counter = 1
    while (await this.usernameExists(pseudo)) {
      counter++
      pseudo = `${prefix}${timestamp}${random}${counter}`
    }

    return pseudo
  }
}

/**
 * Fonction helper raccourcie pour la génération de pseudo unique
 * @param prenom - Le prénom de l'utilisateur
 * @param nom - Le nom de famille de l'utilisateur
 * @param excludeId - ID d'utilisateur à exclure de la vérification
 * @returns Promise<string> - Le pseudo unique généré
 */
export const generateUniquePseudo = (
  givenName: string,
  familyName: string,
  excludeId?: string
): Promise<string> => {
  return UsernameGenerator.generateUnique(givenName, familyName, excludeId)
}

/**
 * Fonction helper pour vérifier l'existence d'un pseudo
 * @param pseudo - Le pseudo à vérifier
 * @param excludeId - ID d'utilisateur à exclure
 * @returns Promise<boolean> - true si le pseudo existe
 */
export const usernameExists = (username: string, excludeId?: string): Promise<boolean> => {
  return UsernameGenerator.usernameExists(username, excludeId)
}
