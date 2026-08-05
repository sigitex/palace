import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { ID, WorkspaceAccess, WorkspaceAccessLevel } from "shared/models"
import { type } from "arktype"

export const accessSet = operation(
  {
    input: type({
      workspace: "string > 0",
      group: ID,
      level: WorkspaceAccessLevel,
    }),
    output: WorkspaceAccess.array(),
  },
  async ({ workspace, group, level }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.setAccess(actor, workspace, group, level),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
