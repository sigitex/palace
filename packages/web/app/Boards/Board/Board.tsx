import { BoardDrawer } from "@/Boards/Board/BoardDrawer"
import classes from "@/Boards/Board/Board.module.css"
import List from "@/Boards/List"
import Phases from "@/Boards/Phases"
import { TaskDrawer } from "@/Boards/Task/TaskDrawer"
import { BoardIcon } from "@/common/BoardIcon"
import { useBoardsView } from "@/state"
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Tabs,
  Title,
} from "@mantine/core"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"
import { Icon } from "@/common/Icon"
import { useLocation } from "wouter"
import { path } from "shared/routes"
import type { BoardAggregate, BoardTask } from "shared/models"

export default function Board({ aggregate, taskID }: Board.Props) {
  const { board, workspace, tasks } = aggregate
  const [, navigate] = useLocation()
  const boardID = board.id
  const state = useBoardsView()
  const [settings, setSettings] = useState(false)
  const writable =
    workspace.access === "write" || workspace.access === "manage"

  useLayoutEffect(() => {
    state.setBoard(board.id, initialSelection(tasks))
  }, [])

  useEffect(() => {
    if (state.selectedTask !== null) {
      if (!tasks.some(({ id }) => id === state.selectedTask)) {
        if (!state.pendingTaskIds.includes(state.selectedTask)) {
          state.selectTask(tasks[0]?.id ?? null)
        }
      } else if (state.pendingTaskIds.includes(state.selectedTask)) {
        state.clearPendingTask(state.selectedTask)
      }
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
      state.selectTask(id)
      navigate(path.boards.task(workspace.slug, board.slug, id), {
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
              leftSection={<Icon name="plus" />}
              onClick={() => state.openTaskComposer()}
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
              <Icon name="gear" />
            </ActionIcon>
          )}
        </Group>
      </Group>
      <Tabs
        className={classes.boardViews}
        value={state.mode}
        onChange={(value) =>
          value && state.setMode(value as "list" | "phases")
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
        >
          <List aggregate={aggregate} onOpen={openTask} />
        </Tabs.Panel>
        <Tabs.Panel
          value="phases"
          pt="md"
          className={classes.phasesPanel}
        >
          <Phases aggregate={aggregate} onOpen={openTask} />
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
            state.selectTask(
              tasks[index + 1]?.id ?? tasks[index - 1]?.id ?? null,
            )
          }}
        />
      )}
    </Stack>
  )
}

export namespace Board {
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
