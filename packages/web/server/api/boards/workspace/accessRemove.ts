import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { ID, WorkspaceAccess } from "shared/models"
import { type } from "arktype"

export const accessRemove = operation(
  {
    input: type({ workspace: "string > 0", group: ID }),
    output: WorkspaceAccess.array(),
  },
  async ({ workspace, group }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.removeAccess(actor, workspace, group),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
