import type { Actor } from "$/authorization/Actor"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { BoardColor, BoardIcon, Workspace } from "shared/models"
import { type } from "arktype"

export const update = operation(
  {
    loggedIn: true,
    input: type({
      workspace: "string > 0",
      name: "string > 0",
      slug: "string > 0",
      color: BoardColor.or("null"),
      icon: BoardIcon.or("null"),
    }),
    output: Workspace,
  },
  async ({ workspace, ...metadata }, context: Context) =>
    context.workspaces.update(context.actor, workspace, metadata),
)

type Context = {
  actor: Actor
  workspaces: Workspaces
}
