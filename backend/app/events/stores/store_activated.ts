export interface StoreActivatedPayload {
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
  activatedBy: {
    id: string
    username: string
    fullName: string
  }
}
