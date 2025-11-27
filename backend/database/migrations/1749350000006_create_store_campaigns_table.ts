import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_campaigns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE')
      table
        .uuid('campaign_id')
        .notNullable()
        .references('id')
        .inTable('campaigns')
        .onDelete('CASCADE')
      table.date('validation_date').nullable()

      table.timestamp('created_at').defaultTo(this.now())

      // Unique constraint
      table.unique(['store_id', 'campaign_id'])

      // Index
      table.index(['store_id'])
      table.index(['campaign_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
