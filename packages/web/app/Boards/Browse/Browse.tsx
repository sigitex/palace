// oxlint-disable eslint/complexity
import classes from "@/Boards/Browse/Browse.module.css"
import { WorkspaceDrawer } from "@/Boards/Browse/WorkspaceDrawer"
import { BoardIcon } from "@/common/BoardIcon"
import { useBoards, useBoardsView, useSession } from "@/state"
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useEffect, useState, type KeyboardEvent } from "react"
import { Icon } from "@/common/Icon"
import { useLocation } from "wouter"
import { path } from "shared/routes"
import type { Board, Workspace } from "shared/models"

export default function Browse({
  workspaces,
  boardList,
  selectedWorkspace,
}: Browse.Props) {
  const [, navigate] = useLocation()
  const session = useSession()
  const boards = useBoards()
  const view = useBoardsView()
  const [workspaceSettings, setWorkspaceSettings] = useState(false)
  const [draft, setDraft] = useState<"workspace" | "board" | null>(
    null,
  )
  const [renaming, setRenaming] = useState<"workspace" | null>(null)
  const [renamingBoard, setRenamingBoard] = useState<string | null>(
    null,
  )
  const selected = workspaces.find(
    ({ slug }) => slug === selectedWorkspace,
  )
  const palaceAdmin =
    session.data?.groups.includes("palace-admins") ?? false
  const canWrite =
    selected?.access === "write" || selected?.access === "manage"
  const canManage = selected?.access === "manage"
  useEffect(() => {
    view.setBoard(null)
  }, [])

  useEffect(() => {
    const workspace = sessionStorage.getItem("boards-focus-workspace")
    const pane = sessionStorage.getItem("boards-focus-pane")
    if (workspace && !selectedWorkspace) {
      sessionStorage.removeItem("boards-focus-workspace")
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            `[data-workspace="${workspace}"]`,
          )
          ?.focus(),
      )
    }
    if (pane === "board" && selected && boardList.length > 0) {
      sessionStorage.removeItem("boards-focus-pane")
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[data-board]")?.focus(),
      )
    }
  }, [boardList, selected, selectedWorkspace])

  function workspaceKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (typing(event)) return
    const target = event.target as HTMLElement
    const focusedSlug = target.closest<HTMLElement>(
      "[data-workspace]",
    )?.dataset.workspace
    const current = Math.max(
      0,
      workspaces.findIndex(
        ({ slug }) => slug === (focusedSlug ?? selectedWorkspace),
      ),
    )
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const delta = event.key === "ArrowDown" ? 1 : -1
      const next =
        workspaces[
          Math.max(
            0,
            Math.min(workspaces.length - 1, current + delta),
          )
        ]
      if (next) navigate(path.boards.workspace(next.slug))
    } else if (event.key === "ArrowRight" && focusedSlug) {
      event.preventDefault()
      sessionStorage.setItem("boards-focus-pane", "board")
      if (focusedSlug === selectedWorkspace && boardList.length > 0) {
        sessionStorage.removeItem("boards-focus-pane")
        document.querySelector<HTMLElement>("[data-board]")?.focus()
      } else {
        navigate(path.boards.workspace(focusedSlug))
      }
    } else if (event.key === "Enter" && focusedSlug) {
      navigate(path.boards.workspace(focusedSlug))
    } else if (event.key === "F2" && selected?.palace_admin) {
      event.preventDefault()
      setRenaming("workspace")
    } else if (event.key.toLowerCase() === "n" && palaceAdmin) {
      event.preventDefault()
      setDraft("workspace")
    }
  }

  function boardKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (typing(event)) return
    const target = event.target as HTMLElement
    const currentSlug =
      target.closest<HTMLElement>("[data-board]")?.dataset.board
    const current = Math.max(
      0,
      boardList.findIndex(({ slug }) => slug === currentSlug),
    )
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const delta = event.key === "ArrowDown" ? 1 : -1
      const next =
        boardList[
          Math.max(0, Math.min(boardList.length - 1, current + delta))
        ]
      if (next) {
        document
          .querySelector<HTMLElement>(`[data-board="${next.slug}"]`)
          ?.focus()
      }
    } else if (event.key === "ArrowLeft" && selected) {
      event.preventDefault()
      if (globalThis.matchMedia("(max-width: 47.99em)").matches) {
        sessionStorage.setItem(
          "boards-focus-workspace",
          selected.slug,
        )
        navigate(path.boards.index)
      } else {
        document
          .querySelector<HTMLElement>(
            `[data-workspace="${selected.slug}"]`,
          )
          ?.focus()
      }
    } else if (event.key === "Enter" && currentSlug && selected) {
      navigate(path.boards.board(selected.slug, currentSlug))
    } else if (event.key === "F2" && currentSlug && canWrite) {
      event.preventDefault()
      setRenamingBoard(currentSlug)
    } else if (event.key.toLowerCase() === "n" && canWrite) {
      event.preventDefault()
      setDraft("board")
    }
  }

  return (
    <>
      <div
        className={`${classes.index} ${selected ? classes.hasWorkspace : ""}`}
      >
        <Stack
          className={classes.workspacePane}
          gap="xs"
          onKeyDown={workspaceKeys}
        >
          <Group justify="space-between">
            <Title order={2}>Workspaces</Title>
            {palaceAdmin && (
              <ActionIcon
                aria-label="New workspace"
                onClick={() => setDraft("workspace")}
              >
                <Icon name="plus" />
              </ActionIcon>
            )}
          </Group>
          {workspaces.length === 0 && (
            <Text c="dimmed">No readable workspaces.</Text>
          )}
          {workspaces.map((workspace) => (
            <ResourceButton
              key={workspace.id}
              resource={workspace}
              selected={workspace.slug === selectedWorkspace}
              dataWorkspace={workspace.slug}
              onOpen={() =>
                navigate(path.boards.workspace(workspace.slug))
              }
            />
          ))}
          {draft === "workspace" && (
            <InlineName
              label="Workspace name"
              onCancel={() => setDraft(null)}
              onSave={async (name) => {
                const slug = slugify(name)
                await boards.createWorkspace({
                  name,
                  slug,
                  color: null,
                  icon: null,
                  manager_group: 2,
                })
                setDraft(null)
                navigate(path.boards.workspace(slug))
              }}
            />
          )}
          {renaming === "workspace" && selected && (
            <InlineName
              label="Workspace name"
              initial={selected.name}
              onCancel={() => setRenaming(null)}
              onSave={async (name) => {
                await boards.updateWorkspace(selected.slug, {
                  name,
                  slug: selected.slug,
                  color: selected.color,
                  icon: selected.icon,
                })
                setRenaming(null)
              }}
            />
          )}
        </Stack>

        <Stack
          className={classes.boardPane}
          gap="xs"
          onKeyDown={boardKeys}
        >
          <Group justify="space-between">
            <Group gap="xs">
              <Button
                className={classes.mobileBack}
                variant="subtle"
                leftSection={<Icon name="arrow-left" />}
                onClick={() => navigate(path.boards.index)}
              >
                Workspaces
              </Button>
              <Title order={2}>{selected?.name ?? "Boards"}</Title>
            </Group>
            <Group gap="xs">
              {canWrite && (
                <ActionIcon
                  aria-label="New board"
                  onClick={() => setDraft("board")}
                >
                  <Icon name="plus" />
                </ActionIcon>
              )}
              {canManage && (
                <ActionIcon
                  aria-label="Workspace settings"
                  onClick={() => setWorkspaceSettings(true)}
                >
                  <Icon name="gear" />
                </ActionIcon>
              )}
            </Group>
          </Group>
          {!selected && <Text c="dimmed">Select a workspace.</Text>}
          {selected && boardList.length === 0 && (
            <Text c="dimmed">No boards in this workspace.</Text>
          )}
          {selected &&
            boardList.map((board) =>
              renamingBoard === board.slug ? (
                <InlineName
                  key={board.id}
                  label="Board name"
                  initial={board.name}
                  onCancel={() => setRenamingBoard(null)}
                  onSave={async (name) => {
                    await boards.updateBoard(
                      selected.slug,
                      board.slug,
                      {
                        name,
                        slug: board.slug,
                        color: board.color,
                        icon: board.icon,
                      },
                    )
                    setRenamingBoard(null)
                  }}
                />
              ) : (
                <ResourceButton
                  key={board.id}
                  resource={board}
                  dataBoard={board.slug}
                  tinted
                  onOpen={() =>
                    navigate(
                      path.boards.board(selected.slug, board.slug),
                    )
                  }
                />
              ),
            )}
          {draft === "board" && selected && (
            <InlineName
              label="Board name"
              onCancel={() => setDraft(null)}
              onSave={async (name) => {
                const slug = slugify(name)
                await boards.createBoard(selected.slug, {
                  name,
                  slug,
                  color: null,
                  icon: null,
                })
                setDraft(null)
                navigate(path.boards.board(selected.slug, slug))
              }}
            />
          )}
        </Stack>
      </div>
      {selected && (
        <WorkspaceDrawer
          workspace={selected}
          opened={workspaceSettings}
          onClose={() => setWorkspaceSettings(false)}
        />
      )}
    </>
  )
}

export namespace Browse {
  export type Props = {
    workspaces: Workspace[]
    boardList: Board[]
    selectedWorkspace?: string
  }
}

function ResourceButton({
  resource,
  selected = false,
  dataBoard,
  dataWorkspace,
  tinted = false,
  onOpen,
}: {
  resource: Workspace | Board
  selected?: boolean
  dataBoard?: string
  dataWorkspace?: string
  tinted?: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      className={`${classes.resource} ${selected ? classes.selected : ""} ${tinted ? classes.resourceTinted : ""}`}
      style={
        {
          "--resource-color": resource.color
            ? `var(--mantine-color-${resource.color}-6)`
            : undefined,
          "--resource-background": resource.color
            ? `var(--mantine-color-${resource.color}-light)`
            : undefined,
        } as React.CSSProperties
      }
      data-board={dataBoard}
      data-workspace={dataWorkspace}
      onClick={onOpen}
      onDoubleClick={onOpen}
    >
      <Group wrap="nowrap">
        {resource.icon && (
          <BoardIcon
            icon={resource.icon}
            color={
              resource.color
                ? `var(--mantine-color-${resource.color}-6)`
                : undefined
            }
            aria-hidden
          />
        )}
        <Text className={classes.resourceTitle} fw={600}>
          {resource.name}
        </Text>
      </Group>
    </button>
  )
}

function InlineName({
  label,
  initial = "",
  onSave,
  onCancel,
}: {
  label: string
  initial?: string
  onSave: (name: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial)
  return (
    <TextInput
      autoFocus
      aria-label={label}
      value={name}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setName(event.currentTarget.value)}
      onKeyDown={async (event) => {
        if (event.key === "Escape") onCancel()
        if (event.key === "Enter" && name.trim())
          await onSave(name.trim())
      }}
    />
  )
}

function typing(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.isContentEditable
  )
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
