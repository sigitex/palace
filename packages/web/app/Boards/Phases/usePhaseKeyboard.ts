import { Lane } from "@/Boards/Phases/Lane"
import type { PhaseActions } from "@/Boards/Phases/usePhaseActions"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { useKeyboardShortcuts } from "@/common/useKeyboardShortcuts"
import { useBoards, useBoardsView } from "@/state"
import type { BoardTask } from "shared/models"

// Keyboard navigation for the phase board: arrows move the selection across
// lanes and tasks (including the per-lane new-task entry), Ctrl+arrows move the
// selected task, and single keys open/complete/rename/delete it.
export function usePhaseKeyboard(deps: {
  ws: string
  board: string
  lanes: Lane[]
  writable: boolean
  editingTask: number | null
  setEditingTask: (taskID: number | null) => void
  onOpen: (taskID: number) => void
  moveTask: PhaseActions["moveTask"]
}) {
  const {
    ws,
    board,
    lanes,
    writable,
    editingTask,
    setEditingTask,
    onOpen,
    moveTask,
  } = deps
  const state = useBoardsView()
  const boards = useBoards()

  function visibleLanes() {
    return Lane.visible(lanes, {
      incomplete: state.incompleteLaneVisible,
      complete: state.completeLaneVisible,
    })
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
          Lane.destination(lane),
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
        Lane.destination(targetLane),
        TaskMovement.anchors(
          targetLane.tasks,
          task,
          targetLane.tasks.length,
        ),
      )
    }
  }

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
        boards.completeTask(ws, board, state.selectedTask),
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
}
