import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'production_basin_locations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('production_basin_id')
        .notNullable()
        .references('id')
        .inTable('production_basins')
        .onDelete('CASCADE')
      table.string('location_code', 20).notNullable().references('code').inTable('locations')

      table.timestamp('created_at').defaultTo(this.now())

      // Contrainte d'unicité
      table.unique(['production_basin_id', 'location_code'])

      // Index
      table.index(['production_basin_id'])
      table.index(['location_code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
