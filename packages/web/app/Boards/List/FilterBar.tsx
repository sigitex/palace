import classes from "@/Boards/List/List.module.css"
import { BoardIcon } from "@/common/BoardIcon"
import { useBoardsView } from "@/state"
import { Button, Group, TextInput } from "@mantine/core"
import { Icon } from "@/common/Icon"
import type { BoardPhase } from "shared/models"

type Props = {
  phases: BoardPhase[]
}

// Search field plus the projection filters (All / Incomplete / per-phase /
// Complete) that drive which tasks the list shows.
export function FilterBar({ phases }: Props) {
  const state = useBoardsView()
  return (
    <Group
      align="flex-end"
      justify="space-between"
      className={classes.listHeader}
    >
      <TextInput
        label="Search tasks"
        leftSection={<Icon name="magnifying-glass" aria-hidden />}
        value={state.listSearch}
        onChange={(event) =>
          state.setListSearch(event.currentTarget.value)
        }
        className={classes.listSearch}
      />
      <Button.Group className={classes.phaseFilters}>
        <FilterButton
          active={state.listProjection === "all"}
          label="All"
          onClick={() => state.setListProjection("all")}
        />
        <FilterButton
          active={state.listProjection === "incomplete"}
          label="Incomplete"
          icon={<Icon name="circle-dashed" />}
          onClick={() => state.setListProjection("incomplete")}
        />
        {phases.map((phase) => (
          <FilterButton
            key={phase.id}
            active={state.listProjection === `phase:${phase.id}`}
            label={phase.title}
            icon={
              phase.icon ? <BoardIcon icon={phase.icon} /> : undefined
            }
            color={phase.color}
            onClick={() => state.setListProjection(`phase:${phase.id}`)}
          />
        ))}
        <FilterButton
          active={state.listProjection === "complete"}
          label="Complete"
          icon={<Icon name="check-circle" />}
          onClick={() => state.setListProjection("complete")}
        />
      </Button.Group>
    </Group>
  )
}

type FilterButtonProps = {
  active: boolean
  label: string
  icon?: React.ReactNode
  color?: string
  onClick: () => void
}

function FilterButton({
  active,
  label,
  icon,
  color,
  onClick,
}: FilterButtonProps) {
  return (
    <Button
      size="compact-sm"
      variant={active ? "filled" : "default"}
      leftSection={icon}
      onClick={onClick}
      style={
        color && !active
          ? { color: `var(--mantine-color-${color}-7)` }
          : undefined
      }
    >
      {label}
    </Button>
  )
}
