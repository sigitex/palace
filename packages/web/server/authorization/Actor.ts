export type Actor = {
  user: number
  groups: readonly string[]
}

export namespace Actor {
  export const PALACE_ADMINS = "palace-admins"

  export function isPalaceAdmin(actor: Actor) {
    return actor.groups.includes(PALACE_ADMINS)
  }
}
