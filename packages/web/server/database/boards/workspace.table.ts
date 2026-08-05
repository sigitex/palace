import { createTable, integer, text } from "@sigitex/outlaw"
import { user } from "$/database/identity"

export type WorkspaceRow = typeof workspace.infer

export const workspace = createTable("workspace", {
  id: integer.primaryKey.autoincrement,
  created_by: integer.notNull.foreignKey.references(user.id),
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  name: text.notNull,
  slug: text.notNull.unique,
  color: text,
  icon: text,
})
