import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('documentable_type', 50).notNullable()
      table.uuid('documentable_id').notNullable()
      table.string('original_name', 255).notNullable()
      table.string('file_name', 255).notNullable()
      table.string('storage_path', 500).notNullable()
      table.string('public_url', 1000).nullable() // URL publique Minio
      table.string('mime_type', 100).nullable()
      table.bigInteger('size').nullable() // Changé en bigInteger pour de gros fichiers
      table.string('document_type', 100).nullable()
      table.string('bucket_name', 100).defaultTo('oncc-documents') // Nom du bucket Minio

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Polymorphic index
      table.index(['documentable_type', 'documentable_id'])
      table.index(['document_type'])
      table.index(['storage_path'])
      table.index(['bucket_name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
