import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { BoardColor, BoardIcon, Workspace } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    input: type({
      workspace: "string > 0",
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
    }),
    output: Workspace,
  },
  async ({ workspace, ...metadata }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.update(actor, workspace, metadata),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
