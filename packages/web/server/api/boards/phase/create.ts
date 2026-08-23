import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardColor, BoardIcon, BoardPhase } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
    loggedIn: true,
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      title: "string > 0",
      color: BoardColor,
      icon: BoardIcon.or("null"),
    }),
    output: BoardPhase,
  },
  async ({ workspace, board, ...metadata }, context: Context) =>
    context.boards.createPhase(context.actor, workspace, board, metadata),
)

type Context = {
  actor: Actor
  boards: Boards
}
