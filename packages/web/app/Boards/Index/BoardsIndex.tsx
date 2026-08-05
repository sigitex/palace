// oxlint-disable eslint/complexity
import { BoardsQuery } from "@/Boards/BoardsQuery"
import classes from "@/Boards/Index/BoardsIndex.module.css"
import { WorkspaceDrawer } from "@/Boards/Index/WorkspaceDrawer"
import { BoardsState } from "@/Boards/State/BoardsState"
import { BoardIcon } from "@/common/BoardIcon"
import { call } from "@/common/call"
import { useSession } from "@/state"
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
import { PiArrowLeft, PiGear, PiPlus } from "react-icons/pi"
import { useLocation } from "wouter"
import { BoardsPath } from "shared/BoardsPath"
import type { Board, Workspace } from "shared/models"

export function BoardsIndex({
  workspaces,
  boards,
  selectedWorkspace,
}: BoardsIndex.Props) {
  const [, navigate] = useLocation()
  const session = useSession()
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
  const workspaceAction = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    {
      invalidateExact: [BoardsQuery.keys.exact.workspaces],
      invalidatePrefix: selected
        ? [BoardsQuery.keys.prefix.aggregates(selected.slug)]
        : [],
    },
  )
  const boardListAction = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    {
      invalidateExact: [
        BoardsQuery.keys.exact.boards(selectedWorkspace ?? ""),
      ],
    },
  )
  const boardUpdateAction = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    {
      invalidateExact: [
        BoardsQuery.keys.exact.boards(selectedWorkspace ?? ""),
        BoardsQuery.keys.exact.aggregate(
          selectedWorkspace ?? "",
          renamingBoard ?? "",
        ),
      ],
    },
  )

  useEffect(() => {
    BoardsState.setBoard(null)
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
    if (pane === "board" && selected && boards.length > 0) {
      sessionStorage.removeItem("boards-focus-pane")
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[data-board]")?.focus(),
      )
    }
  }, [boards, selected, selectedWorkspace])

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
      if (next) navigate(BoardsPath.workspace(next.slug))
    } else if (event.key === "ArrowRight" && focusedSlug) {
      event.preventDefault()
      sessionStorage.setItem("boards-focus-pane", "board")
      if (focusedSlug === selectedWorkspace && boards.length > 0) {
        sessionStorage.removeItem("boards-focus-pane")
        document.querySelector<HTMLElement>("[data-board]")?.focus()
      } else {
        navigate(BoardsPath.workspace(focusedSlug))
      }
    } else if (event.key === "Enter" && focusedSlug) {
      navigate(BoardsPath.workspace(focusedSlug))
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
      boards.findIndex(({ slug }) => slug === currentSlug),
    )
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const delta = event.key === "ArrowDown" ? 1 : -1
      const next =
        boards[
          Math.max(0, Math.min(boards.length - 1, current + delta))
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
        navigate(BoardsPath.index)
      } else {
        document
          .querySelector<HTMLElement>(
            `[data-workspace="${selected.slug}"]`,
          )
          ?.focus()
      }
    } else if (event.key === "Enter" && currentSlug && selected) {
      navigate(BoardsPath.board(selected.slug, currentSlug))
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
                <PiPlus />
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
                navigate(BoardsPath.workspace(workspace.slug))
              }
            />
          ))}
          {draft === "workspace" && (
            <InlineName
              label="Workspace name"
              onCancel={() => setDraft(null)}
              onSave={async (name) => {
                const slug = slugify(name)
                await workspaceAction.mutateAsync(() =>
                  call.boards.workspace.create({
                    name,
                    slug,
                    color: null,
                    icon: null,
                    manager_group: 2,
                  }),
                )
                setDraft(null)
                navigate(BoardsPath.workspace(slug))
              }}
            />
          )}
          {renaming === "workspace" && selected && (
            <InlineName
              label="Workspace name"
              initial={selected.name}
              onCancel={() => setRenaming(null)}
              onSave={async (name) => {
                await workspaceAction.mutateAsync(() =>
                  call.boards.workspace.update({
                    workspace: selected.slug,
                    name,
                    slug: selected.slug,
                    color: selected.color,
                    icon: selected.icon,
                  }),
                )
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
                leftSection={<PiArrowLeft />}
                onClick={() => navigate(BoardsPath.index)}
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
                  <PiPlus />
                </ActionIcon>
              )}
              {canManage && (
                <ActionIcon
                  aria-label="Workspace settings"
                  onClick={() => setWorkspaceSettings(true)}
                >
                  <PiGear />
                </ActionIcon>
              )}
            </Group>
          </Group>
          {!selected && <Text c="dimmed">Select a workspace.</Text>}
          {selected && boards.length === 0 && (
            <Text c="dimmed">No boards in this workspace.</Text>
          )}
          {selected &&
            boards.map((board) =>
              renamingBoard === board.slug ? (
                <InlineName
                  key={board.id}
                  label="Board name"
                  initial={board.name}
                  onCancel={() => setRenamingBoard(null)}
                  onSave={async (name) => {
                    await boardUpdateAction.mutateAsync(() =>
                      call.boards.board.update({
                        workspace: selected.slug,
                        board: board.slug,
                        name,
                        slug: board.slug,
                        color: board.color,
                        icon: board.icon,
                      }),
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
                      BoardsPath.board(selected.slug, board.slug),
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
                await boardListAction.mutateAsync(() =>
                  call.boards.board.create({
                    workspace: selected.slug,
                    name,
                    slug,
                    color: null,
                    icon: null,
                  }),
                )
                setDraft(null)
                navigate(BoardsPath.board(selected.slug, slug))
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

export namespace BoardsIndex {
  export type Props = {
    workspaces: Workspace[]
    boards: Board[]
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
