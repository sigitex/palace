import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardColor, BoardIcon, BoardPhase, ID } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    loggedIn: true,
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      phase: ID,
      title: "string > 0",
      color: BoardColor,
      icon: BoardIcon.or("null"),
    }),
    output: BoardPhase,
  },
  async ({ workspace, board, phase, ...metadata }, context: Context) =>
    context.boards.updatePhase(
      context.actor,
      workspace,
      board,
      phase,
      metadata,
    ),
)

type Context = {
  actor: Actor
  boards: Boards
}
