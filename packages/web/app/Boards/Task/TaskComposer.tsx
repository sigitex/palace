import { PhaseSelector } from "@/Boards/Task/PhaseSelector"
import { Button, Group, Input, Paper, TextInput } from "@mantine/core"
import { useState } from "react"
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
      <Group align="end" wrap="wrap">
        <TextInput
          autoFocus
          label="Task title"
          placeholder="What needs doing?"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onCancel()
            }
          }}
          style={{ flex: "1 1 14rem" }}
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
        <Group gap="xs">
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            loading={creating}
            disabled={!title.trim()}
          >
            Add task
          </Button>
        </Group>
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
