import { BoardsQuery } from "@/Boards/BoardsQuery"
import { PresentationSelector } from "@/Boards/Presentation/PresentationSelector"
import { DeletePopover } from "@/Boards/Shared/DeletePopover"
import { call } from "@/common/call"
import {
  Button,
  Divider,
  Drawer,
  Stack,
  TextInput,
  Title,
} from "@mantine/core"
import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { BoardsPath } from "shared/BoardsPath"
import type {
  BoardAggregate,
  BoardColor,
  BoardIcon,
} from "shared/models"

export function BoardDrawer({
  aggregate,
  opened,
  onClose,
}: BoardDrawer.Props) {
  const { board, workspace } = aggregate
  const [, navigate] = useLocation()
  const [name, setName] = useState(board.name)
  const [slug, setSlug] = useState(board.slug)
  const [color, setColor] = useState<BoardColor | null>(board.color)
  const [icon, setIcon] = useState<BoardIcon | null>(board.icon)
  const action = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    {
      invalidateExact: [
        BoardsQuery.keys.exact.boards(workspace.slug),
        BoardsQuery.keys.exact.aggregate(workspace.slug, board.slug),
      ],
    },
  )

  useEffect(() => {
    setName(board.name)
    setSlug(board.slug)
    setColor(board.color)
    setIcon(board.icon)
  }, [board])

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
      title="Board settings"
    >
      <Stack>
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <TextInput
          label="Slug"
          description={`New URL: ${BoardsPath.board(workspace.slug, slug || board.slug)}`}
          value={slug}
          onChange={(event) => setSlug(event.currentTarget.value)}
        />
        <PresentationSelector
          color={color}
          icon={icon}
          onColorChange={setColor}
          onIconChange={setIcon}
        />
        <Button
          onClick={async () => {
            await action.mutateAsync(() =>
              call.boards.board.update({
                workspace: workspace.slug,
                board: board.slug,
                name,
                slug,
                color,
                icon,
              }),
            )
            if (slug !== board.slug)
              navigate(BoardsPath.board(workspace.slug, slug))
          }}
        >
          Save board
        </Button>
        <Divider />
        <Title order={3}>Danger zone</Title>
        <DeletePopover
          label={`board “${board.name}”`}
          onDelete={async () => {
            await action.mutateAsync(() =>
              call.boards.board.delete({
                workspace: workspace.slug,
                board: board.slug,
              }),
            )
            onClose()
            navigate(BoardsPath.workspace(workspace.slug))
          }}
        >
          <Button color="red">Delete board</Button>
        </DeletePopover>
      </Stack>
    </Drawer>
  )
}

export namespace BoardDrawer {
  export type Props = {
    aggregate: BoardAggregate
    opened: boolean
    onClose: () => void
  }
}
