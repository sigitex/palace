import classes from "@/Boards/Task/TaskSelectors.module.css"
import { BoardIcon } from "@/common/BoardIcon"
import { Group, Menu, Text, UnstyledButton } from "@mantine/core"
import { PiCheckCircle, PiCircleDashed } from "react-icons/pi"
import type { BoardPhase, BoardTask } from "shared/models"

export function TaskStateSelector({
  phases,
  task,
  writable,
  onChange,
}: TaskStateSelector.Props) {
  const phase = phases.find(({ id }) => id === task.phase)
  const selected = task.complete ? null : phase
  const label = task.complete
    ? "Complete"
    : (selected?.title ?? "Incomplete")
  const control = (
    <UnstyledButton
      className={classes.phaseBadge}
      disabled={!writable}
      aria-label={`Change state for ${task.title}`}
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
        {task.complete ? (
          <PiCheckCircle aria-hidden />
        ) : selected?.icon ? (
          <BoardIcon icon={selected.icon} aria-hidden />
        ) : !selected ? (
          <PiCircleDashed aria-hidden />
        ) : null}
        <Text size="sm" fw={600} truncate>
          {label}
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
          onClick={() => onChange({ complete: false, phase: null })}
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
            onClick={() =>
              onChange({ complete: false, phase: item.id })
            }
          >
            {item.title}
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item
          leftSection={<PiCheckCircle />}
          onClick={() =>
            onChange({ complete: true, phase: task.phase })
          }
        >
          Complete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export namespace TaskStateSelector {
  export type Value = Pick<BoardTask, "complete" | "phase">

  export type Props = {
    phases: BoardPhase[]
    task: BoardTask
    writable: boolean
    onChange: (value: Value) => void
  }
}
