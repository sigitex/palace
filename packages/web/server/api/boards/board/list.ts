import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { Board } from "shared/models"
import { type } from "arktype"

export const list = operation(
  {
    loggedIn: true,
    input: type({ workspace: "string > 0" }),
    output: Board.array(),
  },
  async ({ workspace }, context: Context) =>
    context.boards.list(context.actor, workspace),
)

type Context = {
  actor: Actor
  boards: Boards
}
