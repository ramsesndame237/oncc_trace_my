import { LOCATION_STATUSES, LOCATION_TYPES } from '#types/location_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'locations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('code', 20).primary()
      table.string('name', 100).notNullable()
      table.enum('type', LOCATION_TYPES).notNullable()
      table.string('parent_code', 20).nullable().references('code').inTable('locations')
      table.enum('status', LOCATION_STATUSES).defaultTo('active')

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Index pour optimiser les requêtes hiérarchiques
      table.index(['parent_code'])
      table.index(['type'])
      table.index(['status'])
      table.index(['type', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
