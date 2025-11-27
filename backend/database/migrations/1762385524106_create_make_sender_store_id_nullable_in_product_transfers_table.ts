import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_transfers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Rendre sender_store_id nullable pour supporter les transferts GROUPAGE
      // où le producteur (expéditeur) n'a pas de magasin
      table.uuid('sender_store_id').nullable().alter()
    })
  }

  async down() {
    // Vérifier s'il y a des valeurs NULL avant de restaurer NOT NULL
    const result = await this.raw(`
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE sender_store_id IS NULL
    `)

    const hasNullValues = parseInt(result.rows[0]?.count || '0') > 0

    if (hasNullValues) {
      // Si des valeurs NULL existent, ne pas restaurer NOT NULL
      // car cela pourrait causer une erreur de contrainte
      console.warn(
        `⚠️  Rollback partiel: sender_store_id contient des valeurs NULL, ` +
          `la contrainte NOT NULL ne sera pas restaurée`
      )
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      // Restaurer la contrainte NOT NULL seulement si aucune valeur NULL
      table.uuid('sender_store_id').notNullable().alter()
    })
  }
}