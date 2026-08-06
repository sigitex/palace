// oxlint-disable eslint/complexity
import { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import { PhaseComposer } from "@/Boards/Phases/PhaseComposer"
import {
  PhaseLane,
  type Lane,
  type PhaseLaneCommands,
} from "@/Boards/Phases/PhaseLane"
import classes from "@/Boards/Phases/PhasesView.module.css"
import scrollbarClasses from "@/Boards/Shared/Scrollbars.module.css"
import { useBoards, useBoardsView } from "@/state"
import type { TaskComposer } from "@/Boards/Task/TaskComposer"
import type { TaskMenu } from "@/Boards/Task/TaskMenu"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { useKeyboardShortcuts } from "@/common/useKeyboardShortcuts"
import { Button, Stack } from "@mantine/core"
import { useMemo, useRef, useState } from "react"
import { Icon } from "@/common/Icon"
import type { BoardAggregate, BoardTask } from "shared/models"

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

export function PhasesView({ aggregate, onOpen }: PhasesView.Props) {
  const { workspace, board, phases, tasks } = aggregate
  const state = useBoardsView()
  const boards = useBoards()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const ws = workspace.slug
  const boardSlug = board.slug
  const latest = useRef({ onOpen, lanes: [] as Lane[] })
  latest.current.onOpen = onOpen
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const lanes = useMemo(
    () => makeLanes(phases, tasks),
    [phases, tasks],
  )
  // Stable commands (built once) can't read fresh render state or the live
  // store through a captured useProxy wrapper — hand them the current lanes.
  latest.current.lanes = lanes
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
          boardSlug,
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
        laneDestination(lane),
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
  const commandRef = useRef<PhaseLaneCommands | null>(null)
  const commands = (commandRef.current ??= {
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
        laneDestination(lane),
        TaskMovement.anchors(lane.tasks, taskID, index + direction),
      )
    },
    delete: (taskID) => boards.deleteTask(ws, boardSlug, taskID),
    async saveTitle(taskID, title) {
      await boards.updateTask(ws, boardSlug, taskID, { title })
      setEditingTask(null)
    },
    cancelEdit: () => setEditingTask(null),
    editPhase: (phaseID) => state.setActivePhaseEditor(phaseID),
    movePhase: (phaseID, direction) =>
      boards.movePhaseStep(ws, boardSlug, phaseID, direction),
    openTaskComposer: (phase) => state.openTaskComposer(phase),
    closeTaskComposer: () => state.closeTaskComposer(),
    createTask,
    async savePhase(phaseID, metadata) {
      await boards.updatePhase(ws, boardSlug, phaseID, metadata)
      state.setActivePhaseEditor(null)
    },
    async deletePhase(phaseID) {
      await boards.deletePhase(ws, boardSlug, phaseID)
      state.setActivePhaseEditor(null)
    },
  })

  useKeyboardShortcuts([
    {
      key: "n",
      enabled: writable && !state.taskComposerVisible,
      action: () => state.openTaskComposer(),
    },
    {
      key: "ArrowUp",
      enabled:
        state.selectedTask !== null || state.selectedNewTask !== null,
      action: () => selectVertical(-1),
    },
    {
      key: "ArrowDown",
      enabled:
        state.selectedTask !== null || state.selectedNewTask !== null,
      action: () => selectVertical(1),
    },
    {
      key: "ArrowLeft",
      enabled:
        state.selectedTask !== null || state.selectedNewTask !== null,
      action: () => selectHorizontal(-1),
    },
    {
      key: "ArrowRight",
      enabled:
        state.selectedTask !== null || state.selectedNewTask !== null,
      action: () => selectHorizontal(1),
    },
    {
      key: "Enter",
      enabled:
        state.selectedTask !== null || state.selectedNewTask !== null,
      action: () => {
        if (state.selectedTask !== null) {
          onOpen(state.selectedTask)
        } else if (state.selectedNewTask !== null) {
          const lane = visibleLanes().find(
            ({ key }) => key === state.selectedNewTask,
          )
          if (lane) {
            state.openTaskComposer(lane.phase?.id ?? null)
          }
        }
      },
    },
    {
      key: "x",
      enabled: writable && state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null &&
        boards.completeTask(ws, boardSlug, state.selectedTask),
    },
    {
      key: "F2",
      enabled:
        writable &&
        state.selectedTask !== null &&
        editingTask === null,
      action: () => setEditingTask(state.selectedTask),
    },
    {
      key: "Delete",
      enabled: writable && state.selectedTask !== null,
      action: () =>
        document
          .querySelector<HTMLElement>(
            `[data-task-id="${state.selectedTask}"] [aria-label^="Delete "]`,
          )
          ?.click(),
    },
    {
      key: "ArrowUp",
      control: true,
      enabled: writable && state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null &&
        moveSelected(state.selectedTask, "up"),
    },
    {
      key: "ArrowDown",
      control: true,
      enabled: writable && state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null &&
        moveSelected(state.selectedTask, "down"),
    },
    {
      key: "ArrowLeft",
      control: true,
      enabled: writable && state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null &&
        moveSelected(state.selectedTask, "left"),
    },
    {
      key: "ArrowRight",
      control: true,
      enabled: writable && state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null &&
        moveSelected(state.selectedTask, "right"),
    },
  ])

  function visibleLanes() {
    return lanes.filter(
      ({ key }) =>
        (key !== "incomplete" || state.incompleteLaneVisible) &&
        (key !== "complete" || state.completeLaneVisible),
    )
  }

  function selectedPosition() {
    const visible = visibleLanes()
    const entryLane = state.selectedNewTask
      ? visible.findIndex(({ key }) => key === state.selectedNewTask)
      : -1
    if (entryLane >= 0) {
      return {
        lanes: visible,
        lane: entryLane,
        entry: true as const,
        task: -1,
      }
    }
    const lane = visible.findIndex(({ tasks: laneTasks }) =>
      laneTasks.some(({ id }) => id === state.selectedTask),
    )
    return {
      lanes: visible,
      lane,
      task:
        visible[lane]?.tasks.findIndex(
          ({ id }) => id === state.selectedTask,
        ) ?? -1,
      entry: false as const,
    }
  }

  function selectVertical(direction: -1 | 1) {
    const current = selectedPosition()
    if (current.entry) {
      if (direction === -1) {
        const lane = current.lanes[current.lane]
        const task = lane?.tasks[lane.tasks.length - 1]
        if (task) focusTask(task)
      }
      return
    }
    const lane = current.lanes[current.lane]
    const task = lane?.tasks[current.task + direction]
    if (task) {
      focusTask(task)
    } else if (direction === 1 && lane && !lane.complete) {
      focusNewTask(lane.key)
    }
  }

  function selectHorizontal(direction: -1 | 1) {
    const current = selectedPosition()
    const start = current.lane
    for (
      let index = start + direction;
      index >= 0 && index < current.lanes.length;
      index += direction
    ) {
      const lane = current.lanes[index]
      if (current.entry) {
        const writableLane = lane && !lane.complete && writable
        if (writableLane) {
          focusNewTask(lane.key)
          return
        }
        if (lane.tasks.length > 0) {
          focusTask(
            lane.tasks[
              Math.min(
                Math.max(current.task, 0),
                lane.tasks.length - 1,
              )
            ],
          )
          return
        }
        continue
      }
      if (lane.tasks.length > 0) {
        focusTask(
          lane.tasks[Math.min(current.task, lane.tasks.length - 1)],
        )
        return
      }
      if (writable && !lane.complete) {
        focusNewTask(lane.key)
        return
      }
    }
  }

  function focusTask(task: BoardTask | undefined) {
    if (!task) return
    state.selectTask(task.id)
    const el = document.querySelector<HTMLElement>(
      `[data-task-id="${task.id}"]`,
    )
    el?.focus()
    const lane = lanes.find(({ tasks: laneTasks }) =>
      laneTasks.some(({ id }) => id === task.id),
    )
    if (lane) scrollLaneIntoView(lane.key)
  }

  function focusNewTask(laneKey: string) {
    state.selectNewTask(laneKey)
    const el = document.querySelector<HTMLElement>(
      `[data-lane-key="${laneKey}"] [data-new-task-entry]`,
    )
    el?.focus()
    scrollLaneIntoView(laneKey)
  }

  function scrollLaneIntoView(laneKey: string) {
    const el = document.querySelector<HTMLElement>(
      `[data-lane-key="${laneKey}"]`,
    )
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }

  function moveSelected(
    task: number,
    direction: "up" | "down" | "left" | "right",
  ) {
    const visible = visibleLanes()
    const laneIndex = visible.findIndex(({ tasks: laneTasks }) =>
      laneTasks.some(({ id }) => id === task),
    )
    const lane = visible[laneIndex]
    if (!lane) return
    if (direction === "up" || direction === "down") {
      const index = lane.tasks.findIndex(({ id }) => id === task)
      const target = index + (direction === "up" ? -1 : 1)
      if (target >= 0 && target < lane.tasks.length) {
        moveTask(
          task,
          laneDestination(lane),
          TaskMovement.anchors(lane.tasks, task, target),
        )
      }
      return
    }
    const targetLane =
      visible[laneIndex + (direction === "left" ? -1 : 1)]
    if (targetLane) {
      moveTask(
        task,
        laneDestination(targetLane),
        TaskMovement.anchors(
          targetLane.tasks,
          task,
          targetLane.tasks.length,
        ),
      )
    }
  }

  function createTask(input: TaskComposer.Input) {
    return boards.createTask(ws, boardSlug, input)
  }

  function moveTask(
    task: number,
    destination: TaskMenu.Destination,
    anchors: { before?: number | null; after?: number | null } = {},
  ) {
    return boards.moveTask({
      workspace: ws,
      board: boardSlug,
      task,
      destination,
      ...anchors,
    })
  }

  const shownLanes = visibleLanes()

  return (
    <Stack gap="md" className={classes.phasesView}>
      <div className={classes.laneControls}>
        <Button
          size="compact-sm"
          variant={state.incompleteLaneVisible ? "filled" : "default"}
          leftSection={
            state.incompleteLaneVisible ? (
              <Icon name="eye-slash" />
            ) : (
              <Icon name="eye" />
            )
          }
          onClick={() => state.toggleIncompleteLane()}
        >
          {state.incompleteLaneVisible
            ? "Hide Incomplete"
            : "Show Incomplete"}
        </Button>
        {writable && (
          <Button
            size="compact-sm"
            leftSection={<Icon name="plus" />}
            onClick={() => state.setPhaseComposerVisible(true)}
          >
            Add phase
          </Button>
        )}
        <Button
          size="compact-sm"
          variant={state.completeLaneVisible ? "filled" : "default"}
          leftSection={
            state.completeLaneVisible ? (
              <Icon name="eye-slash" />
            ) : (
              <Icon name="eye" />
            )
          }
          onClick={() => state.toggleCompleteLane()}
        >
          {state.completeLaneVisible
            ? "Hide Complete"
            : "Show Complete"}
        </Button>
      </div>
      {state.phaseComposerVisible && (
        <PhaseComposer
          creating={boards.creatingPhase}
          onCreate={(input) =>
            boards.createPhase(ws, boardSlug, input)
          }
          onCreated={() => state.setPhaseComposerVisible(false)}
          onCancel={() => state.setPhaseComposerVisible(false)}
        />
      )}
      <div
        className={`${classes.phaseScroller} ${scrollbarClasses.scrollbar}`}
        aria-label="Phase lanes"
        data-drag-scroll
      >
        <div className={classes.phaseStrip}>
          {shownLanes.map((lane) => {
            const phaseID = lane.phase?.id
            return (
              <PhaseLane
                key={lane.key}
                lane={lane}
                phases={phases}
                writable={writable}
                selectedTask={
                  lane.tasks.some(
                    ({ id }) => id === state.selectedTask,
                  )
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
    </Stack>
  )
}

export namespace PhasesView {
  export type Props = {
    aggregate: BoardAggregate
    onOpen: (taskID: number) => void
  }
}

function makeLanes(
  phases: BoardAggregate["phases"],
  tasks: BoardAggregate["tasks"],
): Lane[] {
  const incomplete: Lane = {
    key: "incomplete",
    title: "Incomplete",
    phase: null,
    complete: false,
    tasks: [],
  }
  const phaseLanes = phases.map(
    (phase): Lane => ({
      key: `phase-${phase.id}`,
      title: phase.title,
      phase,
      complete: false,
      tasks: [],
    }),
  )
  const byPhase = new Map(
    phaseLanes.map((lane) => [lane.phase!.id, lane]),
  )
  const complete: Lane = {
    key: "complete",
    title: "Complete",
    phase: null,
    complete: true,
    tasks: [],
  }

  for (const task of tasks) {
    if (task.complete) {
      complete.tasks.push(task)
    } else {
      const lane =
        task.phase === null ? incomplete : byPhase.get(task.phase)
      lane?.tasks.push(task)
    }
  }

  return [incomplete, ...phaseLanes, complete]
}

function laneDestination(lane: Lane): TaskMenu.Destination {
  return lane.complete
    ? { type: "complete" }
    : { type: "phase", phase: lane.phase?.id ?? null }
}
