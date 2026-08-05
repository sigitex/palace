import { ColorSelector } from "@/Boards/Presentation/ColorSelector"
import { IconSelector } from "@/Boards/Presentation/IconSelector"
import { Group } from "@mantine/core"
import type {
  BoardColor,
  BoardIcon as BoardIconKey,
} from "shared/models"

export function PresentationSelector({
  color,
  icon,
  onColorChange,
  onIconChange,
  colorRequired = false,
  iconRequired = false,
}: PresentationSelector.Props) {
  return (
    <Group grow align="flex-start">
      <ColorSelector
        color={color}
        onChange={onColorChange}
        required={colorRequired}
      />
      <IconSelector
        icon={icon}
        onChange={onIconChange}
        required={iconRequired}
      />
    </Group>
  )
}

export namespace PresentationSelector {
  export type Props = {
    color: BoardColor | null
    icon: BoardIconKey | null
    onColorChange: (color: BoardColor | null) => void
    onIconChange: (icon: BoardIconKey | null) => void
    colorRequired?: boolean
    iconRequired?: boolean
  }
}
