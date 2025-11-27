import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare documentableType: string

  @column()
  declare documentableId: string

  @column({ columnName: 'original_name' })
  declare originalName: string

  @column({ columnName: 'file_name' })
  declare fileName: string

  @column({ columnName: 'storage_path' })
  declare storagePath: string

  @column({ columnName: 'public_url' })
  declare publicUrl: string | null

  @column({ columnName: 'mime_type' })
  declare mimeType: string | null

  @column()
  declare size: number | null

  @column({ columnName: 'document_type' })
  declare documentType: string | null

  @column({ columnName: 'bucket_name' })
  declare bucketName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Utility methods
  public getDownloadUrl(): string {
    // Returns the public URL if available, otherwise the API download URL
    return this.publicUrl || `/api/documents/${this.id}/download`
  }

  public getPreviewUrl(): string | null {
    // Returns the preview URL if the file type allows it
    const previewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']

    if (this.mimeType && previewableTypes.includes(this.mimeType)) {
      return this.publicUrl || `/api/documents/${this.id}/preview`
    }

    return null
  }

  public isImage(): boolean {
    return this.mimeType?.startsWith('image/') || false
  }

  public isPdf(): boolean {
    return this.mimeType === 'application/pdf'
  }

  public getFormattedSize(): string {
    if (!this.size) return '0 B'

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(this.size) / Math.log(1024))

    return `${(this.size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  public getFileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || ''
  }

  public canPreview(): boolean {
    const previewableTypes = [
      // Images - formats spécifiques
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Images - format générique (temporaire pour compatibility)
      'image',
      // Documents
      'application/pdf',
      // Texte
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
    ]
    return this.mimeType ? previewableTypes.includes(this.mimeType) : false
  }
}
