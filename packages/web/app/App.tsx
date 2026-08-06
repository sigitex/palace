import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import theme from "@/theme"
import Layout from "@/Layout"

export default function App() {
  return (
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <Layout />
      <Notifications autoClose={2000} position="bottom-center" />
    </MantineProvider>
  )
}
