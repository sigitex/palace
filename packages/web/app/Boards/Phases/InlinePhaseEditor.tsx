import { DeletePopover } from "@/Boards/Shared/DeletePopover"
import { PresentationSelector } from "@/Boards/Presentation/PresentationSelector"
import { Button, Group, Stack, TextInput } from "@mantine/core"
import { useState } from "react"
import type { BoardColor, BoardIcon, BoardPhase } from "shared/models"

export function InlinePhaseEditor({
  phase,
  onSave,
  onDelete,
  onCancel,
}: InlinePhaseEditor.Props) {
  const [title, setTitle] = useState(phase.title)
  const [color, setColor] = useState<BoardColor | null>(phase.color)
  const [icon, setIcon] = useState<BoardIcon | null>(phase.icon)
  return (
    <Stack gap="sm">
      <TextInput
        autoFocus
        label="Phase title"
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel()
          }
        }}
      />
      <PresentationSelector
        color={color}
        icon={icon}
        colorRequired
        onColorChange={setColor}
        onIconChange={setIcon}
      />
      <Group justify="space-between">
        <DeletePopover
          label={`phase “${phase.title}”`}
          onDelete={onDelete}
        >
          <Button size="xs" color="red">
            Delete phase
          </Button>
        </DeletePopover>
        <Group gap="xs">
          <Button size="xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="xs"
            variant="filled"
            disabled={!title.trim() || !color}
            onClick={() =>
              color && onSave({ title: title.trim(), color, icon })
            }
          >
            Save phase
          </Button>
        </Group>
      </Group>
    </Stack>
  )
}

export namespace InlinePhaseEditor {
  export type Props = {
    phase: BoardPhase
    onSave: (metadata: {
      title: string
      color: BoardColor
      icon: BoardIcon | null
    }) => Promise<unknown>
    onDelete: () => Promise<unknown>
    onCancel: () => void
  }
}
