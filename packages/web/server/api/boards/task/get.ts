import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardTask, ID } from "shared/models"
import { type } from "arktype"

export const get = operation(
  {
    loggedIn: true,
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      task: ID,
    }),
    output: BoardTask,
  },
  async ({ workspace, board, task }, context: Context) =>
    context.boards.getTask(context.actor, workspace, board, task),
)

type Context = {
  actor: Actor
  boards: Boards
}
