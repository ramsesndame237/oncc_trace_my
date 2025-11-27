export const LOCATION_TYPES = ['region', 'department', 'district'] as const
export const LOCATION_STATUSES = ['active', 'inactive'] as const

export type LocationType = (typeof LOCATION_TYPES)[number]
export type LocationStatus = (typeof LOCATION_STATUSES)[number]
