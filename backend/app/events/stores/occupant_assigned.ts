export interface OccupantAssignedPayload {
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
  assignedBy: {
    id: string
    username: string
    fullName: string
  }
}
