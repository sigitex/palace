import { MantineProvider } from "@mantine/core"
import {
  emotionTransform,
  MantineEmotionProvider,
} from "@mantine/emotion"
import { Notifications } from "@mantine/notifications"
import { theme } from "@/theme"
import Layout from "@/Layout"

export default function App() {
  return (
    <MantineProvider
      defaultColorScheme="light"
      theme={theme}
      stylesTransform={emotionTransform}
    >
      <MantineEmotionProvider>
        <Layout />
        <Notifications autoClose={2000} position="bottom-center" />
      </MantineEmotionProvider>
    </MantineProvider>
  )
}
