import { STORE_STATUSES, STORE_TYPES } from '#types/store_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name', 200).notNullable()
      table.string('code', 100).nullable().unique() // Unique code required
      table.string('location_code', 20).notNullable().references('code').inTable('locations')
      table.enum('store_type', STORE_TYPES).nullable()
      table.decimal('capacity', 10, 2).nullable()
      table
        .decimal('surface_area', 10, 2)
        .nullable()
        .comment('Surface area of the store in square meters')
      table.enum('status', STORE_STATUSES).defaultTo('active')

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index
      table.index(['location_code'])
      table.index(['status'])
      table.index(['store_type'])
      table.index(['code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
