import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardPhase, ID } from "shared/models"
import { type } from "arktype"

export const deletePhase = operation(
  {
    loggedIn: true,
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      phase: ID,
    }),
    output: BoardPhase,
  },
  async ({ workspace, board, phase }, context: Context) =>
    context.boards.deletePhase(context.actor, workspace, board, phase),
)

type Context = {
  actor: Actor
  boards: Boards
}
