import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'actors'

  async up() {
    // Supprimer l'ancien CHECK constraint
    await this.db.rawQuery(`
      ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_status_check;
    `)

    // Ajouter le nouveau CHECK constraint avec 'pending'
    await this.db.rawQuery(`
      ALTER TABLE actors ADD CONSTRAINT actors_status_check
      CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text]));
    `)
  }

  async down() {
    // Supprimer le nouveau CHECK constraint
    await this.db.rawQuery(`
      ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_status_check;
    `)

    // Restaurer l'ancien CHECK constraint sans 'pending'
    await this.db.rawQuery(`
      ALTER TABLE actors ADD CONSTRAINT actors_status_check
      CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
    `)
  }
}
