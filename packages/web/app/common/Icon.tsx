import type { CSSProperties, HTMLAttributes } from "react"
import type { BoardIcon as IconName } from "shared/models"

type Props = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> & {
  name: IconName
  size?: CSSProperties["fontSize"]
}

/** Renders a Phosphor duotone glyph from the webfont loaded in `main.tsx`. */
export function Icon({
  name,
  size = "1em",
  className,
  style,
  ...props
}: Props) {
  return (
    <i
      className={`ph-duotone ph-${name}${className ? ` ${className}` : ""}`}
      style={{ ...style, fontSize: size }}
      {...props}
    />
  )
}
