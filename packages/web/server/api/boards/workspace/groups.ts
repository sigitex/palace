import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { IdentityGroup } from "shared/models"
import { type } from "arktype"

export const groups = operation(
  {
    input: type({ workspace: "string > 0" }),
    output: IdentityGroup.array(),
  },
  async ({ workspace }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.workspaces.groups(actor, workspace),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
