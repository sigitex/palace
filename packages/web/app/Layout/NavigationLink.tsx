import { NavLink } from "@mantine/core"
import type { ReactNode } from "react"
import { Link as RouteLink, useLocation } from "wouter"
import { useUI } from "@/state"
import { Icon } from "@/common/Icon"
import type { BoardIcon as IconName } from "shared/models"

export default function NavigationLink({
  to,
  label,
  icon,
  nested = false,
}: {
  readonly to: string
  readonly label?: ReactNode
  readonly icon?: IconName
  readonly nested?: boolean
}) {
  const [pathname] = useLocation()
  const ui = useUI()

  return (
    <NavLink
      component={RouteLink}
      to={to}
      label={label}
      leftSection={icon && <Icon name={icon} size="2rem" />}
      active={
        pathname === to || (nested && pathname.startsWith(`${to}/`))
      }
      onClick={() => ui.toggleNav()}
    />
  )
}
