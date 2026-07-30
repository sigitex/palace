import { createFixture, createTable, integer, text } from "@sigitex/outlaw"
import { Time } from "shared/Time"

export type UserRow = typeof user.infer

export const user = createTable("user", {
  id: integer.primaryKey.autoincrement,
  uid: text.notNull.unique,
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  slug: text.notNull.unique,
  name: text.notNull,
  email: text.unique,
  sms: text.unique,
})

export const userFixture = createFixture(
  user,
  {
    created_at: Time.thisYear,
    updated_at: Time.thisYear,
    sms: null,
  },
  [
    {
      id: 1,
      uid: "dan",
      slug: "dan",
      name: "Dan",
      email: "dan@finch.house",
    },
    {
      id: 2,
      uid: "lara",
      slug: "lara",
      name: "Lara",
      email: "lara@finch.house",
    },
    {
      id: 3,
      uid: "zebra",
      slug: "zebra",
      name: "Zebra",
      email: "zebra@finch.house",
    },
    {
      id: 4,
      uid: "house",
      slug: "house",
      name: "House",
      email: "house@finch.house",
    },
  ],
)
