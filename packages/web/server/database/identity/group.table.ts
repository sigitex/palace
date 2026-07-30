import { Time } from "shared/Time"
import { createFixture, createTable, integer, text } from "@sigitex/outlaw"

export type GroupRow = typeof group.infer

export const group = createTable("group", {
  id: integer.primaryKey.autoincrement,
  uid: text.notNull.unique,
  name: text.notNull,
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
})

export const groupFixture = createFixture(
  group,
  {
    created_at: Time.thisYear,
    updated_at: Time.thisYear,
  },
  [
    {
      id: 1,
      uid: "finch",
      name: "Finch",
    },
    {
      id: 2,
      uid: "palace-admins",
      name: "Palace Admins",
    },
    {
      id: 3,
      uid: "bots",
      name: "Bots",
    },
  ],
)
