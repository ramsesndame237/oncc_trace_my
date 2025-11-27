import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conventions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire UUID
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Code unique de la convention (généré automatiquement)
      table.string('code', 50).unique().notNullable()

      // Relations
      table.uuid('buyer_exporter_id').notNullable()
      table.foreign('buyer_exporter_id').references('id').inTable('actors').onDelete('RESTRICT')

      table.uuid('producers_id').notNullable()
      table.foreign('producers_id').references('id').inTable('actors').onDelete('RESTRICT')

      // Date de signature
      table.date('signature_date').notNullable()

      // Produits (JSON)
      // Structure: [{ quality: 'grade_1' | 'grade_2' | 'hs', standard: 'certifie' | 'excellent' | 'fin' | 'conventionnel', weight: number, bags: number, pricePerKg: number, humidity: number }]
      table.json('products').notNullable()

      // Timestamps
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index pour améliorer les performances
      table.index(['code'])
      table.index(['buyer_exporter_id'])
      table.index(['producers_id'])
      table.index(['signature_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
