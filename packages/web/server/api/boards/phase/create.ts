import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardColor, BoardIcon, BoardPhase } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
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
    BoardsOperation.run(context, (actor) =>
      context.boards.createPhase(actor, workspace, board, metadata),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
