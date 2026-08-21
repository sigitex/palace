import type { Lane } from "@/Boards/Phases/Lane"
import { PhaseLane } from "@/Boards/Phases/PhaseLane"
import type { PhaseLaneCommands } from "@/Boards/Phases/PhaseLaneCommands"
import classes from "@/Boards/Phases/Phases.module.css"
import scrollbarClasses from "@/common/Scrollbars.module.css"
import type { usePointerDrag } from "@/common/usePointerDrag"
import { useBoards, useBoardsView } from "@/state"
import type { BoardPhase } from "shared/models"

// The horizontal, auto-scrolling strip of phase lanes. Derives each lane's
// selection/edit/composer flags from the board view store.
export function PhaseStrip({
  lanes,
  phases,
  writable,
  editingTask,
  taskDragHandles,
  phaseDragHandles,
  commands,
}: PhaseStrip.Props) {
  const state = useBoardsView()
  const boards = useBoards()
  return (
    <div
      className={`${classes.phaseScroller} ${scrollbarClasses.scrollbar}`}
      aria-label="Phase lanes"
      data-drag-scroll
    >
      <div className={classes.phaseStrip}>
        {lanes.map((lane) => {
          const phaseID = lane.phase?.id
          return (
            <PhaseLane
              key={lane.key}
              lane={lane}
              phases={phases}
              writable={writable}
              selectedTask={
                lane.tasks.some(({ id }) => id === state.selectedTask)
                  ? state.selectedTask
                  : null
              }
              selectedNewTask={
                state.selectedNewTask === lane.key ? lane.key : null
              }
              editing={
                phaseID !== undefined &&
                state.activePhaseEditor === phaseID
              }
              editingTask={editingTask}
              taskComposerOpen={
                !lane.complete &&
                state.taskComposerVisible &&
                state.taskComposerPhase === (phaseID ?? null)
              }
              creatingTask={boards.creatingTask}
              movingTask={boards.pendingMove}
              phaseDragHandle={
                phaseID === undefined
                  ? undefined
                  : phaseDragHandles.get(phaseID)
              }
              taskDragHandles={taskDragHandles}
              commands={commands}
            />
          )
        })}
      </div>
    </div>
  )
}

export namespace PhaseStrip {
  export type Props = {
    lanes: Lane[]
    phases: BoardPhase[]
    writable: boolean
    editingTask: number | null
    taskDragHandles: ReadonlyMap<number, usePointerDrag.Handle>
    phaseDragHandles: ReadonlyMap<number, usePointerDrag.Handle>
    commands: PhaseLaneCommands
  }
}
