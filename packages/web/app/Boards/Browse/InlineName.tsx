import { TextInput } from "@mantine/core"
import { useState } from "react"

// A single-field inline editor for naming/renaming a workspace or board:
// Enter commits a non-empty trimmed name, Escape cancels.
export function InlineName({
  label,
  initial = "",
  onSave,
  onCancel,
}: InlineName.Props) {
  const [name, setName] = useState(initial)
  return (
    <TextInput
      autoFocus
      aria-label={label}
      value={name}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setName(event.currentTarget.value)}
      onKeyDown={async (event) => {
        if (event.key === "Escape") onCancel()
        if (event.key === "Enter" && name.trim())
          await onSave(name.trim())
      }}
    />
  )
}

export namespace InlineName {
  export type Props = {
    label: string
    initial?: string
    onSave: (name: string) => Promise<void>
    onCancel: () => void
  }
}
