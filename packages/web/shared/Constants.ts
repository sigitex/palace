import { Time } from "./Time"

export const Constants = {
  session: {
    cookie: "ps",
    maxAge: 6 * Time.WEEKS,
    storage: "session",
  },
} as const
