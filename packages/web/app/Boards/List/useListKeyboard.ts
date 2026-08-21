import { LIST_ENTRY } from "@/Boards/List/listEntry"
import type { TaskRowCommands } from "@/Boards/List/TaskRow"
import { useKeyboardShortcuts } from "@/common/useKeyboardShortcuts"
import { useBoardsView } from "@/state"
import type { BoardTask } from "shared/models"

// Keyboard navigation for the flat task list: arrows move the selection through
// visible tasks and onto the bottom new-task entry, Ctrl+arrows reorder the
// selected task, and single keys open/rename/delete it.
export function useListKeyboard(deps: {
  writable: boolean
  editing: number | null
  setEditing: (taskID: number | null) => void
  onOpen: (taskID: number) => void
  visible: BoardTask[]
  commands: TaskRowCommands
}) {
  const { writable, editing, setEditing, onOpen, visible, commands } =
    deps
  const state = useBoardsView()

  function selectStep(direction: -1 | 1) {
    if (state.selectedNewTask === LIST_ENTRY) {
      if (direction === -1) {
        const task = visible[visible.length - 1]
        if (task) {
          state.selectTask(task.id)
          document
            .querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)
            ?.focus()
        }
      }
      return
    }
    const index = visible.findIndex(
      ({ id }) => id === state.selectedTask,
    )
    const task = visible[index + direction]
    if (task) {
      state.selectTask(task.id)
      document
        .querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)
        ?.focus()
    } else if (direction === 1 && writable && index >= 0) {
      state.selectNewTask(LIST_ENTRY)
      document
        .querySelector<HTMLElement>("[data-new-task-entry]")
        ?.focus()
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
        (state.selectedTask !== null ||
          state.selectedNewTask === LIST_ENTRY) &&
        editing === null,
      action: () => selectStep(-1),
    },
    {
      key: "ArrowDown",
      enabled:
        (state.selectedTask !== null ||
          state.selectedNewTask === LIST_ENTRY) &&
        editing === null,
      action: () => selectStep(1),
    },
    {
      key: "Enter",
      enabled:
        (state.selectedTask !== null ||
          state.selectedNewTask === LIST_ENTRY) &&
        editing === null,
      action: () => {
        if (state.selectedTask !== null) {
          onOpen(state.selectedTask)
        } else if (state.selectedNewTask === LIST_ENTRY) {
          state.openTaskComposer()
        }
      },
    },
    {
      key: "F2",
      enabled:
        writable && state.selectedTask !== null && editing === null,
      action: () => setEditing(state.selectedTask),
    },
    {
      key: "Delete",
      enabled:
        writable && state.selectedTask !== null && editing === null,
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
      enabled:
        writable && state.selectedTask !== null && editing === null,
      action: () =>
        state.selectedTask !== null &&
        commands.step(state.selectedTask, -1),
    },
    {
      key: "ArrowDown",
      control: true,
      enabled:
        writable && state.selectedTask !== null && editing === null,
      action: () =>
        state.selectedTask !== null &&
        commands.step(state.selectedTask, 1),
    },
  ])
}
