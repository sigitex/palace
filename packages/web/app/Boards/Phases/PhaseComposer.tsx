import { PresentationSelector } from "@/Boards/Presentation/PresentationSelector"
import { Button, Group, Paper, Stack, TextInput } from "@mantine/core"
import { useState } from "react"
import type { BoardColor, BoardIcon, BoardPhase } from "shared/models"

export function PhaseComposer({
  creating,
  onCreate,
  onCreated,
  onCancel,
}: PhaseComposer.Props) {
  const [title, setTitle] = useState("")
  const [color, setColor] = useState<BoardColor | null>("blue")
  const [icon, setIcon] = useState<BoardIcon | null>(null)

  return (
    <Paper
      component="form"
      withBorder
      p="sm"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!title.trim() || !color) {
          return
        }
        const phase = await onCreate({
          title: title.trim(),
          color,
          icon,
        })
        onCreated(phase)
      }}
    >
      <Stack gap="sm">
        <TextInput
          autoFocus
          label="Phase title"
          placeholder="Phase name"
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
        <Group justify="flex-end">
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            loading={creating}
            disabled={!title.trim() || !color}
          >
            Add phase
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

export namespace PhaseComposer {
  export type Input = {
    title: string
    color: BoardColor
    icon: BoardIcon | null
  }

  export type Props = {
    creating: boolean
    onCreate: (input: Input) => Promise<BoardPhase>
    onCreated: (phase: BoardPhase) => void
    onCancel: () => void
  }
}
