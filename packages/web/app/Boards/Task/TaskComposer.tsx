import { PhaseSelector } from "@/Boards/Task/PhaseSelector"
import {
  ActionIcon,
  Group,
  Input,
  Paper,
  TextInput,
} from "@mantine/core"
import { useState } from "react"
import { Icon } from "@/common/Icon"
import type { BoardPhase, BoardTask } from "shared/models"

export function TaskComposer({
  phases,
  defaultPhase = null,
  showPhase = true,
  creating,
  onCreate,
  onCreated,
  onCancel,
}: TaskComposer.Props) {
  const [title, setTitle] = useState("")
  const [phase, setPhase] = useState<number | null>(defaultPhase)

  return (
    <Paper
      component="form"
      withBorder
      p="sm"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!title.trim()) {
          return
        }
        const task = await onCreate({
          title: title.trim(),
          phase,
        })
        onCreated(task)
      }}
    >
      <Group gap="xs" align="center" wrap="nowrap">
        <TextInput
          autoFocus
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onCancel()
            }
          }}
          style={{ flex: 1 }}
        />
        {showPhase && (
          <Input.Wrapper label="Phase">
            <PhaseSelector
              phases={phases}
              phase={phase}
              writable
              onChange={setPhase}
            />
          </Input.Wrapper>
        )}
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
          disabled={!title.trim()}
          aria-label="Add task"
        >
          <Icon name="check" />
        </ActionIcon>
      </Group>
    </Paper>
  )
}

export namespace TaskComposer {
  export type Input = {
    title: string
    phase: number | null
  }

  export type Props = {
    phases: BoardPhase[]
    defaultPhase?: number | null
    showPhase?: boolean
    creating: boolean
    onCreate: (input: Input) => Promise<BoardTask>
    onCreated: (task: BoardTask) => void
    onCancel: () => void
  }
}
