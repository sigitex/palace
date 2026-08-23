import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardAggregate } from "shared/models"
import { type } from "arktype"

export const get = operation(
  {
    loggedIn: true,
    input: type({ workspace: "string > 0", board: "string > 0" }),
    output: BoardAggregate,
  },
  async ({ workspace, board }, context: Context) =>
    context.boards.get(context.actor, workspace, board),
)

type Context = {
  actor: Actor
  boards: Boards
}
