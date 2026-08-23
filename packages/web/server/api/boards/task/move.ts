import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardAggregate, ID } from "shared/models"
import { type } from "arktype"

export const move = operation(
  {
    loggedIn: true,
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      task: ID,
      destination: type({ type: "'board'" })
        .or({ type: "'phase'", phase: ID.or("null") })
        .or({ type: "'complete'" }),
      "before?": ID.or("null"),
      "after?": ID.or("null"),
    }),
    output: BoardAggregate,
  },
  async (
    { workspace, board, task, destination, before, after },
    context: Context,
  ) =>
    context.boards.moveTask(
      context.actor,
      workspace,
      board,
      task,
      destination,
      {
        before,
        after,
      },
    ),
)

type Context = {
  actor: Actor
  boards: Boards
}
