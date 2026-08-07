import { usePointerDrag } from "@/common/usePointerDrag"
import classes from "@/Boards/List/List.module.css"
import type { ListActions } from "@/Boards/List/useListActions"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { useMemo } from "react"
import type { BoardTask } from "shared/models"

type TaskDrop = {
  task: number
  after: boolean
}

// Vertical drag-to-reorder for the task list. Returns the per-task drag handle
// map keyed by task id.
export function useListDrag(deps: {
  tasks: BoardTask[]
  visible: BoardTask[]
  moveTask: ListActions["moveTask"]
}) {
  const { tasks, visible, moveTask } = deps
  const drag = usePointerDrag<number, TaskDrop>({
    resolveTarget(element, _source, point) {
      const row = element?.closest<HTMLElement>("[data-task-id]")
      if (!row) return null
      const task = Number(row.dataset.taskId)
      const bounds = row.getBoundingClientRect()
      return {
        value: {
          task,
          after: point.y > bounds.top + bounds.height / 2,
        },
        indicators: [
          {
            element: row,
            className:
              point.y > bounds.top + bounds.height / 2
                ? classes.dropTargetAfter
                : classes.dropTargetBefore,
          },
        ],
      }
    },
    onDrop(source, target) {
      const index = visible.findIndex(({ id }) => id === target.task)
      if (index < 0) return
      return moveTask(
        source,
        { type: "board" },
        TaskMovement.anchors(
          visible,
          source,
          index + (target.after ? 1 : 0),
        ),
      )
    },
    sourceClassName: classes.dragSourceActive,
  })
  // Keyed on the task id list, not the array identity: editing a task's fields
  // (e.g. a checkbox) must not rebuild every handle and break TaskRow memo.
  const taskIdKey = tasks.map(({ id }) => id).join(",")
  return useMemo(
    () => new Map(tasks.map(({ id }) => [id, drag.handle(id)])),
    [drag.handle, taskIdKey],
  )
}
