import { z } from 'zod'

/**
 * Schéma de validation pour les filtres de recherche des magasins
 */
export const storeFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

/**
 * Schéma de validation pour les paramètres de recherche d'URL
 */
export const storeSearchParamsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

/**
 * Schéma de base pour les magasins
 */
const baseStoreSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().optional(),
  storeType: z.enum(['EXPORT', 'GROUPING', 'GROUPING_AND_MACHINING'], {
    required_error: 'Le type de magasin est requis',
    invalid_type_error: 'Le type de magasin doit être une valeur valide'
  }),
  capacity: z.coerce.number().min(0).optional().or(z.literal('')),
  surfaceArea: z.coerce.number().min(0).optional().or(z.literal('')),
  locationCode: z.string().min(1, 'Le code de localisation est requis'),
})

/**
 * Schéma de validation pour créer un magasin
 */
export const createStoreSchema = baseStoreSchema

/**
 * Schéma de validation pour mettre à jour un magasin (avec ID)
 */
export const updateStoreSchema = z.object({
  id: z.string().min(1, 'L\'ID est requis'),
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  storeType: z.enum(['EXPORT', 'GROUPING', 'GROUPING_AND_MACHINING']).optional(),
  capacity: z.coerce.number().min(0).optional().or(z.literal('')),
  surfaceArea: z.coerce.number().min(0).optional().or(z.literal('')),
  locationCode: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

/**
 * Schéma de validation pour le formulaire d'édition (sans ID)
 */
export const editStoreFormSchema = baseStoreSchema.partial()

/**
 * Types TypeScript dérivés des schémas
 */
export type StoreFiltersFormData = z.infer<typeof storeFiltersSchema>
export type StoreSearchParamsFormData = z.infer<typeof storeSearchParamsSchema>
export type CreateStoreFormData = z.infer<typeof createStoreSchema>
export type UpdateStoreFormData = z.infer<typeof updateStoreSchema>
export type EditStoreFormData = z.infer<typeof editStoreFormSchema>