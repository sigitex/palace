import classes from "@/Boards/Browse/Browse.module.css"
import { InlineName } from "@/Boards/Browse/InlineName"
import { ResourceButton } from "@/Boards/Browse/ResourceButton"
import { slugify } from "@/Boards/Browse/slugify"
import { useBoards } from "@/state"
import { ActionIcon, Group, Stack, Text, Title } from "@mantine/core"
import type { KeyboardEventHandler } from "react"
import { Icon } from "@/common/Icon"
import { useLocation } from "wouter"
import { path } from "shared/routes"
import type { Workspace } from "shared/models"

export function WorkspacePane({
  workspaces,
  selected,
  selectedWorkspace,
  palaceAdmin,
  draft,
  renaming,
  onKeyDown,
  setDraft,
  setRenaming,
}: WorkspacePane.Props) {
  const [, navigate] = useLocation()
  const boards = useBoards()
  return (
    <Stack
      className={classes.workspacePane}
      gap="xs"
      onKeyDown={onKeyDown}
    >
      <Group justify="space-between">
        <Title order={2}>Workspaces</Title>
        {palaceAdmin && (
          <ActionIcon
            aria-label="New workspace"
            onClick={() => setDraft("workspace")}
          >
            <Icon name="plus" />
          </ActionIcon>
        )}
      </Group>
      {workspaces.length === 0 && (
        <Text c="dimmed">No readable workspaces.</Text>
      )}
      {workspaces.map((workspace) => (
        <ResourceButton
          key={workspace.id}
          resource={workspace}
          selected={workspace.slug === selectedWorkspace}
          dataWorkspace={workspace.slug}
          onOpen={() =>
            navigate(path.boards.workspace(workspace.slug))
          }
        />
      ))}
      {draft === "workspace" && (
        <InlineName
          label="Workspace name"
          onCancel={() => setDraft(null)}
          onSave={async (name) => {
            const slug = slugify(name)
            await boards.createWorkspace({
              name,
              slug,
              color: null,
              icon: null,
              manager_group: 2,
            })
            setDraft(null)
            navigate(path.boards.workspace(slug))
          }}
        />
      )}
      {renaming === "workspace" && selected && (
        <InlineName
          label="Workspace name"
          initial={selected.name}
          onCancel={() => setRenaming(null)}
          onSave={async (name) => {
            await boards.updateWorkspace(selected.slug, {
              name,
              slug: selected.slug,
              color: selected.color,
              icon: selected.icon,
            })
            setRenaming(null)
          }}
        />
      )}
    </Stack>
  )
}

export namespace WorkspacePane {
  export type Props = {
    workspaces: Workspace[]
    selected: Workspace | undefined
    selectedWorkspace?: string
    palaceAdmin: boolean
    draft: "workspace" | "board" | null
    renaming: "workspace" | null
    onKeyDown: KeyboardEventHandler<HTMLDivElement>
    setDraft: (value: "workspace" | "board" | null) => void
    setRenaming: (value: "workspace" | null) => void
  }
}
