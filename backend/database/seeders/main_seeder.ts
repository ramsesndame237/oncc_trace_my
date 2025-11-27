import { BaseSeeder } from '@adonisjs/lucid/seeders'
import LocationsSeeder from '../seeders_tools/locations_seeder.js'
import UsersSeeder from '../seeders_tools/users_seeder.js'
import CampaignsSeeder from '../seeders_tools/campaigns_seeder.js'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // L'utilisateur peut passer le mode via la variable d'environnement: SEED_MODE=prod node ace db:seed
    const mode = process.env.SEED_MODE || 'dev'

    console.log(`🌱 Démarrage du seeding en mode: ${mode.toUpperCase()}`)
    console.log(`📁 Utilisation des données du dossier: seed_data/auto/${mode}/`)

    // Importer les localisations
    console.log('📍 Importation des localisations depuis localizations.csv...')
    await new LocationsSeeder(this.client).run()

    // Importer les utilisateurs
    console.log('\n👥 Importation des utilisateurs depuis users.csv...')
    await new UsersSeeder(this.client).run()

    // Créer une campagne par défaut si nécessaire
    console.log('\n📋 Vérification et création de campagne par défaut...')
    await new CampaignsSeeder(this.client).run()

    console.log('\n✅ Seeding principal terminé!')
    console.log('ℹ️  Données importées: localisations, utilisateurs et campagne par défaut')
    console.log(`ℹ️  Fichiers CSV disponibles en mode ${mode}:`)
  }
}
