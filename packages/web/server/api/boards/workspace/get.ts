import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { Workspace } from "shared/models"
import { type } from "arktype"

export const get = operation(
  {
    input: type({ workspace: "string > 0" }),
    output: Workspace,
  },
  async ({ workspace }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.get(actor, workspace),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
