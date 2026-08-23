import type { TaskCardCommands } from "@/Boards/Phases/TaskCard"
import type { TaskComposerInput } from "@/Boards/Task/TaskComposer"
import type {
  BoardColor,
  BoardIcon as BoardIconKey,
  BoardTask,
} from "shared/models"

export type PhaseLaneCommands = TaskCardCommands & {
  editPhase: (phaseID: number | null) => void
  movePhase: (phaseID: number, direction: -1 | 1) => void
  openTaskComposer: (phase: number | null) => void
  closeTaskComposer: () => void
  createTask: (input: TaskComposerInput) => Promise<BoardTask>
  savePhase: (
    phaseID: number,
    metadata: {
      title: string
      color: BoardColor
      icon: BoardIconKey | null
    },
  ) => Promise<unknown>
  deletePhase: (phaseID: number) => Promise<unknown>
}
