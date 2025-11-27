export interface StoreDeactivatedPayload {
  store: {
    id: string
    name: string
    code: string | null
    storeType: string | null
  }
  campaign: {
    id: string
    code: string
    startDate: string
    endDate: string
  }
  deactivatedBy: {
    id: string
    username: string
    fullName: string
  }
}
