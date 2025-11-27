import type Parcel from '#models/parcel'
import { DateTime } from 'luxon'

// Statuts d'acteur disponibles
export const PARCEL_STATUSES = ['active', 'inactive'] as const

// Types de parcelle disponibles
export const PARCEL_TYPES = ['national', 'public', 'state_private', 'individual_private'] as const

export type ParcelType = (typeof PARCEL_TYPES)[number]
export type ParcelStatus = (typeof PARCEL_STATUSES)[number]

export interface CoordinateData {
  id?: string // Optionnel pour la création, obligatoire pour la mise à jour
  latitude: number
  longitude: number
  pointOrder: number
}

export interface CreateParcelData {
  producerId: string
  locationCode: string
  surfaceArea?: number
  parcelCreationDate?: DateTime
  parcelType: ParcelType
  identificationId?: string
  onccId?: string
  status?: ParcelStatus
  coordinates?: CoordinateData[]
}

export interface UpdateParcelData {
  locationCode?: string
  surfaceArea?: number
  parcelCreationDate?: DateTime
  parcelType?: ParcelType
  identificationId?: string | null
  onccId?: string | null
  status?: ParcelStatus
  coordinates?: CoordinateData[]
}

export interface ParcelFilterOptions {
  page?: number
  limit?: number
  producerId?: string
  locationCode?: string
  parcelType?: ParcelType
  status?: ParcelStatus
  search?: string
}

export interface CreateCoordinateData {
  parcelId: string
  latitude: number
  longitude: number
  pointOrder: number
}

export interface UpdateCoordinateData {
  latitude?: number
  longitude?: number
  pointOrder?: number
}

export interface BulkCreateParcelData {
  parcels: CreateParcelData[]
}

export interface BulkCreateResult {
  success: Parcel[]
  errors: Array<{
    index: number
    parcel: CreateParcelData
    error: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

export interface ParcelWithCoordinates {
  id: string
  producerId: string
  locationCode: string
  surfaceArea?: number
  parcelCreationDate?: Date
  parcelType: ParcelType
  identificationId?: string
  onccId?: string
  coordinates: CoordinateData[]
  createdAt: Date
  updatedAt: Date
}
