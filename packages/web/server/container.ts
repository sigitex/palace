import { bind, constructor, factory, singleton } from "@sigitex/bind"
import { createDB } from "$/database"
import { Users } from "$/services/Users"
import { Sessions } from "$/services/Sessions"

export const container = bind({
  db: singleton(factory(createDB)),
  users: constructor(Users),
  sessions: constructor(Sessions),
})
