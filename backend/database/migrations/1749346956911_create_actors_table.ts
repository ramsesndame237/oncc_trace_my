import { BaseSchema } from '@adonisjs/lucid/schema'
import { ACTOR_TYPES, ACTOR_STATUSES } from '#types/actor_types'

export default class extends BaseSchema {
  protected tableName = 'actors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.enum('actor_type', ACTOR_TYPES).notNullable()

      // Informations de base
      table.string('family_name', 200).notNullable()
      table.string('given_name', 100).notNullable()
      table.string('phone', 20).nullable()
      table.string('email', 255).nullable()

      // Identifications
      table.string('oncc_id', 100).nullable() // Identifiant ONCC
      table.string('identifiant_id', 100).nullable() // Identifiant unique

      // Localisation
      table.string('location_code', 20).nullable().references('code').inTable('locations')

      // Informations du manager (JSON)
      table.json('manager_info').nullable() // {nom, prenom, telephone, email}

      // Workflow
      table.enum('status', ACTOR_STATUSES).defaultTo('active')

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index
      table.index(['actor_type'])
      table.index(['location_code'])
      table.index(['status'])
      table.index(['identifiant_id'])
      table.index(['oncc_id'])
      table.index(['actor_type', 'status'])
      table.index(['deleted_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
