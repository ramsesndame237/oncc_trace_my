import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('auditable_type', 50).notNullable()
      table.uuid('auditable_id').notNullable()
      table.uuid('user_id').nullable().references('id').inTable('users')
      table.string('user_role', 50).nullable()
      table.string('action', 50).notNullable()
      table.json('old_values').nullable()
      table.json('new_values').nullable()
      table.specificType('ip_address', 'inet').nullable()
      table.text('user_agent').nullable()

      table.timestamp('created_at').defaultTo(this.now())

      // Index polymorphique
      table.index(['auditable_type', 'auditable_id'])
      table.index(['user_id'])
      table.index(['action'])
      table.index(['created_at'])
      table.index(['user_role'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
