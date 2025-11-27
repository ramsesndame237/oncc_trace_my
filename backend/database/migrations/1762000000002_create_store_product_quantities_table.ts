import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_product_quantities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Référence au magasin
      table.uuid('store_id').notNullable().references('id').inTable('stores')

      // Référence à la campagne
      table.uuid('campaign_id').notNullable().references('id').inTable('campaigns')

      // Référence à l'acteur (propriétaire du stock)
      table.uuid('actor_id').notNullable().references('id').inTable('actors')

      // Qualité du produit (exemple: "GRADE1", "GRADE2", "STANDARD", etc.)
      table.string('quality', 100).notNullable()

      // Poids total en kilogrammes
      table.decimal('total_weight', 12, 2).notNullable().defaultTo(0)

      // Nombre total de sacs
      table.integer('total_bags').notNullable().defaultTo(0)

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Contrainte unique: un magasin ne peut avoir qu'une seule entrée par acteur, campagne et qualité
      table.unique(['store_id', 'actor_id', 'campaign_id', 'quality'])

      // Index pour optimiser les requêtes
      table.index(['store_id'])
      table.index(['actor_id'])
      table.index(['campaign_id'])
      table.index(['quality'])
      table.index(['store_id', 'campaign_id'])
      table.index(['store_id', 'actor_id'])
      table.index(['actor_id', 'campaign_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
