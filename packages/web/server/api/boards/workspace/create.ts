import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { BoardColor, BoardIcon, ID, Workspace } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
    input: type({
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
      manager_group: ID,
    }),
    output: Workspace,
  },
  async ({ manager_group, ...metadata }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.create(actor, metadata, manager_group),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
