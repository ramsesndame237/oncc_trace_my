import { USER_ROLES, USER_STATUSES } from '#types/user_roles'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('username', 100).unique().notNullable()
      table.string('family_name', 100).notNullable()
      table.string('given_name', 100).notNullable()
      table.string('email', 255).unique().nullable()
      table.string('phone', 20).nullable()
      table.string('password_hash', 255).notNullable()
      table.enum('role', USER_ROLES).notNullable()
      table.uuid('production_basin_id').nullable().references('id').inTable('production_basins')
      table.string('lang', 5).defaultTo('fr').checkIn(['fr', 'en'])
      table.enum('status', USER_STATUSES).defaultTo('active')

      // Questions de sécurité
      table.text('security_question_1').nullable()
      table.string('security_answer_1_hash', 255).nullable()
      table.text('security_question_2').nullable()
      table.string('security_answer_2_hash', 255).nullable()
      table.text('security_question_3').nullable()
      table.string('security_answer_3_hash', 255).nullable()

      // Gestion des sessions et sécurité
      table.timestamp('last_login_at').nullable()
      table.timestamp('password_changed_at').nullable()
      table.boolean('must_change_password').defaultTo(false)

      // Lien vers acteur pour les comptes GERANT
      table.uuid('actor_id').nullable().references('id').inTable('actors')

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Index
      table.index(['email'])
      table.index(['username'])
      table.index(['role'])
      table.index(['production_basin_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
