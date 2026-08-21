import { operation } from "$/framework/operation"
import { type } from "arktype"
import { User } from "shared/models"
import {
  type Cookies,
  HTTP,
  type RequestContext,
  Unauthorized,
} from "@sigitex/route"
import { Constants } from "shared/Constants"
import type { Users } from "$/services/Users"
import type { Sessions } from "$/services/Sessions"

export const login = operation(
  {
    input: type({
      username: "string > 0",
      password: "string > 0",
    }),
    output: type({
      user: User,
      groups: "string[]",
    }),
  },
  async (
    { username },
    {
      request,
      users,
      sessions,
      cookies,
      bind,
    }: RequestContext & { users: Users; sessions: Sessions; cookies: Cookies },
  ) => {
    const user = await users.get(username)
    if (!user) {
      throw new Unauthorized()
    }
    const userAgent = request.headers.get(HTTP.header.UserAgent) ?? undefined
    const token = await sessions.create(user.id, userAgent)
    cookies.set(Constants.session.cookie, token, {
      sameSite: "strict",
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: Constants.session.maxAge,
    })
    const groups = await users.groups(user.id)
    const userSession = {
      user,
      groups,
    }
    bind(userSession)
    return userSession
  },
)
