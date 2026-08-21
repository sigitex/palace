import type { call } from "@/common/call"
import type { BoardAggregate, BoardTask } from "shared/models"

export type TaskMove = Parameters<typeof call.boards.task.move>[0]

export namespace TaskMovement {
  export function apply(
    aggregate: BoardAggregate,
    move: TaskMove,
  ): BoardAggregate {
    const current = aggregate.tasks.find(({ id }) => id === move.task)
    if (!current) {
      return aggregate
    }
    const moved = destinationTask(current, move.destination)
    const tasks = aggregate.tasks.filter(({ id }) => id !== move.task)
    const before = indexOf(tasks, move.before)
    const after = indexOf(tasks, move.after)
    let index = before ?? (after === null ? -1 : after + 1)
    if (index < 0) {
      const last = tasks.findLastIndex((task) =>
        contains(move.destination, task),
      )
      index = last < 0 ? tasks.length : last + 1
    }
    tasks.splice(index, 0, moved)
    return {
      ...aggregate,
      tasks: tasks.map((task, position) => ({ ...task, position })),
    }
  }

  export function anchors(
    tasks: BoardTask[],
    taskID: number,
    targetIndex: number,
  ) {
    const withoutTask = tasks.filter(({ id }) => id !== taskID)
    const bounded = Math.max(0, Math.min(targetIndex, withoutTask.length))
    return {
      after: withoutTask[bounded - 1]?.id ?? null,
      before: withoutTask[bounded]?.id ?? null,
    }
  }

  export function describePosition(index: number, count: number) {
    return `position ${index + 1} of ${count}`
  }
}

function destinationTask(
  task: BoardTask,
  destination: TaskMove["destination"],
): BoardTask {
  if (destination.type === "complete") {
    return { ...task, complete: true }
  }
  if (destination.type === "phase") {
    return { ...task, complete: false, phase: destination.phase }
  }
  return task
}

function contains(destination: TaskMove["destination"], task: BoardTask) {
  if (destination.type === "board") {
    return true
  }
  if (destination.type === "complete") {
    return task.complete
  }
  return !task.complete && task.phase === destination.phase
}

function indexOf(tasks: BoardTask[], taskID: number | null | undefined) {
  if (taskID === null || taskID === undefined) {
    return null
  }
  const index = tasks.findIndex(({ id }) => id === taskID)
  return index < 0 ? null : index
}
