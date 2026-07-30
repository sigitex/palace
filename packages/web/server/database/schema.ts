import { createSchema } from "@sigitex/outlaw"
import { user, group, session, member, login } from "$/database/identity"

export const schema = createSchema({
  user,
  group,
  session,
  member,
  login,
})
