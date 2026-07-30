import { whoami } from "$/api/session/whoami";
import { login } from "$/api/session/login"
import { logout } from "$/api/session/logout"
import type { Operations } from "$/framework/operation"

export const operations = {
  session: {
    login,
    logout,
    whoami,
  },
} as const satisfies Operations
