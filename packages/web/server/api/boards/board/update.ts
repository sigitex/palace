import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Boards } from "$/services/Boards"
import { Board, BoardColor, BoardIcon } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    checks: [requireLogin],
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
    }),
    output: Board,
  },
  async ({ workspace, board, ...metadata }, context: Context) =>
    context.boards.update(context.actor, workspace, board, metadata),
)

type Context = {
  actor: Actor
  boards: Boards
}
