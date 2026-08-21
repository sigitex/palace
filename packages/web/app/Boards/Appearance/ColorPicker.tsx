import classes from "@/Boards/Appearance/Appearance.module.css"
import {
  ColorSwatch,
  Group,
  Input,
  UnstyledButton,
} from "@mantine/core"
import { Icon } from "@/common/Icon"
import { BOARD_COLORS, type BoardColor } from "shared/models"

export function ColorPicker({
  color,
  onChange,
  required = false,
}: ColorPicker.Props) {
  return (
    <Input.Wrapper label="Color">
      <Group gap="xs" mt={4}>
        {!required && (
          <UnstyledButton
            className={`${classes.swatchButton} ${color === null ? classes.pickerSelected : ""}`}
            aria-label="No color"
            onClick={() => onChange(null)}
          >
            <Icon name="x" />
          </UnstyledButton>
        )}
        {BOARD_COLORS.map((value) => (
          <UnstyledButton
            key={value}
            className={`${classes.swatchButton} ${color === value ? classes.pickerSelected : ""}`}
            aria-label={`${title(value)} color`}
            onClick={() => onChange(value)}
          >
            <ColorSwatch
              color={`var(--mantine-color-${value}-6)`}
              size={28}
            >
              {color === value && (
                <Icon name="check" style={{ color: "white" }} />
              )}
            </ColorSwatch>
          </UnstyledButton>
        ))}
      </Group>
    </Input.Wrapper>
  )
}

export namespace ColorPicker {
  export type Props = {
    color: BoardColor | null
    onChange: (color: BoardColor | null) => void
    required?: boolean
  }
}

function title(value: string) {
  return value[0].toUpperCase() + value.slice(1)
}
