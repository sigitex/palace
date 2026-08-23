import type { CSSProperties, HTMLAttributes } from "react"
import type { BoardIcon as BoardIconKey } from "shared/models"
import { Icon } from "@/common/Icon"

type Props = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> & {
  icon: BoardIconKey
  size?: CSSProperties["fontSize"]
}

export function BoardIcon({
  icon,
  size = "1.25rem",
  ...props
}: Props) {
  return <Icon name={icon} size={size} {...props} />
}
