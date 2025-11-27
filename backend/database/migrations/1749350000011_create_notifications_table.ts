import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').nullable().references('id').inTable('users')
      table.string('email', 255).notNullable()
      table.string('type', 50).notNullable()
      table.string('subject', 255).notNullable()
      table.text('content').notNullable()
      table.json('data').nullable()
      table.timestamp('sent_at').nullable()
      table.timestamp('failed_at').nullable()
      table.text('error_message').nullable()

      table.timestamp('created_at').defaultTo(this.now())

      // Index
      table.index(['user_id'])
      table.index(['email'])
      table.index(['type'])
      table.index(['sent_at'])
      table.index(['failed_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
