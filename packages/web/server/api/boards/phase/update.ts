import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardColor, BoardIcon, BoardPhase, ID } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
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
    BoardsOperation.run(context, (actor) =>
      context.boards.updatePhase(actor, workspace, board, phase, metadata),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
