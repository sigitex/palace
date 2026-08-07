import { Lane } from "@/Boards/Phases/Lane"
import type { PhaseLaneCommands } from "@/Boards/Phases/PhaseLaneCommands"
import type { PhaseActions } from "@/Boards/Phases/usePhaseActions"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { useBoards, useBoardsView } from "@/state"
import { useRef } from "react"

// The command set handed to every PhaseLane/TaskCard. Built once and kept
// stable so lanes and cards memoize; because a stable command can't read fresh
// render state through a captured useProxy wrapper, it reads live lanes and
// onOpen through a ref updated each render.
export function usePhaseCommands(deps: {
  ws: string
  board: string
  lanes: Lane[]
  onOpen: (taskID: number) => void
  setEditingTask: (taskID: number | null) => void
  moveTask: PhaseActions["moveTask"]
  createTask: PhaseActions["createTask"]
}): PhaseLaneCommands {
  const { ws, board, lanes, onOpen, setEditingTask, moveTask, createTask } =
    deps
  const state = useBoardsView()
  const boards = useBoards()
  const latest = useRef({ onOpen, lanes })
  latest.current.onOpen = onOpen
  latest.current.lanes = lanes
  const commandRef = useRef<PhaseLaneCommands | null>(null)
  return (commandRef.current ??= {
    select: (taskID) => state.selectTask(taskID),
    open: (taskID) => latest.current.onOpen(taskID),
    move: (taskID, destination) => moveTask(taskID, destination),
    step(taskID, laneKey, direction) {
      const lane = latest.current.lanes.find(
        ({ key }) => key === laneKey,
      )
      if (!lane) return
      const index = lane.tasks.findIndex(({ id }) => id === taskID)
      moveTask(
        taskID,
        Lane.destination(lane),
        TaskMovement.anchors(lane.tasks, taskID, index + direction),
      )
    },
    delete: (taskID) => boards.deleteTask(ws, board, taskID),
    async saveTitle(taskID, title) {
      await boards.updateTask(ws, board, taskID, { title })
      setEditingTask(null)
    },
    cancelEdit: () => setEditingTask(null),
    editPhase: (phaseID) => state.setActivePhaseEditor(phaseID),
    movePhase: (phaseID, direction) =>
      boards.movePhaseStep(ws, board, phaseID, direction),
    openTaskComposer: (phase) => state.openTaskComposer(phase),
    closeTaskComposer: () => state.closeTaskComposer(),
    createTask,
    async savePhase(phaseID, metadata) {
      await boards.updatePhase(ws, board, phaseID, metadata)
      state.setActivePhaseEditor(null)
    },
    async deletePhase(phaseID) {
      await boards.deletePhase(ws, board, phaseID)
      state.setActivePhaseEditor(null)
    },
  })
}
