import { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import classes from "@/Boards/List/ListView.module.css"
import { TaskRow, type TaskRowCommands } from "@/Boards/List/TaskRow"
import { BoardsQuery } from "@/Boards/BoardsQuery"
import {
  BoardsState,
  useBoardsState,
} from "@/Boards/State/BoardsState"
import { TaskComposer } from "@/Boards/Task/TaskComposer"
import { TaskMovement } from "@/Boards/Task/TaskMovement"
import { BoardIcon } from "@/common/BoardIcon"
import { call } from "@/common/call"
import { useKeyboardShortcuts } from "@/common/useKeyboardShortcuts"
import { Button, Group, Stack, Text, TextInput } from "@mantine/core"
import { useMemo, useRef, useState } from "react"
import {
  PiCheckCircle,
  PiCircleDashed,
  PiMagnifyingGlass,
} from "react-icons/pi"
import type { BoardAggregate } from "shared/models"

export function ListView({ aggregate, onOpen }: ListView.Props) {
  const { workspace, board, phases, tasks } = aggregate
  const state = useBoardsState()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const [editing, setEditing] = useState<number | null>(null)
  const aggregateKey = BoardsQuery.keys.exact.aggregate(
    workspace.slug,
    board.slug,
  )
  const action = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    { invalidateExact: [aggregateKey] },
  )
  const createTask = BoardsQuery.useAction(
    (input: TaskComposer.Input) =>
      call.boards.task.create({
        workspace: workspace.slug,
        board: board.slug,
        ...input,
      }),
    { invalidateExact: [aggregateKey] },
  )
  const move = BoardsQuery.useMoveTask(workspace.slug, board.slug)
  const normalizedSearch = state.listSearch.trim().toLowerCase()
  const visible = tasks.filter((task) => {
    const matchesSearch =
      !normalizedSearch ||
      task.title.toLowerCase().includes(normalizedSearch)
    if (!matchesSearch) return false
    if (state.listProjection === "all") return true
    if (state.listProjection === "incomplete") {
      return !task.complete && task.phase === null
    }
    if (state.listProjection === "complete") return task.complete
    return (
      !task.complete &&
      task.phase === Number(state.listProjection.slice(6))
    )
  })
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
      return move.mutateAsync({
        workspace: workspace.slug,
        board: board.slug,
        task: source,
        destination: { type: "board" },
        ...TaskMovement.anchors(
          visible,
          source,
          index + (target.after ? 1 : 0),
        ),
      })
    },
    sourceClassName: classes.dragSourceActive,
  })
  const dragHandles = useMemo(
    () => new Map(tasks.map(({ id }) => [id, drag.handle(id)])),
    [drag.handle, tasks],
  )
  const commandContext = useRef({
    workspace: workspace.slug,
    board: board.slug,
    tasks,
    onOpen,
    runAction: action.mutateAsync,
    move: move.mutate,
  })
  commandContext.current = {
    workspace: workspace.slug,
    board: board.slug,
    tasks,
    onOpen,
    runAction: action.mutateAsync,
    move: move.mutate,
  }
  const commandRef = useRef<TaskRowCommands | null>(null)
  const commands = (commandRef.current ??= {
    select: BoardsState.selectTask,
    open(taskID) {
      commandContext.current.onOpen(taskID)
    },
    cancelEdit() {
      setEditing(null)
    },
    async saveTitle(taskID, title) {
      const context = commandContext.current
      await context.runAction(() =>
        call.boards.task.update({
          workspace: context.workspace,
          board: context.board,
          task: taskID,
          title,
        }),
      )
      setEditing(null)
    },
    setState(taskID, taskState) {
      const context = commandContext.current
      return context.runAction(() =>
        call.boards.task.update({
          workspace: context.workspace,
          board: context.board,
          task: taskID,
          ...taskState,
        }),
      )
    },
    setComplete(taskID, complete) {
      const context = commandContext.current
      return context.runAction(() =>
        call.boards.task.update({
          workspace: context.workspace,
          board: context.board,
          task: taskID,
          complete,
        }),
      )
    },
    move(taskID, destination) {
      const context = commandContext.current
      context.move({
        workspace: context.workspace,
        board: context.board,
        task: taskID,
        destination,
      })
    },
    step(taskID, direction) {
      const context = commandContext.current
      const index = context.tasks.findIndex(({ id }) => id === taskID)
      if (
        index < 0 ||
        index + direction < 0 ||
        index + direction >= context.tasks.length
      ) {
        return
      }
      context.move({
        workspace: context.workspace,
        board: context.board,
        task: taskID,
        destination: { type: "board" },
        ...TaskMovement.anchors(
          context.tasks,
          taskID,
          index + direction,
        ),
      })
    },
    delete(taskID) {
      const context = commandContext.current
      return context.runAction(() =>
        call.boards.task.delete({
          workspace: context.workspace,
          board: context.board,
          task: taskID,
        }),
      )
    },
  })

  useKeyboardShortcuts([
    {
      key: "n",
      enabled: writable && !state.taskComposerVisible,
      action: () => BoardsState.openTaskComposer(),
    },
    {
      key: "ArrowUp",
      enabled: state.selectedTask !== null && editing === null,
      action: () => selectStep(-1),
    },
    {
      key: "ArrowDown",
      enabled: state.selectedTask !== null && editing === null,
      action: () => selectStep(1),
    },
    {
      key: "Enter",
      enabled: state.selectedTask !== null && editing === null,
      action: () =>
        state.selectedTask !== null && onOpen(state.selectedTask),
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

  function selectStep(direction: -1 | 1) {
    const index = visible.findIndex(
      ({ id }) => id === state.selectedTask,
    )
    const task = visible[index + direction]
    if (task) {
      BoardsState.selectTask(task.id)
      document
        .querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)
        ?.focus()
    }
  }

  return (
    <Stack gap="md">
      <Group align="flex-end" justify="space-between">
        <TextInput
          label="Search tasks"
          leftSection={<PiMagnifyingGlass aria-hidden />}
          value={state.listSearch}
          onChange={(event) =>
            BoardsState.setListSearch(event.currentTarget.value)
          }
          className={classes.listSearch}
        />
        <Button.Group className={classes.phaseFilters}>
          <FilterButton
            active={state.listProjection === "all"}
            label="All"
            onClick={() => BoardsState.setListProjection("all")}
          />
          <FilterButton
            active={state.listProjection === "incomplete"}
            label="Incomplete"
            icon={<PiCircleDashed />}
            onClick={() =>
              BoardsState.setListProjection("incomplete")
            }
          />
          {phases.map((phase) => (
            <FilterButton
              key={phase.id}
              active={state.listProjection === `phase:${phase.id}`}
              label={phase.title}
              icon={
                phase.icon ? (
                  <BoardIcon icon={phase.icon} />
                ) : undefined
              }
              color={phase.color}
              onClick={() =>
                BoardsState.setListProjection(`phase:${phase.id}`)
              }
            />
          ))}
          <FilterButton
            active={state.listProjection === "complete"}
            label="Complete"
            icon={<PiCheckCircle />}
            onClick={() => BoardsState.setListProjection("complete")}
          />
        </Button.Group>
      </Group>
      <Stack gap={0} className={classes.taskList} role="listbox">
        {visible.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            phases={phases}
            writable={writable}
            selected={task.id === state.selectedTask}
            editing={task.id === editing}
            dragHandle={dragHandles.get(task.id)!}
            position={TaskMovement.describePosition(
              index,
              visible.length,
            )}
            commands={commands}
          />
        ))}
        {visible.length === 0 && !state.taskComposerVisible && (
          <Text c="dimmed" ta="center" p="xl">
            No tasks match this view.
          </Text>
        )}
        {state.taskComposerVisible && (
          <TaskComposer
            phases={phases}
            defaultPhase={state.taskComposerPhase}
            creating={createTask.isPending}
            onCreate={createTask.mutateAsync}
            onCreated={(task) => {
              BoardsState.closeTaskComposer()
              BoardsState.selectTask(task.id)
            }}
            onCancel={BoardsState.closeTaskComposer}
          />
        )}
      </Stack>
    </Stack>
  )
}

export namespace ListView {
  export type Props = {
    aggregate: BoardAggregate
    onOpen: (taskID: number) => void
  }
}

function FilterButton({
  active,
  label,
  icon,
  color,
  onClick,
}: FilterButton.Props) {
  return (
    <Button
      size="compact-sm"
      variant={active ? "filled" : "default"}
      leftSection={icon}
      onClick={onClick}
      style={
        color && !active
          ? { color: `var(--mantine-color-${color}-7)` }
          : undefined
      }
    >
      {label}
    </Button>
  )
}

namespace FilterButton {
  export type Props = {
    active: boolean
    label: string
    icon?: React.ReactNode
    color?: string
    onClick: () => void
  }
}

type TaskDrop = {
  task: number
  after: boolean
}
