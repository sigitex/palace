import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Workspaces } from "$/services/Workspaces"
import { ID, WorkspaceAccess, WorkspaceAccessLevel } from "shared/models"
import { type } from "arktype"

export const accessSet = operation(
  {
    checks: [requireLogin],
    input: type({
      workspace: "string > 0",
      group: ID,
      level: WorkspaceAccessLevel,
    }),
    output: WorkspaceAccess.array(),
  },
  async ({ workspace, group, level }, context: Context) =>
    context.workspaces.setAccess(context.actor, workspace, group, level),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
