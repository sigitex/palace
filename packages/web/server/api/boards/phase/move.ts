import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardPhase, ID } from "shared/models"
import { type } from "arktype"

export const move = operation(
  {
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      phase: ID,
      "before?": ID.or("null"),
      "after?": ID.or("null"),
    }),
    output: BoardPhase.array(),
  },
  async ({ workspace, board, phase, before, after }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.movePhase(actor, workspace, board, phase, {
        before,
        after,
      }),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
