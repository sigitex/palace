import type { CSSProperties, HTMLAttributes } from "react"
import type { BoardIcon as BoardIconKey } from "shared/models"
import { Icon } from "@/common/Icon"

export function BoardIcon({
  icon,
  size = "1.25rem",
  ...props
}: BoardIcon.Props) {
  return <Icon name={icon} size={size} {...props} />
}

export namespace BoardIcon {
  export type Props = Omit<
    HTMLAttributes<HTMLElement>,
    "children"
  > & {
    icon: BoardIconKey
    size?: CSSProperties["fontSize"]
  }
}
