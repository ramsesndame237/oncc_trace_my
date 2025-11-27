import { PRODUCT_QUALITIES, PRODUCT_STANDARDS } from '#types/cacao_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // ============ CLÉS PRIMAIRES ============
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // ============ RÉFÉRENCES ============
      table
        .uuid('transaction_id')
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE')

      // ============ PRODUIT ============
      table.enum('quality', PRODUCT_QUALITIES).notNullable()
      table.enum('standard', PRODUCT_STANDARDS).notNullable()

      // ============ QUANTITÉS ============
      table.decimal('weight', 12, 2).notNullable() // Poids en kg
      table.integer('bag_count').notNullable() // Nombre de sacs

      // ============ PRIX ============
      table.decimal('price_per_kg', 12, 2).notNullable() // Prix par kg en FCFA
      table.decimal('total_price', 15, 2).notNullable() // Prix total (calculé: weight * price_per_kg)

      // ============ CAS SPÉCIAL OPA VENDEUR ============
      // producer_id = ID du PRODUCER (producteur individuel), PAS de l'OPA
      table.uuid('producer_id').nullable().references('id').inTable('actors')

      // ============ INFORMATIONS COMPLÉMENTAIRES ============
      table.decimal('humidity', 5, 2).nullable() // Taux d'humidité en %
      table.text('notes').nullable()

      // ============ AUDIT ============
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // ============ INDEX ============
      table.index(['transaction_id'], 'idx_transaction_products_transaction')
      table.index(['producer_id'], 'idx_transaction_products_producer')
      table.index(['quality'], 'idx_transaction_products_quality')
      table.index(['standard'], 'idx_transaction_products_standard')
      table.index(['deleted_at'], 'idx_transaction_products_deleted_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
