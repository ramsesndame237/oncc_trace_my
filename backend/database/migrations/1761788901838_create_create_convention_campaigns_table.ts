import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'convention_campaign'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire UUID
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Relations
      table.uuid('convention_id').notNullable()
      table.foreign('convention_id').references('id').inTable('conventions').onDelete('CASCADE')

      table.uuid('campaign_id').notNullable()
      table.foreign('campaign_id').references('id').inTable('campaigns').onDelete('CASCADE')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Contrainte unique: une convention ne peut être associée qu'une fois à une campagne
      table.unique(['convention_id', 'campaign_id'])

      // Index pour améliorer les performances
      table.index(['convention_id'])
      table.index(['campaign_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
