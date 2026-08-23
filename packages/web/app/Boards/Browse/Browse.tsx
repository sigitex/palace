import { BoardPane } from "@/Boards/Browse/BoardPane"
import classes from "@/Boards/Browse/Browse.module.css"
import { useBrowseKeyboard } from "@/Boards/Browse/useBrowseKeyboard"
import { WorkspacePane } from "@/Boards/Browse/WorkspacePane"
import { WorkspaceDrawer } from "@/Boards/Browse/WorkspaceDrawer"
import { useBoardsView, useSession } from "@/state"
import { useEffect, useState } from "react"
import type { Board, Workspace } from "shared/models"

type Props = {
  workspaces: Workspace[]
  boardList: Board[]
  selectedWorkspace?: string
}

export default function Browse({
  workspaces,
  boardList,
  selectedWorkspace,
}: Props) {
  const session = useSession()
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
  const { workspaceKeys, boardKeys } = useBrowseKeyboard({
    workspaces,
    boardList,
    selected,
    selectedWorkspace,
    palaceAdmin,
    canWrite,
    setDraft,
    setRenaming,
    setRenamingBoard,
  })

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

  return (
    <>
      <div
        className={`${classes.index} ${selected ? classes.hasWorkspace : ""}`}
      >
        <WorkspacePane
          workspaces={workspaces}
          selected={selected}
          selectedWorkspace={selectedWorkspace}
          palaceAdmin={palaceAdmin}
          draft={draft}
          renaming={renaming}
          onKeyDown={workspaceKeys}
          setDraft={setDraft}
          setRenaming={setRenaming}
        />
        <BoardPane
          boardList={boardList}
          selected={selected}
          canWrite={canWrite}
          canManage={canManage}
          draft={draft}
          renamingBoard={renamingBoard}
          onKeyDown={boardKeys}
          setDraft={setDraft}
          setRenamingBoard={setRenamingBoard}
          onOpenSettings={() => setWorkspaceSettings(true)}
        />
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
