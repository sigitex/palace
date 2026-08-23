import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { ID, WorkspaceAccess } from "shared/models"
import { type } from "arktype"

export const accessRemove = operation(
  {
    loggedIn: true,
    input: type({ workspace: "string > 0", group: ID }),
    output: WorkspaceAccess.array(),
  },
  async ({ workspace, group }, context: Context) =>
    context.workspaces.removeAccess(context.actor, workspace, group),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
