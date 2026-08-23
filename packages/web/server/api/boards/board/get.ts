import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Boards } from "$/services/Boards"
import { BoardAggregate } from "shared/models"
import { type } from "arktype"

export const get = operation(
  {
    checks: [requireLogin],
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
