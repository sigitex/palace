import { AppShell, ScrollArea } from "@mantine/core"
import NavigationLink from "./NavigationLink"
import Auth from "@/common/Auth"
import { Icons } from "@/common/Icons"
import { BoardsPath } from "shared/BoardsPath"

export default function Nav() {
  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow component={ScrollArea}>
        <NavigationLink to="/" label="Home" icon={Icons.Home} />
        <Auth>
          <NavigationLink
            to={BoardsPath.index}
            label="Boards"
            icon={Icons.Boards}
            nested
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/calendar"
            label="Calendar"
            icon={Icons.Calendar}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/family"
            label="Family"
            icon={Icons.Family}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/budget"
            label="Budget"
            icon={Icons.Budget}
          />
        </Auth>
        <Auth allow="finch">
          <NavigationLink to="/bots" label="Bots" icon={Icons.Bots} />
        </Auth>
        <Auth allow="finch">
          <NavigationLink
            to="/photos"
            label="Photos"
            icon={Icons.Photos}
          />
        </Auth>
        <Auth allow="palace-admins">
          <NavigationLink
            to="/admin"
            label="Admin"
            icon={Icons.Admin}
          />
        </Auth>
        <Auth>
          <NavigationLink
            to="/me"
            label="Profile"
            icon={Icons.Profile}
          />
        </Auth>
      </AppShell.Section>
    </AppShell.Navbar>
  )
}
