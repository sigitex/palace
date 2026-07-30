import type { DB } from "$/database"
import { Constants } from "shared/Constants"
import type { RouteMiddleware, RequestContext, Cookies } from "@sigitex/route"

// todo: expiration

export function session(): RouteMiddleware {
  return {
    async before({
      cookies,
      bind,
      db,
    }: RequestContext & { cookies: Cookies; db: DB }) {
      const token = cookies.get(Constants.session.cookie)
      if (!token) {
        return
      }
      const [session] = await db.session
        .select("user")
        .where("token", "=", token)
        .fetch()
      if (!session) {
        return
      }
      const [user] = await db.user
        .select("*")
        .where("id", "=", session.user)
        .fetch()
      if (!user) {
        return
      }
      const groups = ["finch", "palace-admins"]
      bind({ user, groups })
    },
  }
}
