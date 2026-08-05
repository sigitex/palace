import { BoardsQuery } from "@/Boards/BoardsQuery"
import { PresentationSelector } from "@/Boards/Presentation/PresentationSelector"
import { DeletePopover } from "@/Boards/Shared/DeletePopover"
import { call } from "@/common/call"
import {
  Alert,
  Button,
  Divider,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { BoardsPath } from "shared/BoardsPath"
import type {
  BoardColor,
  BoardIcon,
  Workspace,
  WorkspaceAccessLevel,
} from "shared/models"

export function WorkspaceDrawer({
  workspace,
  opened,
  onClose,
}: WorkspaceDrawer.Props) {
  const [, navigate] = useLocation()
  const [name, setName] = useState(workspace.name)
  const [slug, setSlug] = useState(workspace.slug)
  const [color, setColor] = useState<BoardColor | null>(
    workspace.color,
  )
  const [icon, setIcon] = useState<BoardIcon | null>(workspace.icon)
  const [group, setGroup] = useState<string | null>(null)
  const [level, setLevel] = useState<WorkspaceAccessLevel>("read")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const access = BoardsQuery.useAccess(workspace.slug, opened)
  const groups = BoardsQuery.useGroups(workspace.slug, opened)
  const workspaceAction = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    {
      invalidateExact: [BoardsQuery.keys.exact.workspaces],
      invalidatePrefix: [
        BoardsQuery.keys.prefix.aggregates(workspace.slug),
      ],
    },
  )
  const accessAction = BoardsQuery.useAction(
    (work: () => Promise<unknown>) => work(),
    {
      invalidateExact: [
        BoardsQuery.keys.exact.workspaces,
        BoardsQuery.keys.exact.access(workspace.slug),
      ],
      invalidatePrefix: [
        BoardsQuery.keys.prefix.aggregates(workspace.slug),
      ],
    },
  )

  useEffect(() => {
    setName(workspace.name)
    setSlug(workspace.slug)
    setColor(workspace.color)
    setIcon(workspace.icon)
  }, [workspace])

  const granted = new Set(
    access.data?.map(({ group: id }) => id) ?? [],
  )
  const availableGroups =
    groups.data
      ?.filter(({ id }) => !granted.has(id))
      .map(({ id, name: label }) => ({ value: String(id), label })) ??
    []

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title="Workspace settings"
    >
      <Stack>
        {workspace.palace_admin && (
          <>
            <TextInput
              label="Name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <TextInput
              label="Slug"
              description={`New URL: ${BoardsPath.workspace(slug || workspace.slug)}`}
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
              loading={workspaceAction.isPending}
              onClick={async () => {
                await workspaceAction.mutateAsync(() =>
                  call.boards.workspace.update({
                    workspace: workspace.slug,
                    name,
                    slug,
                    color,
                    icon,
                  }),
                )
                if (slug !== workspace.slug)
                  navigate(BoardsPath.workspace(slug))
              }}
            >
              Save workspace
            </Button>
            <Divider />
          </>
        )}

        <Title order={3}>Workspace access</Title>
        {access.isLoading && (
          <Text c="dimmed">Loading access...</Text>
        )}
        {access.data?.map((grant) => (
          <Group key={grant.group} align="end" wrap="nowrap">
            <Text style={{ flex: 1 }}>{grant.group_name}</Text>
            <Select
              aria-label={`${grant.group_name} access`}
              data={accessLevels}
              value={grant.level}
              allowDeselect={false}
              onChange={(value) =>
                value &&
                accessAction.mutate(() =>
                  call.boards.workspace.access.set({
                    workspace: workspace.slug,
                    group: grant.group,
                    level: value as WorkspaceAccessLevel,
                  }),
                )
              }
            />
            <Button
              color="red"
              size="xs"
              onClick={() =>
                accessAction.mutate(() =>
                  call.boards.workspace.access.remove({
                    workspace: workspace.slug,
                    group: grant.group,
                  }),
                )
              }
            >
              Remove
            </Button>
          </Group>
        ))}
        <Group align="end">
          <Select
            label="Group"
            data={availableGroups}
            value={group}
            onChange={setGroup}
            style={{ flex: 1 }}
          />
          <Select
            label="Access"
            data={accessLevels}
            value={level}
            allowDeselect={false}
            onChange={(value) =>
              value && setLevel(value as WorkspaceAccessLevel)
            }
          />
          <Button
            disabled={!group}
            onClick={async () => {
              if (!group) return
              await accessAction.mutateAsync(() =>
                call.boards.workspace.access.set({
                  workspace: workspace.slug,
                  group: Number(group),
                  level,
                }),
              )
              setGroup(null)
            }}
          >
            Add
          </Button>
        </Group>

        {workspace.palace_admin && (
          <>
            <Divider />
            <Title order={3}>Danger zone</Title>
            {deleteError && <Alert color="red">{deleteError}</Alert>}
            <DeletePopover
              label={`workspace “${workspace.name}”`}
              onDelete={async () => {
                setDeleteError(null)
                try {
                  await workspaceAction.mutateAsync(() =>
                    call.boards.workspace.delete({
                      workspace: workspace.slug,
                    }),
                  )
                  onClose()
                  navigate(BoardsPath.index)
                } catch (error) {
                  setDeleteError(
                    error instanceof Error
                      ? error.message
                      : "Workspace deletion failed.",
                  )
                  throw error
                }
              }}
            >
              <Button color="red">Delete workspace</Button>
            </DeletePopover>
          </>
        )}
      </Stack>
    </Drawer>
  )
}

export namespace WorkspaceDrawer {
  export type Props = {
    workspace: Workspace
    opened: boolean
    onClose: () => void
  }
}

const accessLevels = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "manage", label: "Manage" },
]
