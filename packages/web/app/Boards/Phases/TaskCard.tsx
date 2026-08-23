import type { usePointerDrag } from "@/common/usePointerDrag"
import classes from "@/Boards/Phases/Phases.module.css"
import { DeletePopover } from "@/common/DeletePopover"
import {
  TaskMenu,
  type TaskMenuDestination,
} from "@/Boards/Task/TaskMenu"
import {
  ActionIcon,
  Group,
  Paper,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core"
import { memo } from "react"
import { Icon } from "@/common/Icon"
import type { BoardPhase, BoardTask } from "shared/models"

export type TaskCardCommands = {
  select: (taskID: number) => void
  open: (taskID: number) => void
  move: (taskID: number, destination: TaskMenuDestination) => void
  step: (taskID: number, lane: string, direction: -1 | 1) => void
  delete: (taskID: number) => Promise<unknown>
  saveTitle: (taskID: number, title: string) => Promise<unknown>
  cancelEdit: () => void
}

type Props = {
  task: BoardTask
  phases: BoardPhase[]
  phase: BoardPhase | null
  lane: string
  writable: boolean
  selected: boolean
  editing: boolean
  moving: boolean
  dragHandle: usePointerDrag.Handle
  commands: TaskCardCommands
}

export const TaskCard = memo(
  ({
    task,
    phases,
    phase,
    lane,
    writable,
    selected,
    editing,
    moving,
    dragHandle,
    commands,
  }: Props) => {
    return (
      <Paper
        withBorder
        p="xs"
        className={`${classes.taskCard} ${selected ? classes.taskSelected : ""} ${task.complete ? classes.taskComplete : ""} ${moving ? classes.taskMoving : ""}`}
        role="option"
        aria-selected={selected}
        data-task-id={task.id}
        data-drag-source
        data-drag-label={task.title}
        tabIndex={selected ? 0 : -1}
        style={
          {
            "--task-background": phase
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
        <Group align="flex-start" wrap="nowrap" gap="xs">
          {editing ? (
            <TextInput
              autoFocus
              aria-label="Task title"
              defaultValue={task.title}
              onFocus={(event) => event.currentTarget.select()}
              onPointerDown={(e) => e.stopPropagation()}
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
              style={{ flex: 1 }}
            />
          ) : (
            <UnstyledButton
              className={classes.taskTitle}
              style={{ flex: 1 }}
              onClick={() => commands.select(task.id)}
              onDoubleClick={(event) => {
                event.stopPropagation()
                commands.open(task.id)
              }}
              onPointerDown={
                writable
                  ? (event) => dragHandle.onPointerDown(event)
                  : undefined
              }
              onPointerMove={
                writable ? dragHandle.onPointerMove : undefined
              }
              onPointerUp={
                writable ? dragHandle.onPointerUp : undefined
              }
              onPointerCancel={
                writable ? dragHandle.onPointerCancel : undefined
              }
              onLostPointerCapture={
                writable ? dragHandle.onLostPointerCapture : undefined
              }
            >
              <Text
                fw={600}
                td={task.complete ? "line-through" : undefined}
              >
                {task.title}
              </Text>
            </UnstyledButton>
          )}
          {writable && (
            <span
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                gap: "var(--mantine-spacing-xs)",
                alignItems: "center",
              }}
            >
              <TaskMenu
                task={task}
                phases={phases}
                onMove={(destination) =>
                  commands.move(task.id, destination)
                }
                onStep={(direction) =>
                  commands.step(task.id, lane, direction)
                }
              />
              <DeletePopover
                label={`task "${task.title}"`}
                onDelete={() => commands.delete(task.id)}
              >
                <ActionIcon
                  color="red"
                  variant="subtle"
                  aria-label={`Delete ${task.title}`}
                >
                  <Icon name="trash" />
                </ActionIcon>
              </DeletePopover>
            </span>
          )}
        </Group>
      </Paper>
    )
  },
)
