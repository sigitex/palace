import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Boards } from "$/services/Boards"
import { Board, BoardColor, BoardIcon } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
    checks: [requireLogin],
    input: type({
      workspace: "string > 0",
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
    }),
    output: Board,
  },
  async ({ workspace, ...metadata }, context: Context) =>
    context.boards.create(context.actor, workspace, metadata),
)

type Context = {
  actor: Actor
  boards: Boards
}
