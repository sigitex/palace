import { useUI } from "@/state"
import { AppShell, Burger, Group } from "@mantine/core"
import { Link } from "wouter"
import logo from "assets/images/logo.full.png"

export default function Header() {
  const ui = useUI()
  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Burger
            opened={ui.isNavOpen}
            onClick={() => ui.toggleNav()}
            hiddenFrom="sm"
            size="sm"
          />
          <Link to="/">
            <img
              src={logo}
              style={{ width: "60px", height: "60px" }}
            />
          </Link>
        </Group>
      </Group>
    </AppShell.Header>
  )
}
