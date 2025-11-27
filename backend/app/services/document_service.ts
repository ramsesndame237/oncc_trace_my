import AuditLog from '#models/audit_log'
import Document from '#models/document'
import MinioService from '#services/minio_service'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

export interface DocumentValidationError {
  index: number
  documentType: string
  fileName: string
  field: string
  error: string
}

export interface DocumentValidationResult {
  valid: boolean
  errors: DocumentValidationError[]
}

export interface DocumentUploadError {
  index: number
  documentType: string
  fileName: string
  error: string
}

export interface DocumentUploadResult {
  success: Document[]
  errors: DocumentUploadError[]
  summary: {
    total: number
    successful: number
    failed: number
  }
}

export default class DocumentService {
  private readonly maxSize = 10 * 1024 * 1024 // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text',
    'image',
  ]

  /**
   * Valider une liste de fichiers avec leurs types de documents
   */
  async validateDocuments(
    files: MultipartFile[],
    documentTypes?: string[]
  ): Promise<DocumentValidationResult> {
    const errors: DocumentValidationError[] = []

    for (const [index, file] of files.entries()) {
      const documentType = documentTypes?.[index] || 'Type non spécifié'

      // Vérifier si le fichier est une instance valide de MultipartFile
      if (!(file instanceof MultipartFile)) {
        errors.push({
          index,
          documentType,
          fileName: 'Fichier inconnu',
          field: 'type',
          error: "Le fichier fourni n'est pas valide",
        })
        continue
      }

      // Vérifier la validité du fichier selon AdonisJS
      if (!file.isValid) {
        const fileErrors = file.errors.map((error) => error.message).join(', ')
        errors.push({
          index,
          documentType,
          fileName: file.clientName,
          field: 'validation',
          error: `Fichier invalide: ${fileErrors}`,
        })
        continue
      }

      // Vérifier la taille du fichier
      if (file.size > this.maxSize) {
        errors.push({
          index,
          documentType,
          fileName: file.clientName,
          field: 'size',
          error: `Le fichier est trop volumineux. Taille: ${this.formatFileSize(file.size)}, Maximum: ${this.formatFileSize(this.maxSize)}`,
        })
      }

      // Vérifier le type MIME
      const mimeType = file.type || 'application/octet-stream'
      if (!this.allowedMimeTypes.includes(mimeType)) {
        errors.push({
          index,
          documentType,
          fileName: file.clientName,
          field: 'mimeType',
          error: `Type de fichier non autorisé: ${mimeType}. Types autorisés: ${this.allowedMimeTypes.join(', ')}`,
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Upload et créer plusieurs documents pour une entité avec audit logs
   * (Logique extraite du DocumentsController qui fonctionne déjà)
   */
  async uploadDocuments(
    files: MultipartFile[],
    documentableType: string,
    documentableId: string,
    documentTypes?: string[],
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    },
    replacedDocuments?: Document[],
    originalNames?: string[]
  ): Promise<DocumentUploadResult> {
    const result: DocumentUploadResult = {
      success: [],
      errors: [],
      summary: {
        total: files.length,
        successful: 0,
        failed: 0,
      },
    }

    const minio = await app.container.make(MinioService)

    // Convertir en array si ce n'est pas déjà le cas
    const fileArray = Array.isArray(files) ? files : [files]

    for (const [index, file] of fileArray.entries()) {
      const documentType = documentTypes?.[index] || undefined

      // Utiliser le nom original s'il est fourni, sinon utiliser clientName
      const originalFileName = originalNames?.[index] || file.clientName

      // Vérifier si ce document remplace un document existant
      const replacedDocument = replacedDocuments?.find((doc) => doc.documentType === documentType)

      // Vérifier si le fichier est une instance valide de MultipartFile
      if (!(file instanceof MultipartFile)) {
        result.errors.push({
          index,
          documentType: documentType || 'Type non spécifié',
          fileName: originalFileName,
          error: "Le fichier fourni n'est pas valide",
        })
        result.summary.failed++
        continue
      }

      // Validation du fichier selon AdonisJS
      if (!file.isValid) {
        const fileErrors = file.errors.map((error) => error.message).join(', ')
        result.errors.push({
          index,
          documentType: documentType || 'Type non spécifié',
          fileName: originalFileName,
          error: `Fichier invalide: ${fileErrors}`,
        })
        result.summary.failed++
        continue
      }

      // Vérifier la taille du fichier (max 10MB)
      if (file.size > this.maxSize) {
        result.errors.push({
          index,
          documentType: documentType || 'Type non spécifié',
          fileName: originalFileName,
          error: `Le fichier est trop volumineux. Taille maximale: ${this.formatFileSize(this.maxSize)}`,
        })
        result.summary.failed++
        continue
      }

      // Vérifier le type MIME
      // AdonisJS MultipartFile sépare type et subtype, il faut les combiner
      const mimeTypeToValidate =
        this.buildCorrectMimeType(file.type ?? '', file.subtype ?? null) ||
        'application/octet-stream'
      if (!this.allowedMimeTypes.includes(mimeTypeToValidate)) {
        result.errors.push({
          index,
          documentType: documentType || 'Type non spécifié',
          fileName: originalFileName,
          error: `Type de fichier non autorisé: ${mimeTypeToValidate}`,
        })
        result.summary.failed++
        continue
      }

      try {
        // Lire le fichier en buffer
        const buffer = await fs.readFile(file.tmpPath!)

        // Construire le MIME type correct à partir du type et subtype
        const finalMimeType =
          this.buildCorrectMimeType(mimeTypeToValidate, file.subtype ?? null) ||
          'application/octet-stream'

        // Upload vers Minio - utiliser le nom original pour le stockage
        const uploadResult = await minio.uploadFile(
          buffer,
          originalFileName,
          finalMimeType,
          documentType
        )

        // Créer l'enregistrement en base avec le nom original
        const document = await Document.create({
          documentableType,
          documentableId,
          originalName: originalFileName,
          fileName: uploadResult.fileName,
          storagePath: uploadResult.storagePath,
          publicUrl: uploadResult.publicUrl,
          mimeType: finalMimeType,
          size: uploadResult.size,
          documentType: documentType,
          bucketName: minio.getBucketName(),
        })

        result.success.push(document)
        result.summary.successful++

        // Créer les audit logs si le contexte est fourni
        if (auditContext) {
          try {
            const newValues: any = {
              documentableType: document.documentableType,
              documentableId: document.documentableId,
              originalName: document.originalName,
              fileName: document.fileName,
              mimeType: document.mimeType,
              size: document.size,
              documentType: document.documentType,
            }

            // Audit pour le document lui-même
            await AuditLog.logAction({
              auditableType: 'Document',
              auditableId: document.id,
              action: replacedDocument ? 'update' : 'create',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues: replacedDocument
                ? {
                    document_id: replacedDocument.id,
                    document_type: replacedDocument.documentType,
                    document_name: replacedDocument.originalName,
                    document_size: replacedDocument.size,
                    document_mime_type: replacedDocument.mimeType,
                  }
                : null,
              newValues,
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })

            // Déterminer l'action: 'add_document' ou 'update_document'
            const auditAction = replacedDocument ? 'update_document' : 'add_document'
            const oldDocumentValues = replacedDocument
              ? {
                  document_id: replacedDocument.id,
                  document_type: replacedDocument.documentType,
                  document_name: replacedDocument.originalName,
                  document_size: replacedDocument.size,
                  document_mime_type: replacedDocument.mimeType,
                }
              : null

            // Si le document est attaché à un acteur, créer aussi un audit pour l'acteur
            if (document.documentableType === 'Actor') {
              await AuditLog.logAction({
                auditableType: 'Actor',
                auditableId: document.documentableId,
                action: auditAction,
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: oldDocumentValues,
                newValues: {
                  document_id: document.id,
                  document_type: document.documentType,
                  document_name: document.originalName,
                  document_size: document.size,
                  document_mime_type: document.mimeType,
                },
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            }

            // Si le document est attaché à une convention, créer aussi un audit pour la convention
            if (document.documentableType === 'Convention') {
              await AuditLog.logAction({
                auditableType: 'convention',
                auditableId: document.documentableId,
                action: auditAction,
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: oldDocumentValues,
                newValues: {
                  document_id: document.id,
                  document_type: document.documentType,
                  document_name: document.originalName,
                  document_size: document.size,
                  document_mime_type: document.mimeType,
                },
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            }

            // Si le document est attaché à un transfert de produit, créer aussi un audit pour le transfert
            if (document.documentableType === 'ProductTransfer') {
              await AuditLog.logAction({
                auditableType: 'product_transfer',
                auditableId: document.documentableId,
                action: auditAction,
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: oldDocumentValues,
                newValues: {
                  document_id: document.id,
                  document_type: document.documentType,
                  document_name: document.originalName,
                  document_size: document.size,
                  document_mime_type: document.mimeType,
                },
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            }
          } catch (auditError) {
            console.error(
              "Erreur lors de l'enregistrement de l'audit log pour le document:",
              auditError
            )
            // On ne bloque pas l'upload si l'audit log échoue
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        result.errors.push({
          index,
          documentType: documentType || 'Type non spécifié',
          fileName: originalFileName,
          error: `Erreur lors de l'upload: ${errorMessage}`,
        })
        result.summary.failed++
      }
    }

    return result
  }

  /**
   * Construit le type MIME correct à partir du type et subtype
   * (Repris du DocumentsController)
   */
  private buildCorrectMimeType(type: string | null, subtype: string | null): string | null {
    if (!type) {
      return null
    }

    // Si le type est déjà complet (contient /), le retourner tel quel
    if (type.includes('/')) {
      return type
    }

    // Si nous avons un subtype, construire le type complet
    if (subtype) {
      return `${type}/${subtype}`
    }

    // Cas spéciaux pour les types génériques courants
    const genericToSpecific: Record<string, string> = {
      image: 'image/jpeg', // défaut pour image générique
      text: 'text/plain',
      application: 'application/octet-stream',
    }

    return genericToSpecific[type] || type
  }

  /**
   * Synchroniser les documents d'une entité (ajout, conservation, suppression)
   */
  async syncDocuments(
    files: MultipartFile[],
    existingDocumentIds: string[],
    documentableType: string,
    documentableId: string,
    documentTypes?: string[],
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    },
    originalNames?: string[]
  ): Promise<{
    added: Document[]
    kept: Document[]
    deleted: Document[]
    updated: Document[]
    errors: DocumentUploadError[]
    summary: {
      totalFiles: number
      added: number
      kept: number
      deleted: number
      updated: number
      failed: number
    }
  }> {
    const result = {
      added: [] as Document[],
      kept: [] as Document[],
      deleted: [] as Document[],
      updated: [] as Document[],
      errors: [] as DocumentUploadError[],
      summary: {
        totalFiles: files.length,
        added: 0,
        kept: 0,
        deleted: 0,
        updated: 0,
        failed: 0,
      },
    }

    // 1. Récupérer tous les documents existants pour cette entité
    const allExistingDocuments = await Document.query()
      .where('documentable_type', documentableType)
      .where('documentable_id', documentableId)
      .whereNull('deleted_at')

    // 2. Identifier les documents à conserver (ceux qui ont un ID dans la liste fournie)
    const documentsToKeep = allExistingDocuments.filter((doc) =>
      existingDocumentIds.includes(doc.id)
    )
    result.kept = documentsToKeep
    result.summary.kept = documentsToKeep.length

    // 3. Identifier les documents qui seront remplacés (update)
    // Un document est considéré comme "remplacé" si :
    // - Il n'est pas dans la liste à conserver (sera supprimé)
    // - ET un nouveau fichier du même documentType est envoyé
    const newDocumentTypes = documentTypes || []
    const documentsToUpdate = allExistingDocuments.filter((doc) => {
      // Le document n'est pas conservé
      if (existingDocumentIds.includes(doc.id)) {
        return false
      }
      // Vérifier si un nouveau fichier du même type est envoyé
      return newDocumentTypes.includes(doc.documentType || '')
    })

    // 4. Identifier les documents à supprimer (ceux qui ne sont pas dans la liste fournie ET ne sont pas remplacés)
    const documentsToDelete = allExistingDocuments.filter((doc) => {
      if (existingDocumentIds.includes(doc.id)) {
        return false
      }
      // Ne pas supprimer si c'est un remplacement
      return !documentsToUpdate.some((updateDoc) => updateDoc.id === doc.id)
    })

    // 4. Supprimer les documents qui ne sont plus présents
    const minio = await app.container.make(MinioService)
    for (const doc of documentsToDelete) {
      try {
        // Supprimer de Minio
        try {
          await minio.deleteFile(doc.storagePath)
        } catch (minioError) {
          console.error('Erreur lors de la suppression du fichier Minio:', minioError)
        }

        // Soft delete en base
        await doc.merge({ deletedAt: DateTime.now() }).save()
        result.deleted.push(doc)
        result.summary.deleted++

        // Créer l'audit log pour la suppression
        if (auditContext) {
          try {
            await AuditLog.logAction({
              auditableType: 'Document',
              auditableId: doc.id,
              action: 'delete',
              userId: auditContext.userId,
              userRole: auditContext.userRole,
              oldValues: {
                originalName: doc.originalName,
                fileName: doc.fileName,
                documentType: doc.documentType,
              },
              newValues: null,
              ipAddress: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
            })

            // Si le document était attaché à un acteur
            if (doc.documentableType === 'Actor') {
              await AuditLog.logAction({
                auditableType: 'Actor',
                auditableId: doc.documentableId,
                action: 'remove_document',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: {
                  document_id: doc.id,
                  document_type: doc.documentType,
                  document_name: doc.originalName,
                },
                newValues: null,
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            }

            // Si le document était attaché à une convention
            if (doc.documentableType === 'Convention') {
              await AuditLog.logAction({
                auditableType: 'convention',
                auditableId: doc.documentableId,
                action: 'remove_document',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: {
                  document_id: doc.id,
                  document_type: doc.documentType,
                  document_name: doc.originalName,
                },
                newValues: null,
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            }

            // Si le document était attaché à un transfert de produit
            if (doc.documentableType === 'ProductTransfer') {
              await AuditLog.logAction({
                auditableType: 'product_transfer',
                auditableId: doc.documentableId,
                action: 'remove_document',
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                oldValues: {
                  document_id: doc.id,
                  document_type: doc.documentType,
                  document_name: doc.originalName,
                },
                newValues: null,
                ipAddress: auditContext.ipAddress,
                userAgent: auditContext.userAgent,
              })
            }
          } catch (auditError) {
            console.error("Erreur lors de l'enregistrement de l'audit log:", auditError)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du document:', error)
      }
    }

    // 5. Traiter les documents remplacés (update)
    // Supprimer les anciens fichiers physiquement de Minio et en base
    for (const doc of documentsToUpdate) {
      try {
        // Supprimer de Minio
        try {
          await minio.deleteFile(doc.storagePath)
        } catch (minioError) {
          console.error('Erreur lors de la suppression du fichier Minio:', minioError)
        }

        // Soft delete en base
        await doc.merge({ deletedAt: DateTime.now() }).save()
        result.updated.push(doc)
        result.summary.updated++
      } catch (error) {
        console.error('Erreur lors du remplacement du document:', error)
      }
    }

    // 6. Uploader les nouveaux fichiers
    if (files.length > 0) {
      const uploadResult = await this.uploadDocuments(
        files,
        documentableType,
        documentableId,
        documentTypes,
        auditContext,
        documentsToUpdate, // Passer les documents remplacés pour créer l'audit log approprié
        originalNames
      )

      result.added = uploadResult.success
      result.errors = uploadResult.errors
      result.summary.added = uploadResult.summary.successful
      result.summary.failed = uploadResult.summary.failed
    }

    return result
  }

  /**
   * Formater la taille du fichier en format lisible
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }
}
