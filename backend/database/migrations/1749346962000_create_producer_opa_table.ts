import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'producer_opa'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('producer_id').notNullable().references('id').inTable('actors').onDelete('CASCADE')
      table.uuid('opa_id').notNullable().references('id').inTable('actors').onDelete('CASCADE')
      table.date('membership_date').nullable()
      table.enum('status', ['active', 'inactive']).defaultTo('active')

      table.timestamp('created_at').defaultTo(this.now())

      // Contrainte d'unicité
      table.unique(['producer_id', 'opa_id'])

      // Index
      table.index(['producer_id'])
      table.index(['opa_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
