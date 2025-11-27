import Campaign from '#models/campaign'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

export default class CampaignsSeeder extends BaseSeeder {
  constructor(client: QueryClientContract) {
    super(client)
    this.client = client
  }

  async run() {
    try {
      // Vérifier s'il existe déjà des campagnes
      const existingCampaignsCount = await Campaign.query().count('* as total')
      const totalCampaigns = existingCampaignsCount[0].$extras.total || 0

      if (Number(totalCampaigns) > 0) {
        console.log(`   ℹ️  ${totalCampaigns} campagne(s) déjà existante(s) - seeding ignoré`)
        return
      }

      // Créer une campagne par défaut
      const now = DateTime.now()
      const startDate = now.plus({ months: 1 }).startOf('month') // 1er du mois prochain
      const endDate = now.plus({ months: 2 }).endOf('month') // Dernier jour du mois d'après

      const defaultCampaign = await Campaign.create({
        code: `${startDate.year}-${endDate.year}`,
        startDate: startDate,
        endDate: endDate,
        status: 'active',
      })

      console.log(`   ✅ Campagne par défaut créée: ${defaultCampaign.code}`)
      console.log(
        `      📅 Période: ${startDate.toFormat('dd/MM/yyyy')} - ${endDate.toFormat('dd/MM/yyyy')}`
      )
      console.log(`      📊 Statut: ${defaultCampaign.status}`)
    } catch (error) {
      console.error('❌ Erreur lors de la création de la campagne par défaut:', error.message)
      throw error
    }
  }
}
