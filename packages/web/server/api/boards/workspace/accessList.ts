import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { WorkspaceAccess } from "shared/models"
import { type } from "arktype"

export const accessList = operation(
  {
    loggedIn: true,
    input: type({ workspace: "string > 0" }),
    output: WorkspaceAccess.array(),
  },
  async ({ workspace }, context: Context) =>
    context.workspaces.listAccess(context.actor, workspace),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
