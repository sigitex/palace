import classes from "@/Boards/Browse/Browse.module.css"
import { BoardIcon } from "@/common/BoardIcon"
import { Group, Text } from "@mantine/core"
import type { Board, Workspace } from "shared/models"

export function ResourceButton({
  resource,
  selected = false,
  dataBoard,
  dataWorkspace,
  tinted = false,
  onOpen,
}: ResourceButton.Props) {
  return (
    <button
      type="button"
      className={`${classes.resource} ${selected ? classes.selected : ""} ${tinted ? classes.resourceTinted : ""}`}
      style={
        {
          "--resource-color": resource.color
            ? `var(--mantine-color-${resource.color}-6)`
            : undefined,
          "--resource-background": resource.color
            ? `var(--mantine-color-${resource.color}-light)`
            : undefined,
        } as React.CSSProperties
      }
      data-board={dataBoard}
      data-workspace={dataWorkspace}
      onClick={onOpen}
      onDoubleClick={onOpen}
    >
      <Group wrap="nowrap">
        {resource.icon && (
          <BoardIcon
            icon={resource.icon}
            color={
              resource.color
                ? `var(--mantine-color-${resource.color}-6)`
                : undefined
            }
            aria-hidden
          />
        )}
        <Text className={classes.resourceTitle} fw={600}>
          {resource.name}
        </Text>
      </Group>
    </button>
  )
}

export namespace ResourceButton {
  export type Props = {
    resource: Workspace | Board
    selected?: boolean
    dataBoard?: string
    dataWorkspace?: string
    tinted?: boolean
    onOpen: () => void
  }
}
