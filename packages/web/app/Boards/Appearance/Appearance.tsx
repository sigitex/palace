import { ColorPicker } from "@/Boards/Appearance/ColorPicker"
import { IconPicker } from "@/Boards/Appearance/IconPicker"
import { Group } from "@mantine/core"
import type {
  BoardColor,
  BoardIcon as BoardIconKey,
} from "shared/models"

type Props = {
  color: BoardColor | null
  icon: BoardIconKey | null
  onColorChange: (color: BoardColor | null) => void
  onIconChange: (icon: BoardIconKey | null) => void
  colorRequired?: boolean
  iconRequired?: boolean
}

export default function Appearance({
  color,
  icon,
  onColorChange,
  onIconChange,
  colorRequired = false,
  iconRequired = false,
}: Props) {
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
