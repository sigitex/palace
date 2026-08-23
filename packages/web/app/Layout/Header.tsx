import { HeaderContainer } from "./Header.css";
import Auth from "@/common/Auth";
import HeaderTab from "@/Layout/HeaderTab";
import { routes, path } from "shared/routes";
import { Icons } from "@/common/Icons";

export default function Header() {
  return (
    <HeaderContainer>
      <HeaderTab
        to={routes.app.home}
        label="Home"
        icon={Icons.Home}
      />
      <Auth>
        <HeaderTab
          to={path.boards.index}
          label="Boards"
          icon={Icons.Boards}
          nested
        />
      </Auth>
      <Auth allow="palace-admins">
        <HeaderTab to="/admin" label="Admin" icon={Icons.Admin} />
      </Auth>
      <Auth>
        <HeaderTab to="/me" label="Profile" icon={Icons.Profile} />
      </Auth>
    </HeaderContainer>
  )
}
