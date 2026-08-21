import type { TaskRowCommands } from "@/Boards/List/TaskRow"
import type { ListActions } from "@/Boards/List/useListActions"
import { useBoards, useBoardsView } from "@/state"
import { useRef } from "react"

// The command set handed to every TaskRow. Built once and kept stable so rows
// memoize; onOpen is read through a ref so the stable command always calls the
// latest handler.
export function useListCommands(deps: {
  ws: string
  board: string
  onOpen: (taskID: number) => void
  setEditing: (taskID: number | null) => void
  moveTask: ListActions["moveTask"]
}): TaskRowCommands {
  const { ws, board, onOpen, setEditing, moveTask } = deps
  const state = useBoardsView()
  const boards = useBoards()
  const latest = useRef({ onOpen })
  latest.current.onOpen = onOpen
  const commandRef = useRef<TaskRowCommands | null>(null)
  return (commandRef.current ??= {
    select: (taskID) => state.selectTask(taskID),
    open: (taskID) => latest.current.onOpen(taskID),
    cancelEdit: () => setEditing(null),
    async saveTitle(taskID, title) {
      await boards.updateTask(ws, board, taskID, { title })
      setEditing(null)
    },
    setState: (taskID, taskState) =>
      boards.updateTask(ws, board, taskID, taskState),
    setComplete: (taskID, complete) =>
      boards.updateTask(ws, board, taskID, { complete }),
    move: (taskID, destination) => moveTask(taskID, destination),
    step: (taskID, direction) =>
      boards.stepTask(ws, board, taskID, direction),
    delete: (taskID) => boards.deleteTask(ws, board, taskID),
  })
}
