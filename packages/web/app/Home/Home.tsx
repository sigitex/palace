import { useSession } from "@/state"
import { Stack, Title } from "@mantine/core"

export default function Home() {
  const session = useSession()

  return (
    <Stack>
      <Title>
        Hello
        {session.loggedIn && <> {session.username}!</>}
      </Title>
    </Stack>
  )
}
