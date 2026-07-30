import { AppShell, ScrollArea } from "@mantine/core"
import NavigationLink from "./NavigationLink"
import Auth from "@/common/Auth"
import { Icons } from "@/common/Icons";

export default function Nav() {
  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow component={ScrollArea}>
        <NavigationLink to="/" label="Home" Icon={Icons.Home} />
        <Auth allow="finch">
          <NavigationLink
            to="/boards"
            label="Boards"
            Icon={Icons.Boards}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/calendar"
            label="Calendar"
            Icon={Icons.Calendar}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/family"
            label="Family"
            Icon={Icons.Family}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/budget"
            label="Budget"
            Icon={Icons.Budget}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/bots"
            label="Bots"
            Icon={Icons.Bots}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/photos"
            label="Photos"
            Icon={Icons.Photos}
          />
        </Auth>
        <Auth allow="palace-admins">
          <NavigationLink
            to="/admin"
            label="Admin"
            Icon={Icons.Admin}
          />
        </Auth>
        <Auth>
          <NavigationLink
            to="/me"
            label="Profile"
            Icon={Icons.Profile}
          />
        </Auth>
      </AppShell.Section>
    </AppShell.Navbar>
  )
}
