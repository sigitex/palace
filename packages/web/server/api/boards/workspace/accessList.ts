import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { WorkspaceAccess } from "shared/models"
import { type } from "arktype"

export const accessList = operation(
  {
    input: type({ workspace: "string > 0" }),
    output: WorkspaceAccess.array(),
  },
  async ({ workspace }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.listAccess(actor, workspace),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
