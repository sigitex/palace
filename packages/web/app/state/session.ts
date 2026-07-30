import { call } from "@/common/call"
import { Constants } from "shared/Constants"
import type { User } from "shared/models"
import { proxy } from "valtio"
import { useProxy } from "valtio/utils"

export type SessionData = {
  user: User
  groups: string[]
}

const session = proxy({
  data: initData(),
  get loggedIn() {
    return Boolean(session.data)
  },
  get isAnon() {
    return !session.loggedIn
  },
  get username() {
    return session.data?.user.name ?? "Anonymous"
  },
  async login(slug: string) {
    const data = await call.session.login({
      username: slug,
      password: "********",
    })
    localStorage.setItem(Constants.session.storage, JSON.stringify(data))
    session.data = data
  },
  async logout() {
    // call logout api
    session.data = null
    localStorage.removeItem(Constants.session.storage)
  },
})

export const useSession = () => useProxy(session)

function initData(): SessionData | null {
  try {
    const json = localStorage.getItem(Constants.session.storage)
    if (!json) {
      return null
    }
    return JSON.parse(json) as SessionData
  } catch {
    return null
  }
}
