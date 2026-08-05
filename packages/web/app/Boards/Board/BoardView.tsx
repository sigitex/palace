import { BoardDrawer } from "@/Boards/Board/BoardDrawer"
import classes from "@/Boards/Board/BoardView.module.css"
import { ListView } from "@/Boards/List/ListView"
import { PhasesView } from "@/Boards/Phases/PhasesView"
import {
  BoardsState,
  useBoardsState,
} from "@/Boards/State/BoardsState"
import { TaskDrawer } from "@/Boards/Task/TaskDrawer"
import { BoardIcon } from "@/common/BoardIcon"
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Tabs,
  Title,
} from "@mantine/core"
import { useCallback, useEffect, useState } from "react"
import { PiGear, PiPlus } from "react-icons/pi"
import { useLocation } from "wouter"
import { BoardsPath } from "shared/BoardsPath"
import type { BoardAggregate, BoardTask } from "shared/models"

export function BoardView({ aggregate, taskID }: BoardView.Props) {
  const { board, workspace, tasks } = aggregate
  const [, navigate] = useLocation()
  const [boardID] = useState(() => {
    BoardsState.setBoard(board.id, initialSelection(tasks))
    return board.id
  })
  const state = useBoardsState()
  const [settings, setSettings] = useState(false)
  const writable =
    workspace.access === "write" || workspace.access === "manage"

  useEffect(() => {
    if (
      state.selectedTask !== null &&
      !tasks.some(({ id }) => id === state.selectedTask)
    ) {
      BoardsState.selectTask(tasks[0]?.id ?? null)
    }
  }, [state.selectedTask, tasks])

  useEffect(() => {
    if (taskID === undefined && state.selectedTask !== null) {
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(
            `[data-task-id="${state.selectedTask}"]`,
          )
          ?.focus()
      })
    }
  }, [state.selectedTask, taskID])

  const openTask = useCallback(
    (id: number) => {
      BoardsState.selectTask(id)
      navigate(BoardsPath.task(workspace.slug, board.slug, id), {
        state: { boardsTaskOrigin: true },
      })
    },
    [board.slug, navigate, workspace.slug],
  )

  return (
    <Stack className={classes.boardShell} key={boardID} gap={0}>
      <Group
        justify="space-between"
        align="flex-start"
        className={classes.boardHeader}
        style={
          {
            "--board-color": board.color
              ? `var(--mantine-color-${board.color}-6)`
              : undefined,
            "--board-background": board.color
              ? `var(--mantine-color-${board.color}-light)`
              : undefined,
          } as React.CSSProperties
        }
      >
        <Group wrap="nowrap">
          {board.icon && (
            <BoardIcon
              icon={board.icon}
              size="2rem"
              color={
                board.color
                  ? `var(--mantine-color-${board.color}-6)`
                  : undefined
              }
            />
          )}
          <Title order={1}>{board.name}</Title>
        </Group>
        <Group>
          {writable && (
            <Button
              leftSection={<PiPlus />}
              onClick={() => BoardsState.openTaskComposer()}
            >
              Add task
            </Button>
          )}
          {writable && (
            <ActionIcon
              aria-label="Board settings"
              size="lg"
              onClick={() => setSettings(true)}
            >
              <PiGear />
            </ActionIcon>
          )}
        </Group>
      </Group>
      <Tabs
        className={classes.boardViews}
        value={state.mode}
        onChange={(value) =>
          value && BoardsState.setMode(value as "list" | "phases")
        }
        keepMounted={false}
        variant="outline"
      >
        <Tabs.List
          className={classes.boardTabs}
          aria-label="Board view"
        >
          <Tabs.Tab value="list">List</Tabs.Tab>
          <Tabs.Tab value="phases">Phases</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel
          value="list"
          pt="md"
          className={classes.listPanel}
          data-drag-scroll
        >
          <ListView aggregate={aggregate} onOpen={openTask} />
        </Tabs.Panel>
        <Tabs.Panel
          value="phases"
          pt="md"
          className={classes.phasesPanel}
        >
          <PhasesView aggregate={aggregate} onOpen={openTask} />
        </Tabs.Panel>
      </Tabs>

      {writable && (
        <BoardDrawer
          aggregate={aggregate}
          opened={settings}
          onClose={() => setSettings(false)}
        />
      )}
      {taskID !== undefined && (
        <TaskDrawer
          aggregate={aggregate}
          taskID={taskID}
          onDeleted={(deleted) => {
            const index = tasks.findIndex(({ id }) => id === deleted)
            BoardsState.selectTask(
              tasks[index + 1]?.id ?? tasks[index - 1]?.id ?? null,
            )
          }}
        />
      )}
    </Stack>
  )
}

export namespace BoardView {
  export type Props = {
    aggregate: BoardAggregate
    taskID?: number
  }
}

function initialSelection(tasks: BoardTask[]) {
  const stored = Number(sessionStorage.getItem("boards-focus-task"))
  sessionStorage.removeItem("boards-focus-task")
  return tasks.some(({ id }) => id === stored)
    ? stored
    : (tasks[0]?.id ?? null)
}
