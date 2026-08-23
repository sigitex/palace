import classes from "@/Boards/Phases/Phases.module.css"
import { useBoardsView } from "@/state"
import { Button } from "@mantine/core"
import { Icon } from "@/common/Icon"

type Props = {
  writable: boolean
}

export function LaneControls({ writable }: Props) {
  const state = useBoardsView()
  return (
    <div className={classes.laneControls}>
      <Button
        size="compact-sm"
        variant={state.incompleteLaneVisible ? "filled" : "default"}
        leftSection={
          state.incompleteLaneVisible ? (
            <Icon name="eye-slash" />
          ) : (
            <Icon name="eye" />
          )
        }
        onClick={() => state.toggleIncompleteLane()}
      >
        {state.incompleteLaneVisible
          ? "Hide Incomplete"
          : "Show Incomplete"}
      </Button>
      {writable && (
        <Button
          size="compact-sm"
          leftSection={<Icon name="plus" />}
          onClick={() => state.setPhaseComposerVisible(true)}
        >
          Add phase
        </Button>
      )}
      <Button
        size="compact-sm"
        variant={state.completeLaneVisible ? "filled" : "default"}
        leftSection={
          state.completeLaneVisible ? (
            <Icon name="eye-slash" />
          ) : (
            <Icon name="eye" />
          )
        }
        onClick={() => state.toggleCompleteLane()}
      >
        {state.completeLaneVisible ? "Hide Complete" : "Show Complete"}
      </Button>
    </div>
  )
}
