import Appearance from "@/Boards/Appearance"
import classes from "@/Boards/Phases/PhaseComposer.module.css"
import {
  ActionIcon,
  Group,
  Paper,
  Stack,
  TextInput,
} from "@mantine/core"
import { useState } from "react"
import { Icon } from "@/common/Icon"
import type { BoardColor, BoardIcon, BoardPhase } from "shared/models"

type PhaseComposerInput = {
  title: string
  color: BoardColor
  icon: BoardIcon | null
}

type Props = {
  creating: boolean
  onCreate: (input: PhaseComposerInput) => Promise<BoardPhase>
  onCreated: (phase: BoardPhase) => void
  onCancel: () => void
}

export function PhaseComposer({
  creating,
  onCreate,
  onCreated,
  onCancel,
}: Props) {
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
        <Group className={classes.composerRow} wrap="nowrap">
          <TextInput
            autoFocus
            placeholder="Phase name"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onCancel()
              }
            }}
            className={classes.titleInput}
          />
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <Icon name="x" />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            type="submit"
            loading={creating}
            disabled={!title.trim() || !color}
            aria-label="Add phase"
          >
            <Icon name="check" />
          </ActionIcon>
        </Group>
        <Appearance
          color={color}
          icon={icon}
          colorRequired
          onColorChange={setColor}
          onIconChange={setIcon}
        />
      </Stack>
    </Paper>
  )
}
