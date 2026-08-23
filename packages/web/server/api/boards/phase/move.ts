import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Boards } from "$/services/Boards"
import { BoardPhase, ID } from "shared/models"
import { type } from "arktype"

export const move = operation(
  {
    checks: [requireLogin],
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      phase: ID,
      "before?": ID.or("null"),
      "after?": ID.or("null"),
    }),
    output: BoardPhase.array(),
  },
  async ({ workspace, board, phase, before, after }, context: Context) =>
    context.boards.movePhase(context.actor, workspace, board, phase, {
      before,
      after,
    }),
)

type Context = {
  actor: Actor
  boards: Boards
}
