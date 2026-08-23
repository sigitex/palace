import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import { requireLogin } from "$/framework/requireLogin"
import type { Workspaces } from "$/services/Workspaces"
import { BoardColor, BoardIcon, ID, Workspace } from "shared/models"
import { type } from "arktype"

export const create = operation(
  {
    checks: [requireLogin],
    input: type({
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
      manager_group: ID,
    }),
    output: Workspace,
  },
  async ({ manager_group, ...metadata }, context: Context) =>
    context.workspaces.create(context.actor, metadata, manager_group),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
