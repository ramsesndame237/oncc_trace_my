import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_transfers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Rendre driver_info nullable pour supporter les transferts GROUPAGE
      // où les informations du chauffeur ne sont pas requises
      table.jsonb('driver_info').nullable().alter()
    })
  }

  async down() {
    // Avant de rendre driver_info NOT NULL, mettre une valeur par défaut pour les NULL existants
    await this.raw(`
      UPDATE ${this.tableName}
      SET driver_info = '{}'::jsonb
      WHERE driver_info IS NULL
    `)

    this.schema.alterTable(this.tableName, (table) => {
      // Restaurer la contrainte NOT NULL
      table.jsonb('driver_info').notNullable().alter()
    })
  }
}