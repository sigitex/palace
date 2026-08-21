import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardAggregate } from "shared/models"
import { type } from "arktype"

export const get = operation(
  {
    input: type({ workspace: "string > 0", board: "string > 0" }),
    output: BoardAggregate,
  },
  async ({ workspace, board }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.get(actor, workspace, board),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
