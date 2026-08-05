import classes from "@/Boards/List/ListView.module.css"
import { DeletePopover } from "@/Boards/Shared/DeletePopover"
import { TaskMenu } from "@/Boards/Task/TaskMenu"
import { TaskStateSelector } from "@/Boards/Task/TaskStateSelector"
import type { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import {
  ActionIcon,
  Checkbox,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core"
import { memo } from "react"
import { PiDotsSixVertical, PiTrash } from "react-icons/pi"
import type { BoardAggregate, BoardTask } from "shared/models"

export type TaskRowCommands = {
  select: (taskID: number) => void
  open: (taskID: number) => void
  cancelEdit: () => void
  saveTitle: (taskID: number, title: string) => Promise<unknown>
  setState: (
    taskID: number,
    state: TaskStateSelector.Value,
  ) => Promise<unknown>
  setComplete: (taskID: number, complete: boolean) => Promise<unknown>
  move: (taskID: number, destination: TaskMenu.Destination) => void
  step: (taskID: number, direction: -1 | 1) => void
  delete: (taskID: number) => Promise<unknown>
}

export type TaskRowProps = {
  task: BoardTask
  phases: BoardAggregate["phases"]
  writable: boolean
  selected: boolean
  editing: boolean
  dragHandle: usePointerDrag.Handle
  position: string
  commands: TaskRowCommands
}

export const TaskRow = memo(
  ({
    task,
    phases,
    writable,
    selected,
    editing,
    dragHandle,
    position,
    commands,
  }: TaskRowProps) => {
    const phase = phases.find(({ id }) => id === task.phase)
    return (
      <div
        role="option"
        aria-selected={selected}
        data-task-id={task.id}
        tabIndex={selected ? 0 : -1}
        data-drag-source
        data-drag-label={task.title}
        className={`${classes.taskRow} ${selected ? classes.taskSelected : ""} ${task.complete ? classes.taskComplete : ""}`}
        style={
          {
            "--task-background":
              !task.complete && phase
                ? `var(--mantine-color-${phase.color}-light)`
                : "var(--mantine-color-gray-light)",
          } as React.CSSProperties
        }
        onClick={(event) => {
          commands.select(task.id)
          event.currentTarget.focus()
        }}
        onDoubleClick={() => commands.open(task.id)}
      >
        {writable && (
          <ActionIcon
            variant="subtle"
            aria-label={`Drag ${task.title}; ${position}`}
            className={classes.dragHandle}
            {...dragHandle}
          >
            <PiDotsSixVertical />
          </ActionIcon>
        )}
        <Checkbox
          aria-label={`${task.complete ? "Reopen" : "Complete"} ${task.title}`}
          checked={task.complete}
          disabled={!writable}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            commands.setComplete(task.id, event.currentTarget.checked)
          }
        />
        {editing ? (
          <TextInput
            autoFocus
            aria-label="Task title"
            defaultValue={task.title}
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                commands.cancelEdit()
              }
              if (
                event.key === "Enter" &&
                event.currentTarget.value.trim()
              ) {
                commands.saveTitle(
                  task.id,
                  event.currentTarget.value.trim(),
                )
              }
            }}
          />
        ) : (
          <UnstyledButton
            className={classes.taskTitle}
            onClick={() => commands.select(task.id)}
            onDoubleClick={(event) => {
              event.stopPropagation()
              commands.open(task.id)
            }}
          >
            <Text
              fw={600}
              td={task.complete ? "line-through" : undefined}
            >
              {task.title}
            </Text>
          </UnstyledButton>
        )}
        <TaskStateSelector
          phases={phases}
          task={task}
          writable={writable}
          onChange={(state) => commands.setState(task.id, state)}
        />
        <Text size="xs" c="dimmed">
          {task.creator.name}
        </Text>
        {writable && (
          <>
            <TaskMenu
              task={task}
              phases={phases}
              onMove={(destination) =>
                commands.move(task.id, destination)
              }
              onStep={(direction) =>
                commands.step(task.id, direction)
              }
            />
            <DeletePopover
              label={`task “${task.title}”`}
              onDelete={() => commands.delete(task.id)}
            >
              <ActionIcon
                color="red"
                variant="subtle"
                aria-label={`Delete ${task.title}`}
              >
                <PiTrash />
              </ActionIcon>
            </DeletePopover>
          </>
        )}
      </div>
    )
  },
)
