import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Workspaces } from "$/services/Workspaces"
import { Workspace } from "shared/models"
import { type } from "arktype"

export const list = operation(
  { checks: [requireLogin], input: type.null, output: Workspace.array() },
  async (_, context: Context) => context.workspaces.list(context.actor),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
