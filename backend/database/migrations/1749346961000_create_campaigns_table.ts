import { CAMPAIGN_STATUSES } from '#types/campaign_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'campaigns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('code', 50).unique().notNullable()
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()
      table.enum('status', CAMPAIGN_STATUSES).notNullable().defaultTo('active')

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Index
      table.index(['code'])
      table.index(['status'])
      table.index(['start_date', 'end_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
