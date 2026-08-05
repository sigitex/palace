import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { Board } from "shared/models"
import { type } from "arktype"

export const deleteBoard = operation(
  {
    input: type({ workspace: "string > 0", board: "string > 0" }),
    output: Board,
  },
  async ({ workspace, board }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.delete(actor, workspace, board),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
