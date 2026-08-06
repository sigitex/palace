import classes from "@/Boards/Shared/NewTaskEntry.module.css"
import { Icon } from "@/common/Icon"

export function NewTaskEntry({
  selected,
  onActivate,
}: NewTaskEntry.Props) {
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-label="Add task"
      tabIndex={selected ? 0 : -1}
      data-new-task-entry
      className={`${classes.entry} ${selected ? classes.selected : ""}`}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onActivate()
        }
      }}
    >
      <Icon name="plus" aria-hidden />
      Add task
    </div>
  )
}

export namespace NewTaskEntry {
  export type Props = {
    selected: boolean
    onActivate: () => void
  }
}
