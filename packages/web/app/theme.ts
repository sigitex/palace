import { createTheme } from "@mantine/core"

const theme = createTheme({
  defaultRadius: "xs",
  components: {
    Button: {
      defaultProps: {
        variant: "default",
      }
    }
  },
  primaryColor: "violet",
  primaryShade: {
    light: 9,
    dark: 7,
  },
})

export default theme
