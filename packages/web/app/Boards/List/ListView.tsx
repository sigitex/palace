// oxlint-disable eslint/complexity
import { usePointerDrag } from "@/Boards/Drag/usePointerDrag"
import classes from "@/Boards/List/ListView.module.css"
import { TaskRow, type TaskRowCommands } from "@/Boards/List/TaskRow"
import { NewTaskEntry } from "@/Boards/Shared/NewTaskEntry"
import scrollbarClasses from "@/Boards/Shared/Scrollbars.module.css"
import { useBoards, useBoardsView } from "@/state"
import { TaskComposer } from "@/Boards/Task/TaskComposer"
import {
  TaskMovement,
  type TaskMove,
} from "@/Boards/Task/TaskMovement"
import { BoardIcon } from "@/common/BoardIcon"
import { useKeyboardShortcuts } from "@/common/useKeyboardShortcuts"
import { Button, Group, Stack, Text, TextInput } from "@mantine/core"
import { useMemo, useRef, useState } from "react"
import { Icon } from "@/common/Icon"
import type { BoardAggregate } from "shared/models"

export function ListView({ aggregate, onOpen }: ListView.Props) {
  const { workspace, board, phases, tasks } = aggregate
  const state = useBoardsView()
  const boards = useBoards()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const [editing, setEditing] = useState<number | null>(null)
  const ws = workspace.slug
  const boardSlug = board.slug
  const latest = useRef({ onOpen })
  latest.current.onOpen = onOpen

  function moveTask(
    task: number,
    destination: TaskMove["destination"],
    anchors: { before?: number | null; after?: number | null } = {},
  ) {
    return boards.moveTask({
      workspace: ws,
      board: boardSlug,
      task,
      destination,
      ...anchors,
    })
  }

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
  const dragHandles = useMemo(
    () => new Map(tasks.map(({ id }) => [id, drag.handle(id)])),
    [drag.handle, taskIdKey],
  )
  const commandRef = useRef<TaskRowCommands | null>(null)
  const commands = (commandRef.current ??= {
    select: (taskID) => state.selectTask(taskID),
    open: (taskID) => latest.current.onOpen(taskID),
    cancelEdit: () => setEditing(null),
    async saveTitle(taskID, title) {
      await boards.updateTask(ws, boardSlug, taskID, { title })
      setEditing(null)
    },
    setState: (taskID, taskState) =>
      boards.updateTask(ws, boardSlug, taskID, taskState),
    setComplete: (taskID, complete) =>
      boards.updateTask(ws, boardSlug, taskID, { complete }),
    move: (taskID, destination) => moveTask(taskID, destination),
    step: (taskID, direction) =>
      boards.stepTask(ws, boardSlug, taskID, direction),
    delete: (taskID) => boards.deleteTask(ws, boardSlug, taskID),
  })

  const LIST_ENTRY = "list"

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

  return (
    <Stack gap="md" className={classes.listView}>
      <Group
        align="flex-end"
        justify="space-between"
        className={classes.listHeader}
      >
        <TextInput
          label="Search tasks"
          leftSection={<Icon name="magnifying-glass" aria-hidden />}
          value={state.listSearch}
          onChange={(event) =>
            state.setListSearch(event.currentTarget.value)
          }
          className={classes.listSearch}
        />
        <Button.Group className={classes.phaseFilters}>
          <FilterButton
            active={state.listProjection === "all"}
            label="All"
            onClick={() => state.setListProjection("all")}
          />
          <FilterButton
            active={state.listProjection === "incomplete"}
            label="Incomplete"
            icon={<Icon name="circle-dashed" />}
            onClick={() => state.setListProjection("incomplete")}
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
                state.setListProjection(`phase:${phase.id}`)
              }
            />
          ))}
          <FilterButton
            active={state.listProjection === "complete"}
            label="Complete"
            icon={<Icon name="check-circle" />}
            onClick={() => state.setListProjection("complete")}
          />
        </Button.Group>
      </Group>
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
                onCreate={(input) =>
                  boards.createTask(ws, boardSlug, input)
                }
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
