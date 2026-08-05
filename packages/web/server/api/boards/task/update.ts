import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardTask, ID } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      task: ID,
      "title?": "string > 0",
      "details?": "string",
      "complete?": "boolean",
      "phase?": ID.or("null"),
    }),
    output: BoardTask,
  },
  async ({ workspace, board, task, ...changes }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.updateTask(actor, workspace, board, task, changes),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
