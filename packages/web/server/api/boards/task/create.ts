import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardTask, ID } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      title: "string > 0",
      "details?": "string",
      "phase?": ID.or("null"),
    }),
    output: BoardTask,
  },
  async ({ workspace, board, ...input }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.createTask(actor, workspace, board, input),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
