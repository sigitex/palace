import { AppShell } from "@mantine/core"
import { useUI } from "@/state"
import Nav from "./Navigation"
import Tweaks from "@/Layout/Tweaks"
import Routes from "@/Layout/Routes"
import Header from "@/Layout/Header"

export default function Layout() {
  return (
    <AppShell
      header={{ height: { base: 60, md: 70, lg: 70 } }}
      padding="md"
      withBorder={false}
    >
      <Header />
      <AppShell.Main>
        <Routes />
      </AppShell.Main>
      <Tweaks />
    </AppShell>
  )
}
