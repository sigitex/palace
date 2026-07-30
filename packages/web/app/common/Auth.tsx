import { useSession } from "@/state"
import type { ReactNode } from "react"

export default function Auth({
  allow,
  children,
}: {
  readonly allow?: string | string[]
  readonly children?: ReactNode
}) {
  const session = useSession()
  if (!session.data) {
    return null
  }
  if (allow === undefined) {
    return children
  }
  if (session.data.groups.includes("palace-admins")) {
    return children
  }
  const groups = typeof allow === "string" ? [allow] : allow
  if (groups.length === 0) {
    return children
  }
  for (const group of groups) {
    if (session.data.groups.includes(group)) {
      return children
    }
  }
  return null
}
