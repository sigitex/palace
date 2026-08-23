import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Workspaces } from "$/services/Workspaces"
import { Workspace } from "shared/models"
import { type } from "arktype"

export const deleteWorkspace = operation(
  {
    checks: [requireLogin],
    input: type({ workspace: "string > 0" }),
    output: Workspace,
  },
  async ({ workspace }, context: Context) =>
    context.workspaces.delete(context.actor, workspace),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
