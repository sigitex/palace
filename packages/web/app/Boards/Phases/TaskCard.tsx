import type { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import classes from "@/Boards/Phases/PhasesView.module.css"
import { DeletePopover } from "@/Boards/Shared/DeletePopover"
import { TaskMenu } from "@/Boards/Task/TaskMenu"
import {
  ActionIcon,
  Group,
  Paper,
  Text,
  UnstyledButton,
} from "@mantine/core"
import { memo } from "react"
import { PiDotsSixVertical, PiTrash } from "react-icons/pi"
import type { BoardPhase, BoardTask } from "shared/models"

export type TaskCardCommands = {
  select: (taskID: number) => void
  open: (taskID: number) => void
  move: (taskID: number, destination: TaskMenu.Destination) => void
  step: (taskID: number, lane: string, direction: -1 | 1) => void
  delete: (taskID: number) => Promise<unknown>
}

export type TaskCardProps = {
  task: BoardTask
  phases: BoardPhase[]
  phase: BoardPhase | null
  lane: string
  writable: boolean
  selected: boolean
  dragHandle: usePointerDrag.Handle
  position: string
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
    dragHandle,
    position,
    commands,
  }: TaskCardProps) => {
    return (
      <Paper
        withBorder
        p="xs"
        className={`${classes.taskCard} ${selected ? classes.taskSelected : ""} ${task.complete ? classes.taskComplete : ""}`}
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
        <Group align="flex-start" wrap="nowrap">
          {writable && (
            <ActionIcon
              variant="subtle"
              className={classes.dragHandle}
              aria-label={`Drag ${task.title}; ${position}`}
              onPointerDown={(event) => {
                commands.select(task.id)
                dragHandle.onPointerDown(event)
              }}
              onPointerMove={dragHandle.onPointerMove}
              onPointerUp={dragHandle.onPointerUp}
              onPointerCancel={dragHandle.onPointerCancel}
            >
              <PiDotsSixVertical />
            </ActionIcon>
          )}
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
          {writable && (
            <>
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
        </Group>
      </Paper>
    )
  },
)
