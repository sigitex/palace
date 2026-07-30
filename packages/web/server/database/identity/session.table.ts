import { createTable, integer, text } from "@sigitex/outlaw"
import { user } from "$/database/identity/user.table"

export type SessionRow = typeof session.infer

export const session = createTable("session", {
  id: integer.primaryKey.autoincrement,
  user: integer.notNull.foreignKey.references(user.id),
  token: text.notNull.unique,
  user_agent: text.notNull,
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  used_at: integer.notNull.map.timestamp,
})
