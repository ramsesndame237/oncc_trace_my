import Document from '#models/document'
import DocumentService from '#services/document_service'
import MinioService from '#services/minio_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import { encodeContentDispositionFilename } from '#utils/filename_encoder'
import { inject } from '@adonisjs/core'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'

@inject()
export default class DocumentsController {
  constructor(protected documentService: DocumentService) {}
  /**
   * Upload un ou plusieurs documents
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Récupérer les données directement depuis la requête
      const documentableType = request.input('documentable_type')
      const documentableId = request.input('documentable_id')
      const documentTypes = request.input('document_types', [])
      const originalNames = request.input('original_names[]', [])
      const files = request.files('files', {})

      // Validation simple
      if (!documentableType || !documentableId) {
        return ApiResponse.error(
          response,
          ErrorCodes.VALIDATION_FAILED,
          400,
          'documentable_type et documentable_id sont requis'
        )
      }

      if (!files || (Array.isArray(files) ? files.length === 0 : !files)) {
        return ApiResponse.error(
          response,
          ErrorCodes.VALIDATION_FAILED,
          400,
          'Au moins un fichier est requis'
        )
      }

      // Convertir en array si ce n'est pas déjà le cas
      const fileArray = Array.isArray(files) ? files : [files]
      const validFiles = fileArray.filter((file) => file instanceof MultipartFile)

      // Préparer les types de documents
      // Si documentTypes n'est pas fourni ou vide, utiliser undefined pour chaque fichier
      const finalDocumentTypes =
        documentTypes.length > 0 ? documentTypes : validFiles.map(() => undefined)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Utiliser le service pour uploader les documents avec audit logs
      const uploadResult = await this.documentService.uploadDocuments(
        validFiles,
        documentableType,
        documentableId,
        finalDocumentTypes,
        auditContext,
        undefined, // replacedDocuments
        originalNames.length > 0 ? originalNames : undefined
      )

      // Si aucun document n'a été uploadé avec succès
      if (uploadResult.success.length === 0) {
        const errorMessages = uploadResult.errors.map((err) => err.error).join(', ')
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_UPLOAD_FAILED,
          400,
          `Aucun document n'a pu être uploadé: ${errorMessages}`
        )
      }

      return ApiResponse.success(response, SuccessCodes.DOCUMENT_CREATED, {
        documents: uploadResult.success,
        errors: uploadResult.errors.length > 0 ? uploadResult.errors : undefined,
        summary: uploadResult.summary,
        message: `${uploadResult.summary.successful} document(s) uploadé(s) avec succès${uploadResult.summary.failed > 0 ? `, ${uploadResult.summary.failed} échoué(s)` : ''}`,
      })
    } catch (error) {
      console.error('Erreur dans documents_controller.store:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_CREATION_FAILED,
        500,
        "Erreur lors de l'upload des documents"
      )
    }
  }

  /**
   * Récupérer un document par son ID
   */
  async show({ params, response }: HttpContext) {
    try {
      const document = await Document.find(params.id)

      if (!document) {
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_NOT_FOUND,
          404,
          'Document non trouvé'
        )
      }

      return ApiResponse.success(response, SuccessCodes.DOCUMENT_FETCH_SUCCESS, {
        document,
      })
    } catch (error) {
      console.error('Erreur dans documents_controller.show:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_LIST_FAILED,
        500,
        'Erreur lors de la récupération du document'
      )
    }
  }

  /**
   * Télécharger un document
   */
  async download({ params, response }: HttpContext) {
    try {
      const document = await Document.find(params.id)

      if (!document) {
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_NOT_FOUND,
          404,
          'Document non trouvé'
        )
      }

      // Si publicUrl est une URL externe (pas d'URL Docker interne), rediriger vers celle-ci
      if (document.publicUrl && !document.publicUrl.includes('minio:9000')) {
        return response.redirect(document.publicUrl)
      }

      // Sinon, servir le fichier directement depuis Minio
      const minio = await app.container.make(MinioService)
      try {
        const fileBuffer = await minio.getFile(document.storagePath)

        return response
          .header('Content-Type', document.mimeType || 'application/octet-stream')
          .header(
            'Content-Disposition',
            `attachment; ${encodeContentDispositionFilename(document.originalName)}`
          )
          .header('Content-Length', fileBuffer.length.toString())
          .send(fileBuffer)
      } catch (minioError) {
        console.error('Erreur Minio lors du téléchargement:', minioError)
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_NOT_FOUND,
          404,
          'Fichier non trouvé dans le stockage'
        )
      }
    } catch (error) {
      console.error('Erreur dans documents_controller.download:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_DOWNLOAD_FAILED,
        500,
        'Erreur lors du téléchargement du document'
      )
    }
  }

  /**
   * Prévisualiser un document (pour les images et PDF)
   */
  async preview({ params, response }: HttpContext) {
    try {
      const document = await Document.find(params.id)

      if (!document) {
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_NOT_FOUND,
          404,
          'Document non trouvé'
        )
      }

      if (!document.canPreview()) {
        return ApiResponse.error(
          response,
          ErrorCodes.VALIDATION_FAILED,
          400,
          'Ce type de document ne peut pas être prévisualisé'
        )
      }

      // Si publicUrl est une URL externe (pas d'URL Docker interne), rediriger vers celle-ci
      if (document.publicUrl && !document.publicUrl.includes('minio:9000')) {
        return response.redirect(document.publicUrl)
      }

      // Sinon, servir le fichier directement depuis Minio
      const minio = await app.container.make(MinioService)
      try {
        const fileBuffer = await minio.getFile(document.storagePath)

        return response
          .header('Content-Type', document.mimeType || 'application/octet-stream')
          .header(
            'Content-Disposition',
            `inline; ${encodeContentDispositionFilename(document.originalName)}`
          )
          .header('Content-Length', fileBuffer.length.toString())
          .send(fileBuffer)
      } catch (minioError) {
        console.error('Erreur Minio lors de la prévisualisation:', minioError)
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_NOT_FOUND,
          404,
          'Fichier non trouvé dans le stockage'
        )
      }
    } catch (error) {
      console.error('Erreur dans documents_controller.preview:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_DOWNLOAD_FAILED,
        500,
        'Erreur lors de la prévisualisation du document'
      )
    }
  }

  /**
   * Lister les documents d'une entité
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const documentableType = request.input('documentable_type')
      const documentableId = request.input('documentable_id')
      const documentType = request.input('document_type')

      const query = Document.query().whereNull('deleted_at')

      if (documentableType) {
        query.where('documentable_type', documentableType)
      }

      if (documentableId) {
        query.where('documentable_id', documentableId)
      }

      if (documentType) {
        query.where('document_type', documentType)
      }

      const documents = await query.orderBy('created_at', 'desc').paginate(page, limit)

      return ApiResponse.success(response, SuccessCodes.DOCUMENTS_FETCHED, documents.serialize())
    } catch (error) {
      console.error('Erreur dans documents_controller.index:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_DOWNLOAD_FAILED,
        500,
        'Erreur lors de la récupération des documents'
      )
    }
  }

  /**
   * Supprimer un document
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const document = await Document.find(params.id)

      if (!document) {
        return ApiResponse.error(
          response,
          ErrorCodes.DOCUMENT_NOT_FOUND,
          404,
          'Document non trouvé'
        )
      }

      // Supprimer le fichier de Minio
      const minio = await app.container.make(MinioService)
      try {
        await minio.deleteFile(document.storagePath)
      } catch (minioError) {
        console.error('Erreur lors de la suppression du fichier Minio:', minioError)
        // Continue même si la suppression Minio échoue
      }

      // Soft delete du document
      document.deletedAt = DateTime.now()
      await document.save()

      return ApiResponse.success(response, SuccessCodes.DOCUMENT_DELETED, {
        message: 'Document supprimé avec succès',
      })
    } catch (error) {
      console.error('Erreur dans documents_controller.destroy:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_DOWNLOAD_FAILED,
        500,
        'Erreur lors de la suppression du document'
      )
    }
  }

  /**
   * Synchroniser les documents d'une entité (ajout, conservation, suppression)
   *
   * Cette méthode permet de :
   * - Ajouter de nouveaux fichiers
   * - Conserver les fichiers existants (identifiés par leur ID)
   * - Supprimer les fichiers qui ne sont plus dans la requête
   *
   * Paramètres attendus :
   * - files: Nouveaux fichiers à uploader
   * - existing_document_ids: Tableau des IDs des documents à conserver (JSON stringifié)
   * - documentable_type: Type de l'entité (Actor, Parcel, etc.)
   * - documentable_id: ID de l'entité
   * - document_types: Types de documents (optionnel, JSON stringifié)
   */
  async sync({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Récupérer les paramètres
      const documentableType = request.input('documentable_type')
      const documentableId = request.input('documentable_id')
      const existingDocumentIdsJson = request.input('existing_document_ids', '[]')
      const documentTypesJson = request.input('document_types')
      const originalNames = request.input('original_names[]', [])

      // Parser les IDs des documents existants
      let existingDocumentIds: string[] = []
      try {
        existingDocumentIds = JSON.parse(existingDocumentIdsJson)
      } catch (parseError) {
        return ApiResponse.error(
          response,
          ErrorCodes.VALIDATION_FAILED,
          400,
          'Format invalide pour existing_document_ids (doit être un tableau JSON)'
        )
      }

      // Parser les types de documents si fournis
      let documentTypes: string[] | undefined
      if (documentTypesJson) {
        try {
          documentTypes = JSON.parse(documentTypesJson)
        } catch (parseError) {
          return ApiResponse.error(
            response,
            ErrorCodes.VALIDATION_FAILED,
            400,
            'Format invalide pour document_types (doit être un tableau JSON)'
          )
        }
      }

      // Récupérer les nouveaux fichiers
      const files = request.files('files', {})

      // Validation
      if (!documentableType || !documentableId) {
        return ApiResponse.error(
          response,
          ErrorCodes.VALIDATION_FAILED,
          400,
          'documentable_type et documentable_id sont requis'
        )
      }

      // Convertir en array si ce n'est pas déjà le cas
      const fileArray = files ? (Array.isArray(files) ? files : [files]) : []
      const validFiles = fileArray.filter((file) => file instanceof MultipartFile)

      // Préparer le contexte d'audit
      const auditContext = {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }

      // Synchroniser les documents
      const syncResult = await this.documentService.syncDocuments(
        validFiles,
        existingDocumentIds,
        documentableType,
        documentableId,
        documentTypes,
        auditContext,
        originalNames.length > 0 ? originalNames : undefined
      )

      return ApiResponse.success(response, SuccessCodes.DOCUMENT_SYNC_SUCCESS, {
        added: syncResult.added,
        kept: syncResult.kept,
        deleted: syncResult.deleted,
        updated: syncResult.updated,
        errors: syncResult.errors.length > 0 ? syncResult.errors : undefined,
        summary: syncResult.summary,
        message: `Synchronisation terminée: ${syncResult.summary.added} ajouté(s), ${syncResult.summary.kept} conservé(s), ${syncResult.summary.updated} mis à jour, ${syncResult.summary.deleted} supprimé(s)${syncResult.summary.failed > 0 ? `, ${syncResult.summary.failed} échoué(s)` : ''}`,
      })
    } catch (error) {
      console.error('Erreur dans documents_controller.sync:', error)
      return ApiResponse.error(
        response,
        ErrorCodes.DOCUMENT_SYNC_FAILED,
        500,
        'Erreur lors de la synchronisation des documents'
      )
    }
  }
}
