import type { Lane } from "@/Boards/Phases/Lane"
import type { PhaseLaneCommands } from "@/Boards/Phases/PhaseLaneCommands"
import classes from "@/Boards/Phases/Phases.module.css"
import { TaskCard } from "@/Boards/Phases/TaskCard"
import { NewTaskEntry } from "@/Boards/Task/NewTaskEntry"
import { TaskComposer } from "@/Boards/Task/TaskComposer"
import scrollbarClasses from "@/common/Scrollbars.module.css"
import type { usePointerDrag } from "@/common/usePointerDrag"
import { useBoardsView } from "@/state"
import { Stack, Text } from "@mantine/core"
import type { BoardPhase } from "shared/models"

type Props = {
  lane: Lane
  phases: BoardPhase[]
  writable: boolean
  selectedTask: number | null
  selectedNewTask: string | null
  editingTask: number | null
  taskComposerOpen: boolean
  creatingTask: boolean
  movingTask: number | null
  taskDragHandles: ReadonlyMap<number, usePointerDrag.Handle>
  commands: PhaseLaneCommands
}

// A lane's scrollable task cards, followed by the empty-state text and the
// sticky footer that hosts the task composer or the new-task entry.
export function PhaseLaneTasks({
  lane,
  phases,
  writable,
  selectedTask,
  selectedNewTask,
  editingTask,
  taskComposerOpen,
  creatingTask,
  movingTask,
  taskDragHandles,
  commands,
}: Props) {
  const view = useBoardsView()
  return (
    <Stack
      gap="xs"
      className={`${classes.laneTaskList} ${scrollbarClasses.scrollbar}`}
    >
      {lane.tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          phases={phases}
          phase={lane.phase}
          lane={lane.key}
          writable={writable}
          selected={selectedTask === task.id}
          editing={editingTask === task.id}
          moving={task.id === movingTask}
          dragHandle={taskDragHandles.get(task.id)!}
          commands={commands}
        />
      ))}
      {lane.tasks.length === 0 && !taskComposerOpen && !writable && (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          No tasks
        </Text>
      )}
      {(taskComposerOpen || (writable && !lane.complete)) && (
        <div className={classes.stickyFooter}>
          {taskComposerOpen ? (
            <TaskComposer
              phases={phases}
              defaultPhase={lane.phase?.id ?? null}
              showPhase={false}
              creating={creatingTask}
              onCreate={commands.createTask}
              onCreated={(task) => {
                commands.closeTaskComposer()
                view.addPendingTask(task.id)
                commands.select(task.id)
              }}
              onCancel={commands.closeTaskComposer}
            />
          ) : (
            <NewTaskEntry
              selected={selectedNewTask === lane.key}
              onActivate={() =>
                commands.openTaskComposer(lane.phase?.id ?? null)
              }
            />
          )}
        </div>
      )}
    </Stack>
  )
}
