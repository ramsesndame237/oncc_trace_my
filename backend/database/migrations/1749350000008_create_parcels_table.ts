import { PARCEL_STATUSES, PARCEL_TYPES } from '#types/parcel_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'parcels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('producer_id').notNullable().references('id').inTable('actors').onDelete('CASCADE')
      table.string('location_code', 20).notNullable().references('code').inTable('locations')
      table.decimal('surface_area', 10, 2).nullable()
      table.date('parcel_creation_date').nullable()

      // Nouveaux champs en anglais
      table.enum('parcel_type', PARCEL_TYPES).defaultTo('individual_private')
      table.string('identification_id', 50).nullable()
      table.string('oncc_id', 50).nullable().unique()
      table.enum('status', PARCEL_STATUSES).notNullable().defaultTo('active')

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index
      table.index(['producer_id'])
      table.index(['location_code'])
      table.index(['parcel_type'])
      table.index(['identification_id'])
      table.index(['oncc_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
