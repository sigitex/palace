import classes from "@/Boards/List/List.module.css"
import { LIST_ENTRY } from "@/Boards/List/listEntry"
import { TaskRow, type TaskRowCommands } from "@/Boards/List/TaskRow"
import { NewTaskEntry } from "@/Boards/Task/NewTaskEntry"
import { TaskComposer } from "@/Boards/Task/TaskComposer"
import scrollbarClasses from "@/common/Scrollbars.module.css"
import type { usePointerDrag } from "@/common/usePointerDrag"
import { useBoards, useBoardsView } from "@/state"
import { Stack, Text } from "@mantine/core"
import type { BoardPhase, BoardTask } from "shared/models"

type Props = {
  ws: string
  board: string
  visible: BoardTask[]
  phases: BoardPhase[]
  writable: boolean
  editing: number | null
  dragHandles: ReadonlyMap<number, usePointerDrag.Handle>
  commands: TaskRowCommands
}

// The scrollable listbox of task rows, with the empty-state message and the
// sticky footer that hosts either the task composer or the new-task entry.
export function TaskList({
  ws,
  board,
  visible,
  phases,
  writable,
  editing,
  dragHandles,
  commands,
}: Props) {
  const state = useBoardsView()
  const boards = useBoards()
  return (
    <Stack
      gap={0}
      className={`${classes.taskList} ${scrollbarClasses.scrollbar}`}
      role="listbox"
      data-drag-scroll
    >
      {visible.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          phases={phases}
          writable={writable}
          selected={task.id === state.selectedTask}
          editing={task.id === editing}
          dragHandle={dragHandles.get(task.id)!}
          commands={commands}
        />
      ))}
      {visible.length === 0 &&
        !state.taskComposerVisible &&
        !writable && (
          <Text c="dimmed" ta="center" p="xl">
            No tasks match this view.
          </Text>
        )}
      {(state.taskComposerVisible || writable) && (
        <div className={classes.stickyFooter}>
          {state.taskComposerVisible ? (
            <TaskComposer
              phases={phases}
              defaultPhase={state.taskComposerPhase}
              showPhase={false}
              creating={boards.creatingTask}
              onCreate={(input) => boards.createTask(ws, board, input)}
              onCreated={(task) => {
                state.closeTaskComposer()
                state.addPendingTask(task.id)
                state.selectTask(task.id)
              }}
              onCancel={() => state.closeTaskComposer()}
            />
          ) : (
            <NewTaskEntry
              selected={state.selectedNewTask === LIST_ENTRY}
              onActivate={() => state.openTaskComposer()}
            />
          )}
        </div>
      )}
    </Stack>
  )
}
