import type { BoardTask } from "shared/models"

// The tasks shown for the current search text and projection filter
// ("all" | "incomplete" | "complete" | "phase:<id>").
export function visibleTasks(
  tasks: BoardTask[],
  search: string,
  projection: string,
): BoardTask[] {
  const normalized = search.trim().toLowerCase()
  return tasks.filter((task) => {
    const matchesSearch =
      !normalized || task.title.toLowerCase().includes(normalized)
    if (!matchesSearch) return false
    if (projection === "all") return true
    if (projection === "incomplete") {
      return !task.complete && task.phase === null
    }
    if (projection === "complete") return task.complete
    return (
      !task.complete && task.phase === Number(projection.slice(6))
    )
  })
}
