import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'actors'

  async up() {
    // Supprimer la contrainte CHECK actuelle sur la colonne status
    this.schema.raw(`
      ALTER TABLE actors
      DROP CONSTRAINT IF EXISTS actors_status_check
    `)

    // Ajouter une nouvelle contrainte CHECK sans le statut 'draft'
    this.schema.raw(`
      ALTER TABLE actors
      ADD CONSTRAINT actors_status_check
      CHECK (status IN ('active', 'inactive'))
    `)
  }

  async down() {
    // Restaurer la contrainte CHECK avec le statut 'draft'
    this.schema.raw(`
      ALTER TABLE actors
      DROP CONSTRAINT IF EXISTS actors_status_check
    `)

    this.schema.raw(`
      ALTER TABLE actors
      ADD CONSTRAINT actors_status_check
      CHECK (status IN ('draft', 'active', 'inactive'))
    `)
  }
}
