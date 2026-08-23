import type { DB } from "$/database"
import type { Users } from "$/services/Users"
import { Constants } from "shared/Constants"
import type { RouteMiddleware, RequestContext, Cookies } from "@sigitex/route"

// todo: expiration

export function session(): RouteMiddleware {
  return {
    async before({
      cookies,
      bind,
      db,
      users,
    }: RequestContext & { cookies: Cookies; db: DB; users: Users }) {
      bind({ user: null, actor: null })
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
      const groups = await users.groups(user.id)
      bind({ user, actor: { user: user.id, groups } })
    },
  }
}
