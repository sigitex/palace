// oxlint-disable eslint/complexity
import type { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import { InlinePhaseEditor } from "@/Boards/Phases/InlinePhaseEditor"
import classes from "@/Boards/Phases/PhasesView.module.css"
import {
  TaskCard,
  type TaskCardCommands,
} from "@/Boards/Phases/TaskCard"
import { TaskComposer } from "@/Boards/Task/TaskComposer"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { BoardIcon } from "@/common/BoardIcon"
import {
  ActionIcon,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core"
import { memo } from "react"
import {
  PiCheckCircle,
  PiCircleDashed,
  PiDotsSixVertical,
  PiPencilSimple,
  PiPlus,
} from "react-icons/pi"
import type {
  BoardColor,
  BoardIcon as BoardIconKey,
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

export type PhaseLaneCommands = TaskCardCommands & {
  editPhase: (phaseID: number | null) => void
  movePhase: (phaseID: number, direction: -1 | 1) => void
  openTaskComposer: (phase: number | null) => void
  closeTaskComposer: () => void
  createTask: (input: TaskComposer.Input) => Promise<BoardTask>
  savePhase: (
    phaseID: number,
    metadata: {
      title: string
      color: BoardColor
      icon: BoardIconKey | null
    },
  ) => Promise<unknown>
  deletePhase: (phaseID: number) => Promise<unknown>
}

export type PhaseLaneProps = {
  lane: Lane
  phases: BoardPhase[]
  writable: boolean
  selectedTask: number | null
  editing: boolean
  taskComposerOpen: boolean
  creatingTask: boolean
  phaseDragHandle?: usePointerDrag.Handle
  taskDragHandles: ReadonlyMap<number, usePointerDrag.Handle>
  commands: PhaseLaneCommands
}

export const PhaseLane = memo(
  ({
    lane,
    phases,
    writable,
    selectedTask,
    editing,
    taskComposerOpen,
    creatingTask,
    phaseDragHandle,
    taskDragHandles,
    commands,
  }: PhaseLaneProps) => {
    const laneStyle = {
      "--lane-color": lane.phase
        ? `var(--mantine-color-${lane.phase.color}-6)`
        : "var(--mantine-color-gray-5)",
      "--lane-background": lane.phase
        ? `var(--mantine-color-${lane.phase.color}-light)`
        : "var(--mantine-color-gray-light)",
    } as React.CSSProperties

    return (
      <Paper
        className={classes.phaseLane}
        aria-label={`${lane.title} lane`}
        data-lane-key={lane.key}
        data-phase-id={lane.phase?.id}
        data-drag-source={lane.phase ? true : undefined}
        data-drag-label={lane.phase ? lane.title : undefined}
        style={laneStyle}
        withBorder
        p="sm"
      >
        {editing && lane.phase ? (
          <InlinePhaseEditor
            phase={lane.phase}
            onCancel={() => commands.editPhase(null)}
            onSave={(metadata) =>
              commands.savePhase(lane.phase!.id, metadata)
            }
            onDelete={() => commands.deletePhase(lane.phase!.id)}
          />
        ) : (
          <Group justify="space-between" wrap="nowrap" mb="sm">
            <Group
              gap="xs"
              wrap="nowrap"
              className={classes.phaseTitle}
            >
              {phaseDragHandle && writable && (
                <ActionIcon
                  variant="subtle"
                  className={classes.dragHandle}
                  aria-label={`Drag phase ${lane.title}`}
                  onKeyDown={(event) => {
                    if (
                      event.key === "ArrowLeft" ||
                      event.key === "ArrowRight"
                    ) {
                      event.preventDefault()
                      event.stopPropagation()
                      commands.movePhase(
                        lane.phase!.id,
                        event.key === "ArrowLeft" ? -1 : 1,
                      )
                    }
                  }}
                  {...phaseDragHandle}
                >
                  <PiDotsSixVertical />
                </ActionIcon>
              )}
              {lane.phase?.icon ? (
                <BoardIcon icon={lane.phase.icon} aria-hidden />
              ) : lane.complete ? (
                <PiCheckCircle aria-hidden />
              ) : !lane.phase ? (
                <PiCircleDashed aria-hidden />
              ) : null}
              <Text fw={700} truncate>
                {lane.title}
              </Text>
              <Text size="xs" c="dimmed">
                {lane.tasks.length}
              </Text>
            </Group>
            <Group gap={4} wrap="nowrap">
              {lane.phase && writable && (
                <Tooltip label={`Edit ${lane.title}`}>
                  <ActionIcon
                    variant="subtle"
                    aria-label={`Edit ${lane.title}`}
                    onClick={() => commands.editPhase(lane.phase!.id)}
                  >
                    <PiPencilSimple />
                  </ActionIcon>
                </Tooltip>
              )}
              {!lane.complete && writable && (
                <Tooltip label={`Add task to ${lane.title}`}>
                  <ActionIcon
                    variant="subtle"
                    aria-label={`Add task to ${lane.title}`}
                    onClick={() =>
                      commands.openTaskComposer(
                        lane.phase?.id ?? null,
                      )
                    }
                  >
                    <PiPlus />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
        )}
        {!editing && (
          <Stack gap="xs" className={classes.laneTaskList}>
            {lane.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                phases={phases}
                phase={lane.phase}
                lane={lane.key}
                writable={writable}
                selected={selectedTask === task.id}
                dragHandle={taskDragHandles.get(task.id)!}
                position={TaskMovement.describePosition(
                  index,
                  lane.tasks.length,
                )}
                commands={commands}
              />
            ))}
            {lane.tasks.length === 0 && !taskComposerOpen && (
              <Text size="sm" c="dimmed" ta="center" py="lg">
                No tasks
              </Text>
            )}
            {taskComposerOpen && (
              <TaskComposer
                phases={phases}
                defaultPhase={lane.phase?.id ?? null}
                showPhase={false}
                creating={creatingTask}
                onCreate={commands.createTask}
                onCreated={(task) => {
                  commands.closeTaskComposer()
                  commands.select(task.id)
                }}
                onCancel={commands.closeTaskComposer}
              />
            )}
          </Stack>
        )}
      </Paper>
    )
  },
)
