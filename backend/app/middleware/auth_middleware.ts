import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware d'authentification
 * Vérifie que l'utilisateur est connecté avec un token valide
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Vérifier l'authentification
      await ctx.auth.authenticate()

      // Vérifier que l'utilisateur est actif
      const user = ctx.auth.user!
      if (!user.isActive()) {
        return ctx.response.status(401).json({
          success: false,
          message: 'Compte inactif ou bloqué',
        })
      }

      // Load necessary relations
      await user.load('productionBasin')
      await user.load('actor')

      return next()
    } catch (error) {
      if (error instanceof errors.E_UNAUTHORIZED_ACCESS) {
        return ctx.response.status(401).json({
          success: false,
          message: "Token d'authentification requis",
        })
      }

      return ctx.response.status(500).json({
        success: false,
        message: "Erreur d'authentification",
        error: error.message,
      })
    }
  }
}
