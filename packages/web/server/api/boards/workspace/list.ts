import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Workspaces } from "$/services/Workspaces"
import { Workspace } from "shared/models"
import { type } from "arktype"

export const list = operation(
  { input: type.null, output: Workspace.array() },
  async (_, context: Context) =>
    BoardsOperation.run(context, (actor) => context.workspaces.list(actor)),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  workspaces: Workspaces
}
