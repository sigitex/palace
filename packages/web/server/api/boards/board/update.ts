import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { Board, BoardColor, BoardIcon } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
    }),
    output: Board,
  },
  async ({ workspace, board, ...metadata }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.update(actor, workspace, board, metadata),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
