import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'submissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('submittable_type', 50).notNullable()
      table.uuid('submittable_id').notNullable()
      table.uuid('submitted_by').notNullable().references('id').inTable('users')
      table.string('submission_type', 50).notNullable()
      table.json('data_snapshot').notNullable()
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
      table.uuid('processed_by').nullable().references('id').inTable('users')
      table.timestamp('processed_at').nullable()
      table.text('rejection_reason').nullable()

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Index
      table.index(['submittable_type', 'submittable_id'])
      table.index(['submitted_by'])
      table.index(['status'])
      table.index(['processed_by'])
      table.index(['submission_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
