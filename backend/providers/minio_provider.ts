import MinioService from '#services/minio_service'
import type { ApplicationService } from '@adonisjs/core/types'

export default class MinioProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton(MinioService, () => {
      return new MinioService()
    })
  }

  /**
   * The container bindings have booted
   */
  async ready() {
    try {
      const minio = await this.app.container.make(MinioService)
      await minio.initialize()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('MinioProvider: Failed to initialize Minio service:', errorMessage)
    }
  }
}
