import { HeaderContainer } from "./Header.css";
import Auth from "@/common/Auth";
import HeaderTab from "@/Layout/HeaderTab";
import { BoardsPath } from "shared/BoardsPath";
import { Icons } from "@/common/Icons";

export default function Header() {
  return (
    <HeaderContainer>
      <HeaderTab to="/" label="Home" icon={Icons.Home} />
      <Auth>
        <HeaderTab
          to={BoardsPath.index}
          label="Boards"
          icon={Icons.Boards}
          nested
        />
      </Auth>
      <Auth allow="finch">
        <HeaderTab to="/family" label="Family" icon={Icons.Family} />
      </Auth>
      <Auth allow="finch">
        <HeaderTab to="/budget" label="Budget" icon={Icons.Budget} />
      </Auth>
      <Auth allow="finch">
        <HeaderTab to="/bots" label="Bots" icon={Icons.Bots} />
      </Auth>
      <Auth allow="finch">
        <HeaderTab to="/photos" label="Photos" icon={Icons.Photos} />
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
