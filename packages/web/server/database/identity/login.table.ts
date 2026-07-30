import { user } from "$/database/identity/user.table";
import { createTable, integer, text } from "@sigitex/outlaw"

export type LoginRow = typeof login.infer

export const login = createTable("login", {
  id: integer.primaryKey.autoincrement,
  uid: text.notNull.unique,
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  user: integer.notNull.foreignKey.references(user.id),
  type: text.notNull.map<LoginType>(),
  data: text.notNull.map.json<TelegramLoginData>(),
})

export type LoginType = "telegram"

export type TelegramLoginData = {
  readonly id?: number
  readonly first_name?: string
  readonly last_name?: string
  readonly username?: string
  readonly photo_url?: string
  readonly auth_date?: string
}
