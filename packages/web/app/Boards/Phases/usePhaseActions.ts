import { useBoards } from "@/state"
import type { TaskComposerInput } from "@/Boards/Task/TaskComposer"
import type { TaskMenuDestination } from "@/Boards/Task/TaskMenu"

export type PhaseActions = ReturnType<typeof usePhaseActions>

// The board mutations the phase behaviors share. Kept in one place so the
// drag, keyboard, and command layers issue moves and creates identically.
export function usePhaseActions(ws: string, board: string) {
  const boards = useBoards()
  return {
    moveTask(
      task: number,
      destination: TaskMenuDestination,
      anchors: {
        before?: number | null
        after?: number | null
      } = {},
    ) {
      return boards.moveTask({
        workspace: ws,
        board,
        task,
        destination,
        ...anchors,
      })
    },
    createTask(input: TaskComposerInput) {
      return boards.createTask(ws, board, input)
    },
  }
}
