import { useSession, useUI } from "@/state"
import {
  Button,
  Drawer,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { useHotkeys } from "@mantine/hooks"

export default function Tweaks() {
  const ui = useUI()
  const session = useSession()

  useHotkeys([["F1", () => ui.toggleDevTools()]])

  const imDan = () => session.login("dan")
  const imLara = () => session.login("lara")

  return (
    <Drawer
      opened={ui.isDevToolsOpen}
      onClose={() => ui.toggleDevTools()}
      position="right"
      size="xl"
      title={
        <Text fw="bold" fz={24} c="orange">
          Administration
        </Text>
      }
    >
      <Stack p={12} justify="stretch" align="stretch">
        <Title order={3}>Login</Title>
        <Group>
          <Button onClick={imDan}>I'm Dan</Button>
          <Button onClick={imLara}>I'm Lara</Button>
          {session.loggedIn && (
            <Button onClick={session.logout}>Logout</Button>
          )}
        </Group>
      </Stack>
    </Drawer>
  )
}
