import Location from '#models/location'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import fs from 'node:fs'
import path from 'node:path'

export default class extends BaseSeeder {
  async run() {
    console.log("🌍 Début de l'importation des localisations depuis le CSV...")

    // Chemin vers le fichier CSV
    const csvPath = path.join(process.cwd(), 'seed_data', 'auto', 'localizations.csv')

    if (!fs.existsSync(csvPath)) {
      console.error('❌ Fichier CSV non trouvé:', csvPath)
      return
    }

    // Lire et parser le fichier CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter((line) => line.trim())
    // const headers = lines[0].split(',')

    console.log(`📄 Fichier CSV trouvé avec ${lines.length - 1} lignes de données`)

    // Structures pour stocker les données uniques
    const regions = new Map()
    const departments = new Map()
    const arrondissements = new Map()

    // Parser chaque ligne du CSV
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      // Parser la ligne CSV en gérant les guillemets
      const values = this.parseCSVLine(line)
      if (values.length < 12) continue

      const [
        admin3Name, // admin3Alias - not used
        ,
        admin3Code,
        admin2Name, // admin2Alias - not used
        ,
        admin2Code,
        admin1Name, // admin1Alias - not used
        ,
        admin1Code, // admin0Name - not used
        // admin0Alias - not used
        // admin0Code - not used
        ,
        ,
        ,
      ] = values

      // Ajouter la région (admin1)
      if (!regions.has(admin1Code)) {
        regions.set(admin1Code, {
          name: admin1Name,
          type: 'region' as const,
          code: admin1Code,
          status: 'active' as const,
          parentCode: null,
        })
      }

      // Ajouter le département (admin2)
      if (!departments.has(admin2Code)) {
        departments.set(admin2Code, {
          name: admin2Name,
          type: 'department' as const,
          code: admin2Code,
          status: 'active' as const,
          parentCode: admin1Code,
        })
      }

      // Ajouter l'arrondissement (admin3)
      if (!arrondissements.has(admin3Code)) {
        arrondissements.set(admin3Code, {
          name: admin3Name,
          type: 'district' as const,
          code: admin3Code,
          status: 'active' as const,
          parentCode: admin2Code,
        })
      }
    }

    console.log(`📊 Données extraites:`)
    console.log(`   - ${regions.size} régions`)
    console.log(`   - ${departments.size} départements`)
    console.log(`   - ${arrondissements.size} arrondissements`)

    // Désactiver toutes les localisations existantes
    console.log('🔄 Désactivation des localisations existantes...')
    await Location.query().update({ status: 'inactive' })

    let stats = {
      regions: { created: 0, updated: 0 },
      departments: { created: 0, updated: 0 },
      arrondissements: { created: 0, updated: 0 },
    }

    // Insérer les régions
    console.log('🏛️ Importation des régions...')
    for (const [code, regionData] of regions) {
      try {
        const existing = await Location.findBy('code', code)
        if (existing) {
          await existing.merge(regionData).save()
          stats.regions.updated++
        } else {
          await Location.create(regionData)
          stats.regions.created++
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'importation de la région ${code}:`, error.message)
      }
    }

    // Insérer les départements
    console.log('🏢 Importation des départements...')
    for (const [code, deptData] of departments) {
      try {
        const existing = await Location.findBy('code', code)
        if (existing) {
          await existing.merge(deptData).save()
          stats.departments.updated++
        } else {
          await Location.create(deptData)
          stats.departments.created++
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'importation du département ${code}:`, error.message)
      }
    }

    // Insérer les arrondissements
    console.log('🏘️ Importation des arrondissements...')
    for (const [code, arrData] of arrondissements) {
      try {
        const existing = await Location.findBy('code', code)
        if (existing) {
          await existing.merge(arrData).save()
          stats.arrondissements.updated++
        } else {
          await Location.create(arrData)
          stats.arrondissements.created++
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'importation de l'arrondissement ${code}:`, error.message)
      }
    }

    // Afficher les statistiques finales
    console.log('\n✅ Importation des localisations terminée avec succès!')
    console.log('📈 Statistiques:')
    console.log(
      `   Régions: ${stats.regions.created} créées, ${stats.regions.updated} mises à jour`
    )
    console.log(
      `   Départements: ${stats.departments.created} créés, ${stats.departments.updated} mis à jour`
    )
    console.log(
      `   Arrondissements: ${stats.arrondissements.created} créés, ${stats.arrondissements.updated} mis à jour`
    )

    const total =
      stats.regions.created +
      stats.regions.updated +
      stats.departments.created +
      stats.departments.updated +
      stats.arrondissements.created +
      stats.arrondissements.updated
    console.log(`   Total: ${total} localisations traitées`)
  }

  /**
   * Parse une ligne CSV en gérant les guillemets et les virgules
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Ajouter le dernier champ
    result.push(current.trim())

    return result
  }
}
