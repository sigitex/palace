import { useBoards } from "@/state"
import Appearance from "@/Boards/Appearance"
import { DeletePopover } from "@/common/DeletePopover"
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
import { path } from "shared/routes"
import type {
  BoardAggregate,
  BoardColor,
  BoardIcon,
} from "shared/models"

type Props = {
  aggregate: BoardAggregate
  opened: boolean
  onClose: () => void
}

export function BoardDrawer({
  aggregate,
  opened,
  onClose,
}: Props) {
  const { board, workspace } = aggregate
  const boards = useBoards()
  const [, navigate] = useLocation()
  const [name, setName] = useState(board.name)
  const [slug, setSlug] = useState(board.slug)
  const [color, setColor] = useState<BoardColor | null>(board.color)
  const [icon, setIcon] = useState<BoardIcon | null>(board.icon)

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
          description={`New URL: ${path.boards.board(workspace.slug, slug || board.slug)}`}
          value={slug}
          onChange={(event) => setSlug(event.currentTarget.value)}
        />
        <Appearance
          color={color}
          icon={icon}
          onColorChange={setColor}
          onIconChange={setIcon}
        />
        <Button
          onClick={async () => {
            await boards.updateBoard(workspace.slug, board.slug, {
              name,
              slug,
              color,
              icon,
            })
            if (slug !== board.slug)
              navigate(path.boards.board(workspace.slug, slug))
          }}
        >
          Save board
        </Button>
        <Divider />
        <Title order={3}>Danger zone</Title>
        <DeletePopover
          label={`board “${board.name}”`}
          onDelete={async () => {
            await boards.deleteBoard(workspace.slug, board.slug)
            onClose()
            navigate(path.boards.workspace(workspace.slug))
          }}
        >
          <Button color="red">Delete board</Button>
        </DeletePopover>
      </Stack>
    </Drawer>
  )
}
