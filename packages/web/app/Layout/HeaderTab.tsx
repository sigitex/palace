import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Icon } from "@/common/Icon";
import type { BoardIcon as IconName } from "shared/models";
import { HeaderLink, HeaderLabel } from "@/Layout/HeaderTab.css";

export default function HeaderTab({
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
  const className = pathname === to || (nested && pathname.startsWith(`${to}/`)) ? "active" : undefined

  return (
    <HeaderLink
      to={to}
      className={className}
    >
      {icon && <Icon name={icon} size="1.8rem" />}
      <HeaderLabel>{label}</HeaderLabel>
    </HeaderLink>
  )
}
