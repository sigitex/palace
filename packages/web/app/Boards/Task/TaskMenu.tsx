import { BoardIcon } from "@/common/BoardIcon"
import { ActionIcon, Menu } from "@mantine/core"
import { PiDotsThreeVertical } from "react-icons/pi"
import type { BoardPhase, BoardTask } from "shared/models"

export function TaskMenu({
  task,
  phases,
  onMove,
  onStep,
}: TaskMenu.Props) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          aria-label={`Actions for ${task.title}`}
        >
          <PiDotsThreeVertical />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Board order</Menu.Label>
        <Menu.Item onClick={() => onStep(-1)}>Move up</Menu.Item>
        <Menu.Item onClick={() => onStep(1)}>Move down</Menu.Item>
        <Menu.Divider />
        <Menu.Label>Destination</Menu.Label>
        <Menu.Item
          onClick={() => onMove({ type: "phase", phase: null })}
        >
          Incomplete
        </Menu.Item>
        {phases.map((phase) => (
          <Menu.Item
            key={phase.id}
            leftSection={
              phase.icon ? (
                <BoardIcon
                  icon={phase.icon}
                  color={`var(--mantine-color-${phase.color}-6)`}
                />
              ) : undefined
            }
            onClick={() => onMove({ type: "phase", phase: phase.id })}
          >
            {phase.title}
          </Menu.Item>
        ))}
        {task.complete ? (
          <Menu.Item
            onClick={() =>
              onMove({ type: "phase", phase: task.phase })
            }
          >
            Reopen
          </Menu.Item>
        ) : (
          <Menu.Item onClick={() => onMove({ type: "complete" })}>
            Complete
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}

export namespace TaskMenu {
  export type Destination =
    | { type: "phase"; phase: number | null }
    | { type: "complete" }

  export type Props = {
    task: BoardTask
    phases: BoardPhase[]
    onMove: (destination: Destination) => void
    onStep: (direction: -1 | 1) => void
  }
}
