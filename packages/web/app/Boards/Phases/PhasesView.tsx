// oxlint-disable eslint/complexity
import { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import { PhaseComposer } from "@/Boards/Phases/PhaseComposer"
import {
  PhaseLane,
  type Lane,
  type PhaseLaneCommands,
} from "@/Boards/Phases/PhaseLane"
import classes from "@/Boards/Phases/PhasesView.module.css"
import { BoardsQuery } from "@/Boards/BoardsQuery"
import {
  BoardsState,
  useBoardsState,
} from "@/Boards/State/BoardsState"
import type { TaskComposer } from "@/Boards/Task/TaskComposer"
import type { TaskMenu } from "@/Boards/Task/TaskMenu"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { call } from "@/common/call"
import { useKeyboardShortcuts } from "@/common/useKeyboardShortcuts"
import { Button, Stack } from "@mantine/core"
import { useMemo, useRef } from "react"
import { PiEye, PiEyeSlash, PiPlus } from "react-icons/pi"
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
  const state = useBoardsState()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const aggregateKey = BoardsQuery.keys.exact.aggregate(
    workspace.slug,
    board.slug,
  )
  const action = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    { invalidateExact: [aggregateKey] },
  )
  const createTask = BoardsQuery.useAction(
    (input: TaskComposer.Input) =>
      call.boards.task.create({
        workspace: workspace.slug,
        board: board.slug,
        ...input,
      }),
    { invalidateExact: [aggregateKey] },
  )
  const createPhase = BoardsQuery.useAction(
    (input: PhaseComposer.Input) =>
      call.boards.phase.create({
        workspace: workspace.slug,
        board: board.slug,
        ...input,
      }),
    { invalidateExact: [aggregateKey] },
  )
  const taskMove = BoardsQuery.useMoveTask(workspace.slug, board.slug)
  const lanes = useMemo(
    () => makeLanes(phases, tasks),
    [phases, tasks],
  )
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
        return movePhaseTo(source.id, target.phase, target.after)
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
  })
  const taskDragHandles = useMemo(
    () =>
      new Map(
        tasks.map(({ id }) => [
          id,
          drag.handle({ kind: "task", id }),
        ]),
      ),
    [drag.handle, tasks],
  )
  const phaseDragHandles = useMemo(
    () =>
      new Map(
        phases.map(({ id }) => [
          id,
          drag.handle({ kind: "phase", id }),
        ]),
      ),
    [drag.handle, phases],
  )
  const commandContext = useRef({
    workspace: workspace.slug,
    board: board.slug,
    lanes,
    onOpen,
    runAction: action.mutateAsync,
    createTask: createTask.mutateAsync,
    moveTask,
    movePhaseStep,
  })
  commandContext.current = {
    workspace: workspace.slug,
    board: board.slug,
    lanes,
    onOpen,
    runAction: action.mutateAsync,
    createTask: createTask.mutateAsync,
    moveTask,
    movePhaseStep,
  }
  const commandRef = useRef<PhaseLaneCommands | null>(null)
  const commands = (commandRef.current ??= {
    select: BoardsState.selectTask,
    open(taskID) {
      commandContext.current.onOpen(taskID)
    },
    move(taskID, destination) {
      commandContext.current.moveTask(taskID, destination)
    },
    step(taskID, laneKey, direction) {
      const context = commandContext.current
      const lane = context.lanes.find(({ key }) => key === laneKey)
      if (!lane) return
      const index = lane.tasks.findIndex(({ id }) => id === taskID)
      context.moveTask(
        taskID,
        laneDestination(lane),
        TaskMovement.anchors(lane.tasks, taskID, index + direction),
      )
    },
    delete(taskID) {
      const context = commandContext.current
      return context.runAction(() =>
        call.boards.task.delete({
          workspace: context.workspace,
          board: context.board,
          task: taskID,
        }),
      )
    },
    editPhase: BoardsState.setActivePhaseEditor,
    movePhase(phaseID, direction) {
      commandContext.current.movePhaseStep(phaseID, direction)
    },
    openTaskComposer: BoardsState.openTaskComposer,
    closeTaskComposer: BoardsState.closeTaskComposer,
    createTask(input) {
      return commandContext.current.createTask(input)
    },
    async savePhase(phaseID, metadata) {
      const context = commandContext.current
      await context.runAction(() =>
        call.boards.phase.update({
          workspace: context.workspace,
          board: context.board,
          phase: phaseID,
          ...metadata,
        }),
      )
      BoardsState.setActivePhaseEditor(null)
    },
    async deletePhase(phaseID) {
      const context = commandContext.current
      await context.runAction(() =>
        call.boards.phase.delete({
          workspace: context.workspace,
          board: context.board,
          phase: phaseID,
        }),
      )
      BoardsState.setActivePhaseEditor(null)
    },
  })

  useKeyboardShortcuts([
    {
      key: "n",
      enabled: writable && !state.taskComposerVisible,
      action: () => BoardsState.openTaskComposer(),
    },
    {
      key: "ArrowUp",
      enabled: state.selectedTask !== null,
      action: () => selectVertical(-1),
    },
    {
      key: "ArrowDown",
      enabled: state.selectedTask !== null,
      action: () => selectVertical(1),
    },
    {
      key: "ArrowLeft",
      enabled: state.selectedTask !== null,
      action: () => selectHorizontal(-1),
    },
    {
      key: "ArrowRight",
      enabled: state.selectedTask !== null,
      action: () => selectHorizontal(1),
    },
    {
      key: "Enter",
      enabled: state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null && onOpen(state.selectedTask),
    },
    {
      key: "x",
      enabled: writable && state.selectedTask !== null,
      action: () =>
        state.selectedTask !== null &&
        completeTask(state.selectedTask),
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
    }
  }

  function selectVertical(direction: -1 | 1) {
    const current = selectedPosition()
    focusTask(
      current.lanes[current.lane]?.tasks[current.task + direction],
    )
  }

  function selectHorizontal(direction: -1 | 1) {
    const current = selectedPosition()
    for (
      let index = current.lane + direction;
      index >= 0 && index < current.lanes.length;
      index += direction
    ) {
      const laneTasks = current.lanes[index].tasks
      if (laneTasks.length > 0) {
        focusTask(
          laneTasks[Math.min(current.task, laneTasks.length - 1)],
        )
        return
      }
    }
  }

  function focusTask(task: BoardTask | undefined) {
    if (!task) return
    BoardsState.selectTask(task.id)
    document
      .querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)
      ?.focus()
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

  function completeTask(task: number) {
    return action.mutateAsync(() =>
      call.boards.task.update({
        workspace: workspace.slug,
        board: board.slug,
        task,
        complete: true,
      }),
    )
  }

  function moveTask(
    task: number,
    destination: TaskMenu.Destination,
    anchors: { before?: number | null; after?: number | null } = {},
  ) {
    return taskMove.mutateAsync({
      workspace: workspace.slug,
      board: board.slug,
      task,
      destination,
      ...anchors,
    })
  }

  function movePhaseTo(
    source: number,
    target: number,
    after: boolean,
  ) {
    if (source === target) return
    const moving = phases.find(({ id }) => id === source)
    const remaining = phases.filter(({ id }) => id !== source)
    const targetIndex = remaining.findIndex(({ id }) => id === target)
    if (!moving || targetIndex < 0) return
    const index = targetIndex + (after ? 1 : 0)
    remaining.splice(index, 0, moving)
    const movedIndex = remaining.findIndex(({ id }) => id === source)
    const without = remaining.filter(({ id }) => id !== source)
    return action.mutateAsync(() =>
      call.boards.phase.move({
        workspace: workspace.slug,
        board: board.slug,
        phase: source,
        after: without[movedIndex - 1]?.id ?? null,
        before: without[movedIndex]?.id ?? null,
      }),
    )
  }

  function movePhaseStep(phase: number, direction: -1 | 1) {
    const index = phases.findIndex(({ id }) => id === phase)
    const target = phases[index + direction]
    if (target) movePhaseTo(phase, target.id, direction > 0)
  }

  const shownLanes = visibleLanes()

  return (
    <Stack gap="md" className={classes.phasesView}>
      <div className={classes.laneControls}>
        <Button
          size="compact-sm"
          variant={state.incompleteLaneVisible ? "filled" : "default"}
          leftSection={
            state.incompleteLaneVisible ? <PiEyeSlash /> : <PiEye />
          }
          onClick={BoardsState.toggleIncompleteLane}
        >
          {state.incompleteLaneVisible
            ? "Hide Incomplete"
            : "Show Incomplete"}
        </Button>
        {writable && (
          <Button
            size="compact-sm"
            leftSection={<PiPlus />}
            onClick={() => BoardsState.setPhaseComposerVisible(true)}
          >
            Add phase
          </Button>
        )}
        <Button
          size="compact-sm"
          variant={state.completeLaneVisible ? "filled" : "default"}
          leftSection={
            state.completeLaneVisible ? <PiEyeSlash /> : <PiEye />
          }
          onClick={BoardsState.toggleCompleteLane}
        >
          {state.completeLaneVisible
            ? "Hide Complete"
            : "Show Complete"}
        </Button>
      </div>
      {state.phaseComposerVisible && (
        <PhaseComposer
          creating={createPhase.isPending}
          onCreate={createPhase.mutateAsync}
          onCreated={() => BoardsState.setPhaseComposerVisible(false)}
          onCancel={() => BoardsState.setPhaseComposerVisible(false)}
        />
      )}
      <div
        className={classes.phaseScroller}
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
                editing={
                  phaseID !== undefined &&
                  state.activePhaseEditor === phaseID
                }
                taskComposerOpen={
                  !lane.complete &&
                  state.taskComposerVisible &&
                  state.taskComposerPhase === (phaseID ?? null)
                }
                creatingTask={createTask.isPending}
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
