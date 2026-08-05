import type { CSSProperties, HTMLAttributes } from "react"
import type { BoardIcon as BoardIconKey } from "shared/models"

export function BoardIcon({
  icon,
  size = "1.25rem",
  className,
  style,
  ...props
}: BoardIcon.Props) {
  return (
    <i
      className={`ph-duotone ph-${icon}${className ? ` ${className}` : ""}`}
      style={{ ...style, fontSize: size }}
      {...props}
    />
  )
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
