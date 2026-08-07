import { path } from "shared/routes"
import type { KeyboardEvent } from "react"
import type { Board, Workspace } from "shared/models"
import { useLocation } from "wouter"

// Arrow-key navigation between the workspace and board panes: up/down move
// within a pane, left/right cross between panes (collapsing to the workspace
// pane on narrow screens), Enter opens, F2 renames, and "n" starts a new draft.
export function useBrowseKeyboard(deps: {
  workspaces: Workspace[]
  boardList: Board[]
  selected: Workspace | undefined
  selectedWorkspace?: string
  palaceAdmin: boolean
  canWrite: boolean
  setDraft: (value: "workspace" | "board" | null) => void
  setRenaming: (value: "workspace" | null) => void
  setRenamingBoard: (value: string | null) => void
}) {
  const {
    workspaces,
    boardList,
    selected,
    selectedWorkspace,
    palaceAdmin,
    canWrite,
    setDraft,
    setRenaming,
    setRenamingBoard,
  } = deps
  const [, navigate] = useLocation()

  function workspaceKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (isEditableTarget(event)) return
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
    if (isEditableTarget(event)) return
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
        sessionStorage.setItem("boards-focus-workspace", selected.slug)
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

  return { workspaceKeys, boardKeys }
}

// True when the event originates from a text field, so navigation keys should
// yield to normal typing.
function isEditableTarget(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.isContentEditable
  )
}
