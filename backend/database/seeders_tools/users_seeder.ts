import Actor from '#models/actor'
import ProductionBasin from '#models/production_basin'
import User from '#models/user'
import { generateUniquePseudo } from '#utils/pseudo_generator'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import fs from 'node:fs'
import path from 'node:path'

export default class extends BaseSeeder {
  async run() {
    console.log("👥 Début de l'importation des utilisateurs depuis le CSV...")

    // Déterminer le mode de seed (test ou prod)
    const seedMode = process.env.SEED_MODE || 'dev'
    console.log(`📋 Mode de seed: ${seedMode}`)

    // Créer les bassins de production de base s'ils n'existent pas
    await this.ensureProductionBasins()

    // Créer des acteurs de base pour les store managers s'ils n'existent pas
    await this.ensureActors()

    // Chemin vers le fichier CSV selon le mode
    const csvPath = path.join(process.cwd(), 'seed_data', 'auto', seedMode, 'users.csv')

    if (!fs.existsSync(csvPath)) {
      console.error('❌ Fichier CSV non trouvé:', csvPath)
      return
    }

    // Lire et parser le fichier CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter((line) => line.trim())

    console.log(`📄 Fichier CSV trouvé avec ${lines.length - 1} lignes de données`)

    // Traiter les lignes (ignorer l'en-tête)
    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      let role = 'unknown' // Valeur par défaut pour éviter les erreurs de portée

      try {
        // Parser la ligne CSV (gérer les guillemets et virgules)
        const values = this.parseCSVLine(line)

        if (values.length < 5) {
          console.warn(`⚠️  Ligne ${i + 1} ignorée: données insuffisantes`)
          continue
        }

        const [familyName, givenName, email, phone, roleValue] = values
        role = roleValue.trim() // Assigner à la variable de portée supérieure

        // Vérifier si l'utilisateur existe déjà (par email)
        let user = await User.query().where('email', email.trim()).first()

        const username = await generateUniquePseudo(givenName.trim(), familyName.trim())

        const usernameUnique = await User.query().where('username', username).first()

        if (user && !usernameUnique) {
          // Mettre à jour l'utilisateur existant
          user.familyName = familyName.trim()
          user.givenName = givenName.trim()
          user.phone = phone.trim() || null
          user.role = role as any
          user.status = 'active'

          // En mode QA, réinitialiser le mot de passe par défaut pour tous les utilisateurs
          const isQaMode = process.env.DEPLOY_MODE === 'qa'
          if (isQaMode) {
            const defaultPassword = process.env.DEFAULT_PASSWORD || '12345678'
            user.passwordHash = defaultPassword
            user.mustChangePassword = true
            console.log(`🔧 Mode QA: Mot de passe réinitialisé pour ${email}`)
          }

          // Gérer les contraintes pour la mise à jour
          await this.handleUserConstraints(user)

          await user.save()
          updatedCount++
          console.log(`🔄 Utilisateur mis à jour: ${email}`)
        } else {
          // Utiliser le mot de passe par défaut depuis l'environnement
          const defaultPassword = process.env.DEFAULT_PASSWORD || '12345678'

          // Créer le nouvel utilisateur
          user = new User()
          user.username = username
          user.familyName = familyName.trim()
          user.givenName = givenName.trim()
          user.email = email.trim()
          user.phone = phone.trim() || null
          user.passwordHash = defaultPassword
          user.role = role as any
          user.lang = 'fr'
          user.status = 'active'
          user.mustChangePassword = true

          // Gérer les contraintes pour la création AVANT la sauvegarde
          await this.handleUserConstraints(user)

          await user.save()
          createdCount++
          console.log(`✅ Utilisateur créé: ${email} (username: ${username})`)
        }
      } catch (error) {
        errorCount++
        if (error.message.includes('chk_bassin_affectation')) {
          console.error(
            `❌ Erreur ligne ${i + 1} (contrainte bassin): Le rôle "${role}" nécessite un bassin de production`
          )
        } else if (error.message.includes('chk_gerant_acteur')) {
          console.error(
            `❌ Erreur ligne ${i + 1} (contrainte acteur): Le rôle "actor_manager" nécessite un acteur`
          )
        } else if (error.message.includes('unique') && error.message.includes('pseudo')) {
          console.error(`❌ Erreur ligne ${i + 1} (pseudo en conflit): Pseudo déjà existant`)
        } else {
          console.error(`❌ Erreur ligne ${i + 1}:`, error.message)
        }
      }
    }

    console.log("\n📊 Résumé de l'importation des utilisateurs:")
    console.log(`   ✅ Créés: ${createdCount}`)
    console.log(`   🔄 Mis à jour: ${updatedCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)
    console.log(`   📋 Total traité: ${createdCount + updatedCount}`)
  }

  /**
   * Créer les bassins de production de base
   */
  private async ensureProductionBasins() {
    const bassins = [{ name: 'Demo', description: 'Bassin de production du Demo' }]

    for (const bassinData of bassins) {
      const existing = await ProductionBasin.query().where('name', bassinData.name).first()
      if (!existing) {
        await ProductionBasin.create({
          name: bassinData.name,
          description: bassinData.description,
        })
        console.log(`🏭 Bassin de production créé: ${bassinData.name}`)
      }
    }
  }

  /**
   * Créer des acteurs de base pour les store managers
   */
  private async ensureActors() {
    const actors = [
      {
        familyName: 'Family Démo',
        givenName: 'Given Démo',
        actorType: 'PRODUCERS' as const,
        onccId: 'DEMO001',
      },
    ]

    for (const actorData of actors) {
      const existing = await Actor.query().where('onccId', actorData.onccId).first()
      if (!existing) {
        await Actor.create({
          familyName: actorData.familyName,
          givenName: actorData.givenName,
          actorType: actorData.actorType,
          onccId: actorData.onccId,
          status: 'active',
        })
        console.log(
          `👤 Acteur créé: ${actorData.onccId} - ${actorData.givenName} ${actorData.familyName}`
        )
      }
    }
  }

  /**
   * Gérer les contraintes utilisateur selon le rôle
   */
  private async handleUserConstraints(user: User) {
    const role = user.role

    if (role === 'basin_admin' || role === 'field_agent') {
      // Ces rôles doivent avoir un bassin de production
      if (!user.productionBasinId) {
        // Assigner un bassin par défaut selon le rôle
        const defaultBassin = await ProductionBasin.query().where('name', 'Demo').first()
        if (defaultBassin) {
          user.productionBasinId = defaultBassin.id
        }
      }
      // S'assurer qu'ils n'ont pas d'acteur
      user.actorId = null
    } else if (role === 'actor_manager') {
      // Les gérants doivent avoir un acteur
      if (!user.actorId) {
        // Assigner un acteur par défaut
        const defaultActor = await Actor.query().where('onccId', 'DEMO001').first()
        if (defaultActor) {
          user.actorId = defaultActor.id
        }
      }
      // Les gérants peuvent ne pas avoir de bassin
      user.productionBasinId = null
    } else if (role === 'technical_admin') {
      // Les admins techniques n'ont ni bassin ni acteur
      user.productionBasinId = null
      user.actorId = null
    }
  }

  /**
   * Parser une ligne CSV en gérant les guillemets et virgules
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }

    values.push(current) // Ajouter la dernière valeur
    return values
  }
}
