import { whoami } from "$/api/session/whoami"
import { login } from "$/api/session/login"
import { logout } from "$/api/session/logout"
import type { Operations } from "$/framework/operation"
import { boards } from "$/api/boards"

export const operations = {
  session: {
    login,
    logout,
    whoami,
  },
  boards,
} as const satisfies Operations
