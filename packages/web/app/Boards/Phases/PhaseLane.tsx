import type { Lane } from "@/Boards/Phases/Lane"
import type { PhaseLaneCommands } from "@/Boards/Phases/PhaseLaneCommands"
import { PhaseLaneHeader } from "@/Boards/Phases/PhaseLaneHeader"
import { PhaseLaneTasks } from "@/Boards/Phases/PhaseLaneTasks"
import { InlinePhaseEditor } from "@/Boards/Phases/InlinePhaseEditor"
import classes from "@/Boards/Phases/Phases.module.css"
import type { usePointerDrag } from "@/common/usePointerDrag"
import { Paper } from "@mantine/core"
import { memo } from "react"
import type { BoardPhase } from "shared/models"

export type PhaseLaneProps = {
  lane: Lane
  phases: BoardPhase[]
  writable: boolean
  selectedTask: number | null
  selectedNewTask: string | null
  editing: boolean
  editingTask: number | null
  taskComposerOpen: boolean
  creatingTask: boolean
  movingTask: number | null
  phaseDragHandle?: usePointerDrag.Handle
  taskDragHandles: ReadonlyMap<number, usePointerDrag.Handle>
  commands: PhaseLaneCommands
}

export const PhaseLane = memo(
  ({
    lane,
    phases,
    writable,
    selectedTask,
    selectedNewTask,
    editing,
    editingTask,
    taskComposerOpen,
    creatingTask,
    movingTask,
    phaseDragHandle,
    taskDragHandles,
    commands,
  }: PhaseLaneProps) => {
    const laneStyle = {
      "--lane-color": lane.phase
        ? `var(--mantine-color-${lane.phase.color}-6)`
        : "var(--mantine-color-gray-5)",
      "--lane-background": lane.phase
        ? `var(--mantine-color-${lane.phase.color}-light)`
        : "var(--mantine-color-gray-light)",
    } as React.CSSProperties

    return (
      <Paper
        className={classes.phaseLane}
        aria-label={`${lane.title} lane`}
        data-lane-key={lane.key}
        data-phase-id={lane.phase?.id}
        data-drag-source={lane.phase ? true : undefined}
        data-drag-label={lane.phase ? lane.title : undefined}
        style={laneStyle}
        withBorder
        p="sm"
      >
        {editing && lane.phase ? (
          <InlinePhaseEditor
            phase={lane.phase}
            onCancel={() => commands.editPhase(null)}
            onSave={(metadata) =>
              commands.savePhase(lane.phase!.id, metadata)
            }
            onDelete={() => commands.deletePhase(lane.phase!.id)}
          />
        ) : (
          <PhaseLaneHeader
            lane={lane}
            writable={writable}
            phaseDragHandle={phaseDragHandle}
            commands={commands}
          />
        )}
        {!editing && (
          <PhaseLaneTasks
            lane={lane}
            phases={phases}
            writable={writable}
            selectedTask={selectedTask}
            selectedNewTask={selectedNewTask}
            editingTask={editingTask}
            taskComposerOpen={taskComposerOpen}
            creatingTask={creatingTask}
            movingTask={movingTask}
            taskDragHandles={taskDragHandles}
            commands={commands}
          />
        )}
      </Paper>
    )
  },
)
