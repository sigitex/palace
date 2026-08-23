import type { Lane } from "@/Boards/Phases/Lane"
import type { PhaseLaneCommands } from "@/Boards/Phases/PhaseLaneCommands"
import classes from "@/Boards/Phases/Phases.module.css"
import { BoardIcon } from "@/common/BoardIcon"
import type { usePointerDrag } from "@/common/usePointerDrag"
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core"
import { Icon } from "@/common/Icon"

type Props = {
  lane: Lane
  writable: boolean
  phaseDragHandle?: usePointerDrag.Handle
  commands: PhaseLaneCommands
}

// A lane's title row: drag handle, phase/status icon, title, task count, and
// the edit-phase / add-task actions.
export function PhaseLaneHeader({
  lane,
  writable,
  phaseDragHandle,
  commands,
}: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" mb="sm">
      <Group gap="xs" wrap="nowrap" className={classes.phaseTitle}>
        {phaseDragHandle && writable && (
          <ActionIcon
            variant="subtle"
            className={classes.dragHandle}
            aria-label={`Drag phase ${lane.title}`}
            onKeyDown={(event) => {
              if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowRight"
              ) {
                event.preventDefault()
                event.stopPropagation()
                commands.movePhase(
                  lane.phase!.id,
                  event.key === "ArrowLeft" ? -1 : 1,
                )
              }
            }}
            {...phaseDragHandle}
          >
            <Icon name="dots-six-vertical" />
          </ActionIcon>
        )}
        {lane.phase?.icon ? (
          <BoardIcon icon={lane.phase.icon} aria-hidden />
        ) : lane.complete ? (
          <Icon name="check-circle" aria-hidden />
        ) : !lane.phase ? (
          <Icon name="circle-dashed" aria-hidden />
        ) : null}
        <Text fw={700} truncate>
          {lane.title}
        </Text>
        <Text size="xs" c="dimmed">
          {lane.tasks.length}
        </Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        {lane.phase && writable && (
          <Tooltip label={`Edit ${lane.title}`}>
            <ActionIcon
              variant="subtle"
              aria-label={`Edit ${lane.title}`}
              onClick={() => commands.editPhase(lane.phase!.id)}
            >
              <Icon name="pencil-simple" />
            </ActionIcon>
          </Tooltip>
        )}
        {!lane.complete && writable && (
          <Tooltip label={`Add task to ${lane.title}`}>
            <ActionIcon
              variant="subtle"
              aria-label={`Add task to ${lane.title}`}
              onClick={() =>
                commands.openTaskComposer(lane.phase?.id ?? null)
              }
            >
              <Icon name="plus" />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  )
}
