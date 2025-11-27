import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import { Client } from 'minio'
import env from '#start/env'

export default class CleanProducers extends BaseCommand {
  static commandName = 'clean:producers'
  static description = 'Supprimer tous les producteurs et leurs données associées (documents, parcelles, audit logs)'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔄 Début du nettoyage des données des producteurs...\n')

    try {
      // Configuration Minio
      const minioClient = new Client({
        endPoint: env.get('MINIO_ENDPOINT') as string,
        port: Number(env.get('MINIO_PORT')),
        useSSL: String(env.get('MINIO_USE_SSL')) === 'true',
        accessKey: env.get('MINIO_ACCESS_KEY') as string,
        secretKey: env.get('MINIO_SECRET_KEY') as string,
      })

      // ========== ÉTAPE 1: Supprimer les fichiers Minio ==========
      this.logger.info('📦 Étape 1: Suppression des fichiers Minio...')

      // Récupérer tous les documents liés aux producteurs (actors de type PRODUCER)
      const producerIds = await db.from('actors').where('actor_type', 'PRODUCER').select('id')

      const producerIdsList = producerIds.map((p) => p.id)

      if (producerIdsList.length > 0) {
        const documents = await db
          .from('documents')
          .whereIn('documentable_id', producerIdsList)
          .where('documentable_type', 'actor')
          .select('*')

        this.logger.info(`   ✓ Trouvé ${documents.length} document(s) à supprimer de Minio`)

        // Supprimer chaque fichier de Minio
        for (const doc of documents) {
          try {
            await minioClient.removeObject(doc.bucket_name, doc.storage_path)
            this.logger.info(`   ✓ Fichier supprimé de Minio: ${doc.storage_path}`)
          } catch (error: any) {
            if (error.code === 'NoSuchKey') {
              this.logger.warning(`   ⚠️  Fichier déjà absent: ${doc.storage_path}`)
            } else {
              this.logger.error(
                `   ❌ Erreur lors de la suppression de ${doc.storage_path}: ${error.message}`
              )
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
            .where('documentable_type', 'parcel')
            .whereIn('documentable_id', parcelIdsList)
            .select('*')

          this.logger.info(
            `   ✓ Trouvé ${parcelDocuments.length} document(s) de parcelles à supprimer de Minio`
          )

          for (const doc of parcelDocuments) {
            try {
              await minioClient.removeObject(doc.bucket_name, doc.storage_path)
              this.logger.info(`   ✓ Fichier de parcelle supprimé de Minio: ${doc.storage_path}`)
            } catch (error: any) {
              if (error.code === 'NoSuchKey') {
                this.logger.warning(`   ⚠️  Fichier déjà absent: ${doc.storage_path}`)
              } else {
                this.logger.error(
                  `   ❌ Erreur lors de la suppression de ${doc.storage_path}: ${error.message}`
                )
              }
            }
          }
        } else {
          this.logger.info('   ℹ️  Aucune parcelle trouvée')
        }
      } else {
        this.logger.info('   ℹ️  Aucun producteur trouvé')
      }

      this.logger.info('\n📦 Étape 1: Terminée\n')

      // ========== ÉTAPE 2: Supprimer les données de la base ==========
      this.logger.info('🗄️  Étape 2: Suppression des données de la base...\n')

      // Transaction pour garantir la cohérence
      if (producerIdsList.length > 0) {
        await db.transaction(async (trx) => {
          // Récupérer d'abord tous les IDs de parcelles
          const parcels = await trx
            .from('parcels')
            .whereIn('producer_id', producerIdsList)
            .select('id')
          const parcelIdsList = parcels.map((p) => p.id)

          // 1. Supprimer les coordonnées des parcelles
          let coordinatesDeleted: number | number[] = 0
          if (parcelIdsList.length > 0) {
            coordinatesDeleted = await trx
              .from('parcel_coordinates')
              .whereIn('parcel_id', parcelIdsList)
              .delete()
          }
          const coordinatesCount = Array.isArray(coordinatesDeleted) ? coordinatesDeleted[0] : coordinatesDeleted
          this.logger.info(`   ✓ ${coordinatesCount} coordonnée(s) de parcelles supprimée(s)`)

          // 2. Supprimer les documents des parcelles
          let parcelDocsDeleted: number | number[] = 0
          if (parcelIdsList.length > 0) {
            parcelDocsDeleted = await trx
              .from('documents')
              .where('documentable_type', 'parcel')
              .whereIn('documentable_id', parcelIdsList)
              .delete()
          }
          const parcelDocsCount = Array.isArray(parcelDocsDeleted) ? parcelDocsDeleted[0] : parcelDocsDeleted
          this.logger.info(`   ✓ ${parcelDocsCount} document(s) de parcelles supprimé(s)`)

          // 3. Supprimer les parcelles
          const parcelsDeleted = await trx
            .from('parcels')
            .whereIn('producer_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${parcelsDeleted} parcelle(s) supprimée(s)`)

          // 4. Supprimer les documents des producteurs
          const actorDocsDeleted = await trx
            .from('documents')
            .where('documentable_type', 'actor')
            .whereIn('documentable_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${actorDocsDeleted} document(s) de producteurs supprimé(s)`)

          // 5. Supprimer les audit logs des producteurs
          const auditLogsDeleted = await trx
            .from('audit_logs')
            .where('auditable_type', 'actor')
            .whereIn('auditable_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${auditLogsDeleted} audit log(s) supprimé(s)`)

          // 6. Supprimer les métadonnées des producteurs
          const metadataDeleted = await trx
            .from('metadata')
            .where('metadatable_type', 'actor')
            .whereIn('metadatable_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${metadataDeleted} métadonnée(s) supprimée(s)`)

          // 7. Supprimer les relations producer_opa (où le producteur est soit producer, soit opa)
          const producerOpaAsProducerResult = await trx
            .from('producer_opa')
            .whereIn('producer_id', producerIdsList)
            .delete()
          const producerOpaAsOpaResult = await trx
            .from('producer_opa')
            .whereIn('opa_id', producerIdsList)
            .delete()
          const producerOpaAsProducer = Array.isArray(producerOpaAsProducerResult) ? producerOpaAsProducerResult[0] : producerOpaAsProducerResult
          const producerOpaAsOpa = Array.isArray(producerOpaAsOpaResult) ? producerOpaAsOpaResult[0] : producerOpaAsOpaResult
          const producerOpaDeleted = producerOpaAsProducer + producerOpaAsOpa
          this.logger.info(`   ✓ ${producerOpaDeleted} relation(s) producer_opa supprimée(s)`)

          // 8. Supprimer les relations store_occupants
          const storeOccupantsDeleted = await trx
            .from('store_occupants')
            .whereIn('actor_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${storeOccupantsDeleted} relation(s) store_occupants supprimée(s)`)

          // 9. Supprimer les actor_product_quantities
          const productQuantitiesDeleted = await trx
            .from('actor_product_quantities')
            .whereIn('actor_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${productQuantitiesDeleted} quantité(s) de produit supprimée(s)`)

          // 10. Supprimer les utilisateurs liés aux producteurs
          const usersDeleted = await trx
            .from('users')
            .whereIn('actor_id', producerIdsList)
            .delete()
          this.logger.info(`   ✓ ${usersDeleted} utilisateur(s) supprimé(s)`)

          // 11. Finalement, supprimer les producteurs
          const actorsDeleted = await trx.from('actors').where('actor_type', 'PRODUCER').delete()
          this.logger.info(`   ✓ ${actorsDeleted} producteur(s) supprimé(s)`)
        })
      } else {
        this.logger.warning('   ⚠️  Aucun producteur à supprimer')
      }

      this.logger.info('\n🗄️  Étape 2: Terminée\n')

      this.logger.success('✅ Nettoyage terminé avec succès!\n')
      this.logger.info('📊 Résumé:')
      this.logger.info('   - Fichiers Minio supprimés')
      this.logger.info('   - Coordonnées de parcelles supprimées')
      this.logger.info('   - Parcelles supprimées')
      this.logger.info('   - Documents supprimés')
      this.logger.info('   - Audit logs supprimés')
      this.logger.info('   - Métadonnées supprimées')
      this.logger.info('   - Relations supprimées')
      this.logger.info('   - Utilisateurs supprimés')
      this.logger.info('   - Producteurs supprimés\n')
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage:')
      this.logger.error(error)
      throw error
    }
  }
}