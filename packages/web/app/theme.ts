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
  primaryColor: "green",
  primaryShade: {
    light: 9,
    dark: 7,
  },
})

export default theme
