import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { Board } from "shared/models"
import { type } from "arktype"

export const list = operation(
  {
    input: type({ workspace: "string > 0" }),
    output: Board.array(),
  },
  async ({ workspace }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.list(actor, workspace),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
