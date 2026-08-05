import { BoardsOperation } from "$/api/boards/BoardsOperation"
import { operation } from "$/framework/operation"
import type { Boards } from "$/services/Boards"
import { BoardPhase, ID } from "shared/models"
import { type } from "arktype"

export const deletePhase = operation(
  {
    input: type({
      workspace: "string > 0",
      board: "string > 0",
      phase: ID,
    }),
    output: BoardPhase,
  },
  async ({ workspace, board, phase }, context: Context) =>
    BoardsOperation.run(context, (actor) =>
      context.boards.deletePhase(actor, workspace, board, phase),
    ),
)

type Context = {
  user?: { id: number } | null
  groups?: readonly string[] | null
  boards: Boards
}
