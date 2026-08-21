import { useSession } from "@/state"
import { Button, Stack, Title } from "@mantine/core"

export default function Home() {
  const session = useSession()

  const imdan = () => session.login("dan")

  return (
    <Stack>
      <Title>
        Hello
        {session.isAnon && <Button onClick={imdan}>imdan</Button>}
        {session.loggedIn && <> {session.username}!</>}
      </Title>
    </Stack>
  )
}
