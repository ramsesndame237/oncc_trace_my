import { Client } from 'minio'
import minioConfig from '#config/minio'
import logger from '@adonisjs/core/services/logger'
import { v4 as uuidv4 } from 'uuid'
import path from 'node:path'
import { encodeContentDispositionFilename } from '#utils/filename_encoder'

export default class MinioService {
  private client: Client
  private bucket: string

  constructor() {
    this.client = new Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    })
    this.bucket = minioConfig.bucket
  }

  /**
   * Get bucket name
   */
  getBucketName(): string {
    return this.bucket
  }

  /**
   * Initialize Minio - create bucket if it doesn't exist and set it public
   */
  async initialize(): Promise<void> {
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Test connection with a simple operation
        await this.client.listBuckets()

        // Check if bucket exists
        const bucketExists = await this.client.bucketExists(this.bucket)

        if (!bucketExists) {
          // Create bucket
          await this.client.makeBucket(this.bucket, minioConfig.region)
          logger.info(`Bucket '${this.bucket}' created successfully`)
        }

        // Set bucket policy to public
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }

        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy))
        logger.info(`Bucket '${this.bucket}' is now public`)
        return // Success, exit the retry loop
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        if (attempt === maxRetries) {
          console.warn(`Minio initialization failed after ${maxRetries} attempts: ${errorMessage}`)
          console.warn(
            `Note: Minio may not be accessible from localhost in development mode. This is normal if running outside Docker.`
          )
          // Ne pas bloquer l'application si Minio n'est pas disponible
          return
        }

        console.warn(
          `Minio initialization attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms: ${errorMessage}`
        )
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    }
  }

  /**
   * Upload a file to Minio
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    documentType?: string
  ): Promise<{
    fileName: string
    storagePath: string
    size: number
    publicUrl: string
  }> {
    try {
      // Generate unique filename
      const fileExtension = path.extname(originalName)
      const fileName = `${uuidv4()}${fileExtension}`

      // Create folder structure based on document type
      const folder = documentType ? `${documentType}/` : 'documents/'
      const storagePath = `${folder}${fileName}`

      // Upload file with properly encoded filename according to RFC 5987
      const contentDisposition = `inline; ${encodeContentDispositionFilename(originalName)}`
      await this.client.putObject(this.bucket, storagePath, buffer, buffer.length, {
        'Content-Type': mimeType,
        'Content-Disposition': contentDisposition,
      })

      // Generate public URL
      const publicUrl = this.getPublicUrl(storagePath)

      return {
        fileName,
        storagePath,
        size: buffer.length,
        publicUrl,
      }
    } catch (error) {
      logger.error('Error uploading file to Minio:', error)
      throw error
    }
  }

  /**
   * Get a file from Minio
   */
  async getFile(storagePath: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucket, storagePath)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks)))
      })
    } catch (error) {
      logger.error('Error getting file from Minio:', error)
      throw error
    }
  }

  /**
   * Delete a file from Minio
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, storagePath)
      logger.info(`File '${storagePath}' deleted successfully`)
    } catch (error) {
      logger.error('Error deleting file from Minio:', error)
      throw error
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(storagePath: string): string {
    const protocol = minioConfig.useSSL ? 'https' : 'http'
    const port = minioConfig.port === 80 || minioConfig.port === 443 ? '' : `:${minioConfig.port}`
    return `${protocol}://${minioConfig.endPoint}${port}/${this.bucket}/${storagePath}`
  }

  /**
   * Get file info
   */
  async getFileInfo(storagePath: string) {
    try {
      return await this.client.statObject(this.bucket, storagePath)
    } catch (error) {
      logger.error('Error getting file info from Minio:', error)
      throw error
    }
  }

  /**
   * Generate presigned URL for direct upload (if needed)
   */
  async getPresignedUploadUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.client.presignedPutObject(this.bucket, storagePath, expiresIn)
    } catch (error) {
      logger.error('Error generating presigned URL:', error)
      throw error
    }
  }

  /**
   * Generate presigned URL for download (if needed for private files)
   */
  async getPresignedDownloadUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(this.bucket, storagePath, expiresIn)
    } catch (error) {
      logger.error('Error generating presigned download URL:', error)
      throw error
    }
  }
}
