import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'metadata'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('metadatable_type', 50).notNullable() // 'acteur', 'magasin', etc.
      table.uuid('metadatable_id').notNullable()
      table.string('meta_key', 100).notNullable()
      table.text('meta_value').nullable()

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Contrainte d'unicité
      table.unique(['metadatable_type', 'metadatable_id', 'meta_key'])

      // Index polymorphique
      table.index(['metadatable_type', 'metadatable_id'])
      table.index(['meta_key'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
