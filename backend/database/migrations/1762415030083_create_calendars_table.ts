import { CALENDAR_STATUSES, CALENDAR_TYPES } from '#types/calendar_types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'calendars'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Primary key UUID
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Code unique pour le calendrier
      table.string('code', 100).unique().notNullable()

      // Type d'événement: MARCHE (événement de marché) ou ENLEVEMENT (collecte de produits)
      table.enum('type', CALENDAR_TYPES).notNullable()

      // Dates de l'événement
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()

      // Heure de l'événement (format HH:MM)
      table.time('event_time').nullable()

      // Code de localisation (clé étrangère vers locations.code)
      table.string('location_code', 20).nullable().references('code').inTable('locations')

      // Lieu de l'événement (description complète du lieu)
      table.text('location').nullable()

      // Référence à la campagne
      table
        .uuid('campaign_id')
        .notNullable()
        .references('id')
        .inTable('campaigns')
        .onDelete('CASCADE')

      // Référence à la convention (uniquement pour type ENLEVEMENT)
      table
        .uuid('convention_id')
        .nullable()
        .references('id')
        .inTable('conventions')
        .onDelete('SET NULL')

      // OPA (Organisation de Producteurs Agricoles) - FK vers actors (peut être null)
      table.uuid('opa_id').nullable().references('id').inTable('actors')

      // Statut de l'événement
      table.enum('status', CALENDAR_STATUSES).defaultTo('active')

      // Nombre de ventes attendues (uniquement pour les calendriers de type MARCHE)
      table.integer('expected_sales_count').nullable()

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index pour performance
      table.index(['code'])
      table.index(['type'])
      table.index(['campaign_id'])
      table.index(['convention_id'])
      table.index(['opa_id'])
      table.index(['status'])
      table.index(['start_date'])
      table.index(['end_date'])
      table.index(['location_code'])
      table.index(['deleted_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
