import { NavLink } from "@mantine/core"
import type { IconType } from "react-icons"
import type { ReactNode } from "react"
import { Link as RouteLink, useLocation } from "wouter"
import { useUI } from "@/state"

export default function NavigationLink({
  to,
  label,
  Icon,
  nested = false,
}: {
  readonly to: string
  readonly label?: ReactNode
  readonly Icon?: IconType
  readonly nested?: boolean
}) {
  const [pathname] = useLocation()
  const ui = useUI()

  return (
    <NavLink
      component={RouteLink}
      to={to}
      label={label}
      leftSection={Icon && <Icon size="2rem" stroke="1.5" />}
      active={
        pathname === to || (nested && pathname.startsWith(`${to}/`))
      }
      onClick={() => ui.toggleNav()}
    />
  )
}
