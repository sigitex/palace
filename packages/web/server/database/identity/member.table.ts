import { createFixture, createTable, integer } from "@sigitex/outlaw"
import { group } from "$/database/identity/group.table"
import { user } from "$/database/identity/user.table"
import { Time } from "shared/Time"

export type MemberRow = typeof member.infer

export const member = createTable("member", {
  group: integer.notNull.foreignKey.references(group.id),
  user: integer.notNull.foreignKey.references(user.id),
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
}).primaryKey("group", "user")

export const memberFixture = createFixture(
  member,
  {
    created_at: Time.thisYear(),
    updated_at: Time.thisYear(),
  },
  [
    row("Dan", "Finch"),
    row("Dan", "Palace Admins"),
    row("Lara", "Finch"),
    row("House", "Finch"),
    row("House", "Bots"),
    row("Zebra", "Bots"),
  ],
)

function row(userName: string, groupName: string) {
  return {
    group: group.by.name(groupName),
    user: user.by.name(userName),
  }
}
