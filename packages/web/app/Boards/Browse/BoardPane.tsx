import classes from "@/Boards/Browse/Browse.module.css"
import { InlineName } from "@/Boards/Browse/InlineName"
import { ResourceButton } from "@/Boards/Browse/ResourceButton"
import { slugify } from "@/Boards/Browse/slugify"
import { useBoards } from "@/state"
import { ActionIcon, Button, Group, Stack, Text, Title } from "@mantine/core"
import type { KeyboardEventHandler } from "react"
import { Icon } from "@/common/Icon"
import { useLocation } from "wouter"
import { path } from "shared/routes"
import type { Board, Workspace } from "shared/models"

export function BoardPane({
  boardList,
  selected,
  canWrite,
  canManage,
  draft,
  renamingBoard,
  onKeyDown,
  setDraft,
  setRenamingBoard,
  onOpenSettings,
}: BoardPane.Props) {
  const [, navigate] = useLocation()
  const boards = useBoards()
  return (
    <Stack className={classes.boardPane} gap="xs" onKeyDown={onKeyDown}>
      <Group justify="space-between">
        <Group gap="xs">
          <Button
            className={classes.mobileBack}
            variant="subtle"
            leftSection={<Icon name="arrow-left" />}
            onClick={() => navigate(path.boards.index)}
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
              <Icon name="plus" />
            </ActionIcon>
          )}
          {canManage && (
            <ActionIcon
              aria-label="Workspace settings"
              onClick={onOpenSettings}
            >
              <Icon name="gear" />
            </ActionIcon>
          )}
        </Group>
      </Group>
      {!selected && <Text c="dimmed">Select a workspace.</Text>}
      {selected && boardList.length === 0 && (
        <Text c="dimmed">No boards in this workspace.</Text>
      )}
      {selected &&
        boardList.map((board) =>
          renamingBoard === board.slug ? (
            <InlineName
              key={board.id}
              label="Board name"
              initial={board.name}
              onCancel={() => setRenamingBoard(null)}
              onSave={async (name) => {
                await boards.updateBoard(selected.slug, board.slug, {
                  name,
                  slug: board.slug,
                  color: board.color,
                  icon: board.icon,
                })
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
                navigate(path.boards.board(selected.slug, board.slug))
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
            await boards.createBoard(selected.slug, {
              name,
              slug,
              color: null,
              icon: null,
            })
            setDraft(null)
            navigate(path.boards.board(selected.slug, slug))
          }}
        />
      )}
    </Stack>
  )
}

export namespace BoardPane {
  export type Props = {
    boardList: Board[]
    selected: Workspace | undefined
    canWrite: boolean
    canManage: boolean
    draft: "workspace" | "board" | null
    renamingBoard: string | null
    onKeyDown: KeyboardEventHandler<HTMLDivElement>
    setDraft: (value: "workspace" | "board" | null) => void
    setRenamingBoard: (value: string | null) => void
    onOpenSettings: () => void
  }
}
