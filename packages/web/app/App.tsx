import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import theme from "@/theme"
import Layout from "@/Layout"

const client = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <MantineProvider defaultColorScheme="light" theme={theme}>
        <Layout />
        <Notifications autoClose={2000} position="bottom-center" />
      </MantineProvider>
    </QueryClientProvider>
  )
}
