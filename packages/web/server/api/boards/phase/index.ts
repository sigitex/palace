import { create } from "./create"
import { deletePhase } from "./deletePhase"
import { move } from "./move"
import { update } from "./update"

export const phase = {
  create,
  update,
  move,
  delete: deletePhase,
} as const
