import { BoardView } from "@/Boards/Board/BoardView"
import { BoardsQuery } from "@/Boards/BoardsQuery"
import classes from "@/Boards/Boards.module.css"
import { BoardsIndex } from "@/Boards/Index/BoardsIndex"
import { Alert, Loader, Stack } from "@mantine/core"

export default function Boards({
  workspace,
  board,
  task,
}: Boards.Props) {
  const workspaces = BoardsQuery.useWorkspaces()
  const boards = BoardsQuery.useBoards(workspace)
  const aggregate = BoardsQuery.useBoard(workspace, board)

  if (
    workspaces.isLoading ||
    (workspace && boards.isLoading) ||
    (board && aggregate.isLoading)
  ) {
    return <Loader aria-label="Loading Boards" />
  }
  const error = workspaces.error ?? boards.error ?? aggregate.error
  if (error) {
    return (
      <Alert color="red" title="Boards unavailable">
        {error.message}
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
  if (board && !aggregate.data) {
    return (
      <Alert color="yellow" title="Board not found">
        Board is missing or inaccessible.
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
      {aggregate.data ? (
        <BoardView
          key={aggregate.data.board.id}
          aggregate={aggregate.data}
          taskID={task}
        />
      ) : (
        <BoardsIndex
          workspaces={workspaces.data ?? []}
          boards={boards.data ?? []}
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
