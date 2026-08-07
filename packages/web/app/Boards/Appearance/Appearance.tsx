import { ColorPicker } from "@/Boards/Appearance/ColorPicker"
import { IconPicker } from "@/Boards/Appearance/IconPicker"
import { Group } from "@mantine/core"
import type {
  BoardColor,
  BoardIcon as BoardIconKey,
} from "shared/models"

export default function Appearance({
  color,
  icon,
  onColorChange,
  onIconChange,
  colorRequired = false,
  iconRequired = false,
}: Appearance.Props) {
  return (
    <Group grow align="flex-start">
      <ColorPicker
        color={color}
        onChange={onColorChange}
        required={colorRequired}
      />
      <IconPicker
        icon={icon}
        onChange={onIconChange}
        required={iconRequired}
      />
    </Group>
  )
}

export namespace Appearance {
  export type Props = {
    color: BoardColor | null
    icon: BoardIconKey | null
    onColorChange: (color: BoardColor | null) => void
    onIconChange: (icon: BoardIconKey | null) => void
    colorRequired?: boolean
    iconRequired?: boolean
  }
}
