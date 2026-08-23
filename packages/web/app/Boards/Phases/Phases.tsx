import { Lane } from "@/Boards/Phases/Lane"
import { LaneControls } from "@/Boards/Phases/LaneControls"
import { PhaseComposer } from "@/Boards/Phases/PhaseComposer"
import { PhaseStrip } from "@/Boards/Phases/PhaseStrip"
import classes from "@/Boards/Phases/Phases.module.css"
import { usePhaseActions } from "@/Boards/Phases/usePhaseActions"
import { usePhaseCommands } from "@/Boards/Phases/usePhaseCommands"
import { usePhaseDrag } from "@/Boards/Phases/usePhaseDrag"
import { usePhaseKeyboard } from "@/Boards/Phases/usePhaseKeyboard"
import { useBoards, useBoardsView } from "@/state"
import { Stack } from "@mantine/core"
import { useMemo, useState } from "react"
import type { BoardAggregate } from "shared/models"

type Props = {
  aggregate: BoardAggregate
  onOpen: (taskID: number) => void
}

export default function Phases({ aggregate, onOpen }: Props) {
  const { workspace, board, phases, tasks } = aggregate
  const state = useBoardsView()
  const boards = useBoards()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const ws = workspace.slug
  const boardSlug = board.slug
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const lanes = useMemo(
    () => Lane.build(phases, tasks),
    [phases, tasks],
  )

  const { moveTask, createTask } = usePhaseActions(ws, boardSlug)
  const { taskDragHandles, phaseDragHandles } = usePhaseDrag({
    ws,
    board: boardSlug,
    lanes,
    phases,
    tasks,
    moveTask,
  })
  const commands = usePhaseCommands({
    ws,
    board: boardSlug,
    lanes,
    onOpen,
    setEditingTask,
    moveTask,
    createTask,
  })
  usePhaseKeyboard({
    ws,
    board: boardSlug,
    lanes,
    writable,
    editingTask,
    setEditingTask,
    onOpen,
    moveTask,
  })

  const shownLanes = Lane.visible(lanes, {
    incomplete: state.incompleteLaneVisible,
    complete: state.completeLaneVisible,
  })

  return (
    <Stack gap="md" className={classes.phasesView}>
      <LaneControls writable={writable} />
      {state.phaseComposerVisible && (
        <PhaseComposer
          creating={boards.creatingPhase}
          onCreate={(input) => boards.createPhase(ws, boardSlug, input)}
          onCreated={() => state.setPhaseComposerVisible(false)}
          onCancel={() => state.setPhaseComposerVisible(false)}
        />
      )}
      <PhaseStrip
        lanes={shownLanes}
        phases={phases}
        writable={writable}
        editingTask={editingTask}
        taskDragHandles={taskDragHandles}
        phaseDragHandles={phaseDragHandles}
        commands={commands}
      />
    </Stack>
  )
}
