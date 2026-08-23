import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Workspaces } from "$/services/Workspaces"
import { IdentityGroup } from "shared/models"
import { type } from "arktype"

export const groups = operation(
  {
    checks: [requireLogin],
    input: type({ workspace: "string > 0" }),
    output: IdentityGroup.array(),
  },
  async ({ workspace }, context: Context) =>
    context.workspaces.groups(context.actor, workspace),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
