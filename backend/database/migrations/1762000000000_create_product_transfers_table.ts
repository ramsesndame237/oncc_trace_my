import { TRANSFER_TYPES, TRANSFER_STATUSES } from '#types/product_transfer_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_transfers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Code unique du transfert
      table.string('code', 100).unique().notNullable()

      // Type de transfert
      table.enum('transfer_type', TRANSFER_TYPES).notNullable()

      // Expéditeur (acteur et magasin)
      table.uuid('sender_actor_id').notNullable().references('id').inTable('actors')
      table.uuid('sender_store_id').notNullable().references('id').inTable('stores')

      // Destinataire (acteur et magasin)
      table.uuid('receiver_actor_id').notNullable().references('id').inTable('actors')
      table.uuid('receiver_store_id').notNullable().references('id').inTable('stores')

      // Campagne concernée
      table.uuid('campaign_id').notNullable().references('id').inTable('campaigns')

      // Date du transfert
      table.date('transfer_date').notNullable()

      // Informations du chauffeur (JSON)
      // {
      //   fullName: string,
      //   vehicleRegistration: string,
      //   drivingLicenseNumber: string,
      //   routeSheetCode: string
      // }
      table.json('driver_info').notNullable()

      // Liste de produits (JSON) - Pour GROUPAGE uniquement
      // [
      //   {
      //     quality: string,
      //     weight: number,
      //     numberOfBags: number
      //   }
      // ]
      table.json('products').nullable().comment('Liste de produits pour transfert GROUPAGE')

      // Statut du transfert
      table.enum('status', TRANSFER_STATUSES).defaultTo('pending')

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index pour optimiser les requêtes
      table.index(['code'])
      table.index(['transfer_type'])
      table.index(['sender_actor_id'])
      table.index(['sender_store_id'])
      table.index(['receiver_actor_id'])
      table.index(['receiver_store_id'])
      table.index(['campaign_id'])
      table.index(['transfer_date'])
      table.index(['status'])
      table.index(['deleted_at'])
      table.index(['sender_actor_id', 'campaign_id'])
      table.index(['receiver_actor_id', 'campaign_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
