import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Boards } from "$/services/Boards"
import { BoardTask, ID } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
    checks: [requireLogin],
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
    context.boards.createTask(context.actor, workspace, board, input),
)

type Context = {
  actor: Actor
  boards: Boards
}
