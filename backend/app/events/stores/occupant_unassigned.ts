export interface OccupantUnassignedPayload {
  store: {
    id: string
    name: string
    code: string | null
  }
  actor: {
    id: string
    fullName: string
    actorType: string
    email: string | null
  }
  unassignedBy: {
    id: string
    username: string
    fullName: string
  }
}
