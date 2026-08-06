// oxlint-disable eslint/complexity
import { BoardView } from "@/Boards/Board/BoardView"
import classes from "@/Boards/Boards.module.css"
import { BoardsIndex } from "@/Boards/Index/BoardsIndex"
import { useBoards } from "@/state"
import { Alert, Loader, Stack } from "@mantine/core"
import { useEffect } from "react"

export default function Boards({
  workspace,
  board,
  task,
}: Boards.Props) {
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

  const boardData =
    aggregate.data?.board.slug === board &&
    aggregate.data?.workspace.slug === workspace
      ? aggregate.data
      : null

  const error = workspaces.error ?? boardList.error ?? aggregate.error
  if (
    !error &&
    (workspaces.loading ||
      (workspace && boardList.loading) ||
      (board && !boardData))
  ) {
    return <Loader aria-label="Loading Boards" />
  }
  if (error) {
    return (
      <Alert color="red" title="Boards unavailable">
        {error}
      </Alert>
    )
  }
  if (
    workspace &&
    !workspaces.data?.some(({ slug }) => slug === workspace)
  ) {
    return (
      <Alert color="yellow" title="Workspace not found">
        Workspace is missing or inaccessible.
      </Alert>
    )
  }
  if (task !== undefined && (!Number.isInteger(task) || task < 0)) {
    return (
      <Alert color="yellow" title="Task not found">
        Task ID is invalid.
      </Alert>
    )
  }

  return (
    <Stack className={classes.page}>
      {boardData ? (
        <BoardView
          key={boardData.board.id}
          aggregate={boardData}
          taskID={task}
        />
      ) : (
        <BoardsIndex
          workspaces={workspaces.data ?? []}
          boardList={boardList.data ?? []}
          selectedWorkspace={workspace}
        />
      )}
    </Stack>
  )
}

export namespace Boards {
  export type Props = {
    workspace?: string
    board?: string
    task?: number
  }
}
