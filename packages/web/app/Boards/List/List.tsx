import { FilterBar } from "@/Boards/List/FilterBar"
import classes from "@/Boards/List/List.module.css"
import { TaskList } from "@/Boards/List/TaskList"
import { useListActions } from "@/Boards/List/useListActions"
import { useListCommands } from "@/Boards/List/useListCommands"
import { useListDrag } from "@/Boards/List/useListDrag"
import { useListKeyboard } from "@/Boards/List/useListKeyboard"
import { visibleTasks } from "@/Boards/List/visibleTasks"
import { useBoardsView } from "@/state"
import { Stack } from "@mantine/core"
import { useState } from "react"
import type { BoardAggregate } from "shared/models"

export default function List({ aggregate, onOpen }: List.Props) {
  const { workspace, board, phases, tasks } = aggregate
  const state = useBoardsView()
  const writable =
    workspace.access === "write" || workspace.access === "manage"
  const ws = workspace.slug
  const boardSlug = board.slug
  const [editing, setEditing] = useState<number | null>(null)

  const visible = visibleTasks(
    tasks,
    state.listSearch,
    state.listProjection,
  )
  const { moveTask } = useListActions(ws, boardSlug)
  const dragHandles = useListDrag({ tasks, visible, moveTask })
  const commands = useListCommands({
    ws,
    board: boardSlug,
    onOpen,
    setEditing,
    moveTask,
  })
  useListKeyboard({
    writable,
    editing,
    setEditing,
    onOpen,
    visible,
    commands,
  })

  return (
    <Stack gap="md" className={classes.listView}>
      <FilterBar phases={phases} />
      <TaskList
        ws={ws}
        board={boardSlug}
        visible={visible}
        phases={phases}
        writable={writable}
        editing={editing}
        dragHandles={dragHandles}
        commands={commands}
      />
    </Stack>
  )
}

export namespace List {
  export type Props = {
    aggregate: BoardAggregate
    onOpen: (taskID: number) => void
  }
}
