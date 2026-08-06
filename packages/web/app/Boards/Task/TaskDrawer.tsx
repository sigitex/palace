import classes from "@/Boards/Task/TaskDrawer.module.css"
import { useBoards } from "@/state"
import { DeletePopover } from "@/Boards/Shared/DeletePopover"
import { TaskStateSelector } from "@/Boards/Task/TaskStateSelector"
import {
  Button,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core"
import { useEffect, useState } from "react"
import { Icon } from "@/common/Icon"
import ReactMarkdown from "react-markdown"
import { useLocation } from "wouter"
import { BoardsPath } from "shared/BoardsPath"
import type { BoardAggregate, BoardTask } from "shared/models"

// oxlint-disable-next-line eslint/complexity
export function TaskDrawer({
  aggregate,
  taskID,
  onDeleted,
}: TaskDrawer.Props) {
  const { workspace, board, phases, tasks } = aggregate
  const task = tasks.find(({ id }) => id === taskID)
  const boards = useBoards()
  const [, navigate] = useLocation()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const [title, setTitle] = useState(task?.title ?? "")
  const [details, setDetails] = useState(task?.details ?? "")
  const [phase, setPhase] = useState<number | null>(
    task?.phase ?? null,
  )
  const [complete, setComplete] = useState(task?.complete ?? false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const dirty = task
    ? title !== task.title ||
      details !== task.details ||
      phase !== task.phase ||
      complete !== task.complete
    : false

  useEffect(() => {
    reset(task)
  }, [task])

  function reset(current: BoardTask | undefined) {
    setTitle(current?.title ?? "")
    setDetails(current?.details ?? "")
    setPhase(current?.phase ?? null)
    setComplete(current?.complete ?? false)
    setEditingDetails(false)
  }

  function close() {
    sessionStorage.setItem("boards-focus-task", String(taskID))
    if (globalThis.history.state?.boardsTaskOrigin) {
      globalThis.history.back()
    } else {
      navigate(BoardsPath.board(workspace.slug, board.slug), {
        replace: true,
      })
    }
  }

  async function save(current: BoardTask) {
    setSaving(true)
    try {
      await boards.updateTask(
        workspace.slug,
        board.slug,
        current.id,
        {
          title: title.trim(),
          details,
          complete,
          phase,
        },
      )
      setEditingDetails(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      opened
      onClose={close}
      position="right"
      size="xl"
      title={task ? board.name : "Task not found"}
    >
      {!task ? (
        <Text c="dimmed">Task does not belong to this board.</Text>
      ) : (
        <Stack className={classes.taskNotebook} gap="lg">
          <Stack gap="xs">
            <Text
              size="xs"
              c="dimmed"
              tt="uppercase"
              fw={700}
              lts="0.08em"
            >
              Task #{task.id} / {task.creator.name}
            </Text>
            {writable ? (
              <Textarea
                aria-label="Task title"
                className={classes.notebookTitle}
                variant="unstyled"
                autosize
                minRows={1}
                maxRows={3}
                value={title}
                onChange={(event) =>
                  setTitle(event.currentTarget.value)
                }
              />
            ) : (
              <Title order={1}>{task.title}</Title>
            )}
            <TaskStateSelector
              phases={phases}
              task={{ ...task, complete, phase }}
              writable={writable}
              onChange={(state) => {
                setComplete(state.complete)
                setPhase(state.phase)
              }}
            />
          </Stack>

          <Divider />

          <Stack gap="md" className={classes.notebookDocument}>
            <Group justify="space-between">
              <Title order={3}>Details</Title>
              {writable && (
                <Button
                  size="compact-sm"
                  variant="subtle"
                  leftSection={<Icon name="note-pencil" />}
                  onClick={() => setEditingDetails((value) => !value)}
                >
                  {editingDetails ? "Preview" : "Edit details"}
                </Button>
              )}
            </Group>
            {editingDetails ? (
              <Textarea
                autoFocus
                aria-label="Task details"
                className={classes.notebookEditor}
                variant="unstyled"
                minRows={14}
                autosize
                value={details}
                onChange={(event) =>
                  setDetails(event.currentTarget.value)
                }
              />
            ) : details ? (
              <div className={classes.markdownDocument}>
                <ReactMarkdown>{details}</ReactMarkdown>
              </div>
            ) : (
              <Text c="dimmed" fs="italic">
                No details yet.
              </Text>
            )}
          </Stack>

          {writable && dirty && (
            <Group
              className={classes.dirtyActions}
              justify="space-between"
            >
              <Text size="sm" fw={600}>
                Unsaved changes
              </Text>
              <Group gap="xs">
                <Button variant="subtle" onClick={() => reset(task)}>
                  Discard
                </Button>
                <Button
                  variant="filled"
                  loading={saving}
                  disabled={!title.trim()}
                  onClick={() => save(task)}
                >
                  Save task
                </Button>
              </Group>
            </Group>
          )}

          {writable && (
            <DeletePopover
              label={`task “${task.title}”`}
              onDelete={async () => {
                await boards.deleteTask(
                  workspace.slug,
                  board.slug,
                  task.id,
                )
                onDeleted(task.id)
                close()
              }}
            >
              <Button
                className={classes.notebookDelete}
                color="red"
                variant="subtle"
                leftSection={<Icon name="trash" />}
              >
                Delete task
              </Button>
            </DeletePopover>
          )}
        </Stack>
      )}
    </Drawer>
  )
}

export namespace TaskDrawer {
  export type Props = {
    aggregate: BoardAggregate
    taskID: number
    onDeleted: (taskID: number) => void
  }
}
