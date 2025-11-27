import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'actors'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Champs pour la déclaration d'existence (OPA uniquement)
      table.date('existence_declaration_date').nullable() // Date de déclaration d'existence
      table.string('existence_declaration_code', 100).nullable() // Code de déclaration d'existence
      table.integer('existence_declaration_years').nullable() // Nombre d'années (2 ou 5)
      table.date('existence_expiry_date').nullable() // Date d'expiration calculée automatiquement

      // Index pour les requêtes de recherche d'OPA expirés
      table.index(['existence_expiry_date'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('existence_declaration_date')
      table.dropColumn('existence_declaration_code')
      table.dropColumn('existence_declaration_years')
      table.dropColumn('existence_expiry_date')
    })
  }
}
