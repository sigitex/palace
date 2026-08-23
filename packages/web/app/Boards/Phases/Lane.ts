import type { TaskMenuDestination } from "@/Boards/Task/TaskMenu"
import type {
  BoardAggregate,
  BoardPhase,
  BoardTask,
} from "shared/models"

export type Lane = {
  key: string
  title: string
  phase: BoardPhase | null
  complete: boolean
  tasks: BoardTask[]
}

export namespace Lane {
  // Group a board's tasks into the incomplete lane, one lane per phase, and
  // the complete lane — in that fixed order.
  export function build(
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

  // The move destination a task lands in when dropped into this lane.
  export function destination(lane: Lane): TaskMenuDestination {
    return lane.complete
      ? { type: "complete" }
      : { type: "phase", phase: lane.phase?.id ?? null }
  }

  export function visible(
    lanes: Lane[],
    shown: { incomplete: boolean; complete: boolean },
  ): Lane[] {
    return lanes.filter(
      ({ key }) =>
        (key !== "incomplete" || shown.incomplete) &&
        (key !== "complete" || shown.complete),
    )
  }
}
