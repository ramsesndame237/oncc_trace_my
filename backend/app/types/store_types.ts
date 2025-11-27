export const STORE_TYPES = ['EXPORT', 'GROUPING', 'GROUPING_AND_MACHINING'] as const
export const STORE_STATUSES = ['active', 'inactive'] as const

export type StoreType = (typeof STORE_TYPES)[number]
export type StoreStatus = (typeof STORE_STATUSES)[number]
