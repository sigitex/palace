import Board from "@/Boards/Board"
import classes from "@/Boards/Boards.module.css"
import Browse from "@/Boards/Browse"
import { useBoardData } from "@/Boards/useBoardData"
import { Alert, Loader, Stack } from "@mantine/core"

export default function Boards({
  workspace,
  board,
  task,
}: Boards.Props) {
  const data = useBoardData(workspace, board, task)

  if (data.status === "loading") {
    return <Loader aria-label="Loading Boards" />
  }
  if (data.status === "error") {
    return (
      <Alert color="red" title="Boards unavailable">
        {data.message}
      </Alert>
    )
  }
  if (data.status === "workspace-not-found") {
    return (
      <Alert color="yellow" title="Workspace not found">
        Workspace is missing or inaccessible.
      </Alert>
    )
  }
  if (data.status === "invalid-task") {
    return (
      <Alert color="yellow" title="Task not found">
        Task ID is invalid.
      </Alert>
    )
  }

  return (
    <Stack className={classes.page}>
      {data.board ? (
        <Board
          key={data.board.board.id}
          aggregate={data.board}
          taskID={task}
        />
      ) : (
        <Browse
          workspaces={data.workspaces}
          boardList={data.boardList}
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
