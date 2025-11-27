import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'parcel_coordinates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('parcel_id').notNullable().references('id').inTable('parcels').onDelete('CASCADE')
      table.decimal('latitude', 11, 8).notNullable() // Format : -90.00000000 à 90.00000000
      table.decimal('longitude', 11, 8).notNullable() // Format : -180.00000000 à 180.00000000
      table.integer('point_order').defaultTo(1) // Ordre des points pour former un polygone

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Index
      table.index(['parcel_id'])
      table.index(['parcel_id', 'point_order'])
      table.index(['latitude', 'longitude'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
