import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'exporter_mandates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('exporter_id').notNullable().references('id').inTable('actors').onDelete('CASCADE')
      table.uuid('buyer_id').notNullable().references('id').inTable('actors').onDelete('CASCADE')
      table
        .uuid('campaign_id')
        .notNullable()
        .references('id')
        .inTable('campaigns')
        .onDelete('CASCADE')
      table.date('mandate_date').nullable()
      table.enum('status', ['active', 'inactive']).defaultTo('active')

      table.timestamp('created_at').defaultTo(this.now())

      // Contrainte d'unicité
      table.unique(['exporter_id', 'buyer_id', 'campaign_id'])

      // Index
      table.index(['exporter_id'])
      table.index(['buyer_id'])
      table.index(['campaign_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
