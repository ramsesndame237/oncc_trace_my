import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'actor_product_quantities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Référence à l'acteur (principalement PRODUCER)
      table.uuid('actor_id').notNullable().references('id').inTable('actors')

      // Référence à la campagne
      table.uuid('campaign_id').notNullable().references('id').inTable('campaigns')

      // Référence à la parcelle (nullable pour le moment)
      table.uuid('parcel_id').nullable().references('id').inTable('parcels')

      // Référence à l'OPA à qui cette production a été donnée (nullable)
      table.uuid('opa_id').nullable().references('id').inTable('actors')

      // Qualité du produit (exemple: "GRADE1", "GRADE2", "STANDARD", etc.)
      table.string('quality', 100).notNullable()

      // Poids total en kilogrammes
      table.decimal('total_weight', 12, 2).notNullable().defaultTo(0)

      // Nombre total de sacs
      table.integer('total_bags').notNullable().defaultTo(0)

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Contrainte unique: un acteur ne peut avoir qu'une seule entrée par campagne, parcelle, OPA et qualité
      table.unique(['actor_id', 'campaign_id', 'parcel_id', 'opa_id', 'quality'])

      // Index pour optimiser les requêtes
      table.index(['actor_id'])
      table.index(['campaign_id'])
      table.index(['parcel_id'])
      table.index(['opa_id'])
      table.index(['quality'])
      table.index(['actor_id', 'campaign_id'])
      table.index(['actor_id', 'parcel_id'])
      table.index(['actor_id', 'opa_id'])
      table.index(['opa_id', 'campaign_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
