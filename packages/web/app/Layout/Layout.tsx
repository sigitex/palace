import { AppShell } from "@mantine/core"
import { useUI } from "@/state"
import Nav from "./Navigation"
import Tweaks from "@/Layout/Tweaks"
import Routes from "@/Layout/Routes"
import Header from "@/Layout/Header"

export default function Layout() {
  const ui = useUI()

  return (
    <AppShell
      header={{ height: { base: 60, md: 70, lg: 70 } }}
      navbar={{
        width: { base: 200, md: 200, lg: 300 },
        breakpoint: "sm",
        collapsed: { mobile: !ui.isNavOpen },
      }}
      padding="md"
      withBorder={false}
    >
      <Header />
      <Nav />
      <AppShell.Main>
        <Routes />
      </AppShell.Main>
      <Tweaks />
    </AppShell>
  )
}
