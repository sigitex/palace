import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardTask, ID } from "shared/models"
import { type } from "arktype"

export const get = operation(
  {
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      task: ID,
    }),
    output: BoardTask,
  },
  async ({ workspace, board, task }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.getTask(actor, workspace, board, task),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
