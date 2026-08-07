import { Button, Group, Popover, Stack, Text } from "@mantine/core"
import { useState, type ReactNode } from "react"

export function DeletePopover({
  label,
  onDelete,
  children,
}: DeletePopover.Props) {
  const [opened, setOpened] = useState(false)

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      trapFocus
      returnFocus
      withArrow
    >
      <Popover.Target>
        <span onClick={() => setOpened(true)}>{children}</span>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="sm">Permanently delete {label}?</Text>
          <Group justify="flex-end" gap="xs">
            <Button size="xs" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="red"
              onClick={async () => {
                await onDelete()
                setOpened(false)
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

export namespace DeletePopover {
  export type Props = {
    label: string
    onDelete: () => Promise<unknown>
    children: ReactNode
  }
}
