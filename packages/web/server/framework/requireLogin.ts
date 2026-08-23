import type { Actor } from "$/authorization/Actor"
import { Unauthorized } from "@sigitex/route"

export function requireLogin({ actor }: { actor?: Actor | null }) {
  if (!actor) {
    throw new Unauthorized()
  }
}
