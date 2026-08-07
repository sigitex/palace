import { usePointerDrag } from "@/common/usePointerDrag"
import classes from "@/Boards/Phases/Phases.module.css"
import { Lane } from "@/Boards/Phases/Lane"
import type { PhaseActions } from "@/Boards/Phases/usePhaseActions"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { useBoards } from "@/state"
import { useMemo } from "react"
import type { BoardPhase, BoardTask } from "shared/models"

type DragSource =
  | { kind: "task"; id: number }
  | { kind: "phase"; id: number }

type DragTarget =
  | {
      kind: "task"
      lane: string
      task: number | null
      after: boolean
    }
  | { kind: "phase"; phase: number; after: boolean }

// Pointer drag-and-drop for phase lanes: reorder phases, and move tasks
// within/across lanes. Returns the per-id drag handles for lanes and tasks.
export function usePhaseDrag(deps: {
  ws: string
  board: string
  lanes: Lane[]
  phases: BoardPhase[]
  tasks: BoardTask[]
  moveTask: PhaseActions["moveTask"]
}) {
  const { ws, board, lanes, phases, tasks, moveTask } = deps
  const boards = useBoards()
  const drag = usePointerDrag<DragSource, DragTarget>({
    resolveTarget(element, source, point) {
      if (source.kind === "phase") {
        const target =
          element?.closest<HTMLElement>("[data-phase-id]")
        if (!target) return null
        const bounds = target.getBoundingClientRect()
        const after = point.x > bounds.left + bounds.width / 2
        return {
          value: {
            kind: "phase",
            phase: Number(target.dataset.phaseId),
            after,
          },
          indicators: [
            {
              element: target,
              className: after
                ? classes.phaseTargetAfter
                : classes.phaseTargetBefore,
            },
          ],
        }
      }
      const lane = element?.closest<HTMLElement>("[data-lane-key]")
      if (!lane) return null
      const task = element?.closest<HTMLElement>("[data-task-id]")
      if (!task) {
        return {
          value: {
            kind: "task",
            lane: lane.dataset.laneKey!,
            task: null,
            after: true,
          },
          indicators: [
            { element: lane, className: classes.laneTarget },
          ],
        }
      }
      const bounds = task.getBoundingClientRect()
      const after = point.y > bounds.top + bounds.height / 2
      return {
        value: {
          kind: "task",
          lane: lane.dataset.laneKey!,
          task: Number(task.dataset.taskId),
          after,
        },
        indicators: [
          { element: lane, className: classes.laneTarget },
          {
            element: task,
            className: after
              ? classes.dropTargetAfter
              : classes.dropTargetBefore,
          },
        ],
      }
    },
    onDrop(source, target) {
      if (source.kind === "phase" && target.kind === "phase") {
        return boards.movePhaseTo(
          ws,
          board,
          source.id,
          target.phase,
          target.after,
        )
      }
      if (source.kind !== "task" || target.kind !== "task") return
      const lane = lanes.find(({ key }) => key === target.lane)
      if (!lane) return
      const index =
        target.task === null
          ? lane.tasks.length
          : lane.tasks.findIndex(({ id }) => id === target.task) +
            (target.after ? 1 : 0)
      return moveTask(
        source.id,
        Lane.destination(lane),
        TaskMovement.anchors(
          lane.tasks,
          source.id,
          Math.max(0, index),
        ),
      )
    },
    sourceClassName: classes.dragSourceActive,
    autoScroll: { axis: "x", zoneSize: 100 },
  })
  // Keyed on id lists, not array identity, so task/phase field edits don't
  // rebuild every handle and break TaskCard/PhaseLane memoization.
  const taskIdKey = tasks.map(({ id }) => id).join(",")
  const phaseIdKey = phases.map(({ id }) => id).join(",")
  const taskDragHandles = useMemo(
    () =>
      new Map(
        tasks.map(({ id }) => [
          id,
          drag.handle({ kind: "task", id }),
        ]),
      ),
    [drag.handle, taskIdKey],
  )
  const phaseDragHandles = useMemo(
    () =>
      new Map(
        phases.map(({ id }) => [
          id,
          drag.handle({ kind: "phase", id }),
        ]),
      ),
    [drag.handle, phaseIdKey],
  )
  return { taskDragHandles, phaseDragHandles }
}
