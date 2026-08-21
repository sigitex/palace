import type { TaskMove } from "@/Boards/Task/TaskMovement"
import { useBoards } from "@/state"

export type ListActions = ReturnType<typeof useListActions>

// The board mutation the list's drag and command layers share.
export function useListActions(ws: string, board: string) {
  const boards = useBoards()
  return {
    moveTask(
      task: number,
      destination: TaskMove["destination"],
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
  }
}
