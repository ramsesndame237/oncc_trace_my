/**
 * Script pour supprimer tous les producteurs et leurs données associées
 * Utilisation: node ace run scripts/clean_producers_data.ts
 */

import db from '@adonisjs/lucid/services/db'
import { Client } from 'minio'
import env from '#start/env'

// Configuration Minio
const minioClient = new Client({
  endPoint: env.get('MINIO_ENDPOINT') as string,
  port: Number(env.get('MINIO_PORT')),
  useSSL: String(env.get('MINIO_USE_SSL')) === 'true',
  accessKey: env.get('MINIO_ACCESS_KEY') as string,
  secretKey: env.get('MINIO_SECRET_KEY') as string,
})

async function cleanProducersData() {
  console.log('🔄 Début du nettoyage des données des producteurs...\n')

  try {
    // ========== ÉTAPE 1: Supprimer les fichiers Minio ==========
    console.log('📦 Étape 1: Suppression des fichiers Minio...')

    // Récupérer tous les documents liés aux producteurs (actors de type PRODUCER)
    const producerIds = await db
      .from('actors')
      .where('actor_type', 'PRODUCER')
      .select('id')

    const producerIdsList = producerIds.map((p) => p.id)

    if (producerIdsList.length > 0) {
      const documents = await db
        .from('documents')
        .whereIn('documentable_id', producerIdsList)
        .where('documentable_type', 'actor')
        .select('*')

      console.log(`   ✓ Trouvé ${documents.length} document(s) à supprimer de Minio`)

      // Supprimer chaque fichier de Minio
      for (const doc of documents) {
        try {
          await minioClient.removeObject(doc.bucket_name, doc.storage_path)
          console.log(`   ✓ Fichier supprimé de Minio: ${doc.storage_path}`)
        } catch (error: any) {
          if (error.code === 'NoSuchKey') {
            console.log(`   ⚠️  Fichier déjà absent: ${doc.storage_path}`)
          } else {
            console.error(`   ❌ Erreur lors de la suppression de ${doc.storage_path}:`, error)
          }
        }
      }

      // Récupérer les documents liés aux parcelles des producteurs
      const parcels = await db
        .from('parcels')
        .whereIn('producer_id', producerIdsList)
        .select('id')

      const parcelIdsList = parcels.map((p) => p.id)

      if (parcelIdsList.length > 0) {
        const parcelDocuments = await db
          .from('documents')
          .whereIn('documentable_id', parcelIdsList)
          .where('documentable_type', 'parcel')
          .select('*')

        console.log(
          `   ✓ Trouvé ${parcelDocuments.length} document(s) de parcelles à supprimer de Minio`
        )

        for (const doc of parcelDocuments) {
          try {
            await minioClient.removeObject(doc.bucket_name, doc.storage_path)
            console.log(`   ✓ Fichier de parcelle supprimé de Minio: ${doc.storage_path}`)
          } catch (error: any) {
            if (error.code === 'NoSuchKey') {
              console.log(`   ⚠️  Fichier déjà absent: ${doc.storage_path}`)
            } else {
              console.error(`   ❌ Erreur lors de la suppression de ${doc.storage_path}:`, error)
            }
          }
        }
      }
    } else {
      console.log('   ℹ️  Aucun producteur trouvé')
    }

    console.log('\n📦 Étape 1: Terminée\n')

    // ========== ÉTAPE 2: Supprimer les données de la base ==========
    console.log('🗄️  Étape 2: Suppression des données de la base...\n')

    // Transaction pour garantir la cohérence
    await db.transaction(async (trx) => {
      // 1. Supprimer les coordonnées des parcelles
      const coordinatesDeleted = await trx
        .from('parcel_coordinates')
        .whereIn('parcel_id', function (this: any) {
          this.from('parcels').whereIn('producer_id', producerIdsList).select('id')
        })
        .delete()
      console.log(`   ✓ ${coordinatesDeleted} coordonnée(s) de parcelles supprimée(s)`)

      // 2. Supprimer les documents des parcelles
      const parcelDocsDeleted = await trx
        .from('documents')
        .where('documentable_type', 'parcel')
        .whereIn('documentable_id', function (this: any) {
          this.from('parcels').whereIn('producer_id', producerIdsList).select('id')
        })
        .delete()
      console.log(`   ✓ ${parcelDocsDeleted} document(s) de parcelles supprimé(s)`)

      // 3. Supprimer les parcelles
      const parcelsDeleted = await trx
        .from('parcels')
        .whereIn('producer_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${parcelsDeleted} parcelle(s) supprimée(s)`)

      // 4. Supprimer les documents des producteurs
      const actorDocsDeleted = await trx
        .from('documents')
        .where('documentable_type', 'actor')
        .whereIn('documentable_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${actorDocsDeleted} document(s) de producteurs supprimé(s)`)

      // 5. Supprimer les audit logs des producteurs
      const auditLogsDeleted = await trx
        .from('audit_logs')
        .where('auditable_type', 'actor')
        .whereIn('auditable_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${auditLogsDeleted} audit log(s) supprimé(s)`)

      // 6. Supprimer les métadonnées des producteurs
      const metadataDeleted = await trx
        .from('metadata')
        .where('metadatable_type', 'actor')
        .whereIn('metadatable_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${metadataDeleted} métadonnée(s) supprimée(s)`)

      // 7. Supprimer les relations producer_opa
      const producerOpaDeleted = await trx
        .from('producer_opa')
        .whereIn('producer_id', producerIdsList)
        .orWhereIn('opa_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${producerOpaDeleted} relation(s) producer_opa supprimée(s)`)

      // 8. Supprimer les relations store_occupants
      const storeOccupantsDeleted = await trx
        .from('store_occupants')
        .whereIn('actor_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${storeOccupantsDeleted} relation(s) store_occupants supprimée(s)`)

      // 9. Supprimer les actor_product_quantities
      const productQuantitiesDeleted = await trx
        .from('actor_product_quantities')
        .whereIn('actor_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${productQuantitiesDeleted} quantité(s) de produit supprimée(s)`)

      // 10. Supprimer les utilisateurs liés aux producteurs
      const usersDeleted = await trx
        .from('users')
        .whereIn('actor_id', producerIdsList)
        .delete()
      console.log(`   ✓ ${usersDeleted} utilisateur(s) supprimé(s)`)

      // 11. Finalement, supprimer les producteurs
      const actorsDeleted = await trx
        .from('actors')
        .where('actor_type', 'PRODUCER')
        .delete()
      console.log(`   ✓ ${actorsDeleted} producteur(s) supprimé(s)`)
    })

    console.log('\n🗄️  Étape 2: Terminée\n')

    console.log('✅ Nettoyage terminé avec succès!\n')
    console.log('📊 Résumé:')
    console.log('   - Fichiers Minio supprimés')
    console.log('   - Coordonnées de parcelles supprimées')
    console.log('   - Parcelles supprimées')
    console.log('   - Documents supprimés')
    console.log('   - Audit logs supprimés')
    console.log('   - Métadonnées supprimées')
    console.log('   - Relations supprimées')
    console.log('   - Utilisateurs supprimés')
    console.log('   - Producteurs supprimés\n')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  } finally {
    await db.manager.closeAll()
  }
}

// Exécuter le script
cleanProducersData()
  .then(() => {
    console.log('Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
