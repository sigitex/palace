import { useBoards } from "@/state";
import { useEffect } from "react";
import type { Workspace } from "shared/models";

// Loads the workspace list, the selected workspace's boards, and the selected
// board's aggregate as the route params change, then reduces the combined
// loading/error/validation state into a single result the page can switch on.
export function useBoardData(
  workspace?: string,
  board?: string,
  task?: number,
) {
  const boards = useBoards()
  const { workspaces, boards: boardList, aggregate } = boards

  useEffect(() => {
    boards.loadWorkspaces()
  }, [])

  useEffect(() => {
    if (workspace) {
      boards.loadBoards(workspace)
    }
  }, [workspace])

  useEffect(() => {
    if (workspace && board) {
      boards.loadAggregate(workspace, board)
    } else {
      boards.clearAggregate()
    }
  }, [workspace, board])

  const boardData = matchBoard(aggregate.data, workspace, board)
  const error = workspaces.error ?? boardList.error ?? aggregate.error

  if (error) {
    return { status: "error", message: error }
  }
  if (
    loading({
      workspaces,
      boardList,
      workspace,
      board,
      boardReady: boardData !== null,
    })
  ) {
    return { status: "loading" }
  }
  if (workspace && !hasWorkspace(workspaces.data, workspace)) {
    return { status: "workspace-not-found" }
  }
  if (!validTask(task)) {
    return { status: "invalid-task" }
  }
  return {
    status: "ready",
    board: boardData,
    workspaces: workspaces.data ?? [],
    boardList: boardList.data ?? [],
  }
}

// The loaded aggregate, but only when it belongs to the requested board.
function matchBoard<
  T extends { board: { slug: string }; workspace: { slug: string } },
>(data: T | null | undefined, workspace?: string, board?: string): T | null {
  return data &&
    data.board.slug === board &&
    data.workspace.slug === workspace
    ? data
    : null
}

function loading(state: {
  workspaces: { loading: boolean }
  boardList: { loading: boolean }
  workspace?: string
  board?: string
  boardReady: boolean
}): boolean {
  return (
    state.workspaces.loading ||
    (!!state.workspace && state.boardList.loading) ||
    (!!state.board && !state.boardReady)
  )
}

function hasWorkspace(
  workspaces: Workspace[] | null,
  slug: string,
): boolean {
  return (
    workspaces?.some((workspace) => workspace.slug === slug) ?? false
  )
}

function validTask(task?: number): boolean {
  return task === undefined || (Number.isInteger(task) && task >= 0)
}
