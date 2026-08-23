import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardTask, ID } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    loggedIn: true,
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
    context.boards.updateTask(context.actor, workspace, board, task, changes),
)

type Context = {
  actor: Actor
  boards: Boards
}
