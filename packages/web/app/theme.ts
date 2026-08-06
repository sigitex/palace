import { createTheme } from "@mantine/core"
import { themeToVars } from "@mantine/vanilla-extract"

export const theme = createTheme({
  defaultRadius: "xs",
  components: {
    Button: {
      defaultProps: {
        variant: "default",
      }
    }
  },
  primaryColor: "cyan",
  primaryShade: {
    light: 9,
    dark: 7,
  },
})

export const vars = themeToVars(theme)
