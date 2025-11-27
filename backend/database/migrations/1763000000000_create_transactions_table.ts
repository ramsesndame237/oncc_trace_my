import {
  TRANSACTION_LOCATION_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '#types/transaction_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // ============ CLÉS PRIMAIRES ============
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('code', 50).unique().notNullable()

      // ============ TYPE ============
      table.enum('transaction_type', TRANSACTION_TYPES).notNullable()
      table.enum('location_type', TRANSACTION_LOCATION_TYPES).notNullable()

      // ============ ACTEURS ============
      table.uuid('seller_id').notNullable().references('id').inTable('actors')
      table.uuid('buyer_id').notNullable().references('id').inTable('actors')
      table.uuid('principal_exporter_id').nullable().references('id').inTable('actors')
      table
        .uuid('created_by_actor_id')
        .nullable()
        .references('id')
        .inTable('actors')
        .onDelete('SET NULL')
        .comment('Acteur qui a créé cette transaction (pour distinguer qui a fait la déclaration)')

      // ============ CONTEXTE ============
      table.uuid('campaign_id').notNullable().references('id').inTable('campaigns')
      table.uuid('calendar_id').nullable().references('id').inTable('calendars')
      table.uuid('convention_id').nullable().references('id').inTable('conventions')

      // ============ WORKFLOW ============
      table.enum('status', TRANSACTION_STATUSES).notNullable().defaultTo('pending')

      // ============ INFORMATIONS ============
      table.date('transaction_date').notNullable()
      table.text('notes').nullable()

      // ============ AUDIT ============
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Le vendeur et l'acheteur doivent être différents
      table.check('seller_id != buyer_id', [], 'chk_actors_different')

      // ============ INDEX ============
      table.index(['seller_id', 'campaign_id'], 'idx_seller_campaign')
      table.index(['buyer_id', 'campaign_id'], 'idx_buyer_campaign')
      table.index(['campaign_id'], 'idx_campaign')
      table.index(['calendar_id'], 'idx_calendar')
      table.index(['convention_id'], 'idx_convention')
      table.index(['created_by_actor_id'], 'idx_created_by_actor')
      table.index(['transaction_date'], 'idx_transaction_date')
      table.index(['status'], 'idx_status')
      table.index(['transaction_type'], 'idx_transaction_type')
      table.index(['deleted_at'], 'idx_deleted_at')

      // Index composite pour trouver les transactions complémentaires CONFIRMÉES
      table.index(
        ['seller_id', 'buyer_id', 'campaign_id', 'location_type', 'status'],
        'idx_complementary_search'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
