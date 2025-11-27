import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // L'extension pgcrypto est nécessaire pour générer des UUIDs
    await this.schema.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
  }

  async down() {
    // Il n'est généralement pas recommandé de supprimer l'extension
    // car d'autres parties du système pourraient en dépendre.
  }
}
