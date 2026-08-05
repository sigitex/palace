import classes from "@/Boards/Task/TaskSelectors.module.css"
import { BoardIcon } from "@/common/BoardIcon"
import { Group, Menu, Text, UnstyledButton } from "@mantine/core"
import { PiCircleDashed } from "react-icons/pi"
import type { BoardPhase } from "shared/models"

export function PhaseSelector({
  phases,
  phase,
  writable,
  onChange,
}: PhaseSelector.Props) {
  const selected = phases.find(({ id }) => id === phase)
  const control = (
    <UnstyledButton
      className={classes.phaseBadge}
      disabled={!writable}
      aria-label="Change phase"
      style={
        selected
          ? {
              color: `var(--mantine-color-${selected.color}-7)`,
              background: `var(--mantine-color-${selected.color}-light)`,
            }
          : undefined
      }
    >
      <Group gap={6} wrap="nowrap">
        {selected?.icon ? (
          <BoardIcon icon={selected.icon} aria-hidden />
        ) : !selected ? (
          <PiCircleDashed aria-hidden />
        ) : null}
        <Text size="sm" fw={600} truncate>
          {selected?.title ?? "Incomplete"}
        </Text>
      </Group>
    </UnstyledButton>
  )

  if (!writable) {
    return control
  }
  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>{control}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<PiCircleDashed />}
          onClick={() => onChange(null)}
        >
          Incomplete
        </Menu.Item>
        {phases.map((item) => (
          <Menu.Item
            key={item.id}
            leftSection={
              item.icon ? (
                <BoardIcon
                  icon={item.icon}
                  color={`var(--mantine-color-${item.color}-6)`}
                />
              ) : undefined
            }
            onClick={() => onChange(item.id)}
          >
            {item.title}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

export namespace PhaseSelector {
  export type Props = {
    phases: BoardPhase[]
    phase: number | null
    writable: boolean
    onChange: (phase: number | null) => void
  }
}
