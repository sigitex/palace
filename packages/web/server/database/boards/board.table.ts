import { createTable, createUniqueIndex, integer, text } from "@sigitex/outlaw"
import { user } from "$/database/identity"
import { workspace } from "$/database/boards/workspace.table"

export type BoardRow = typeof board.infer

export const board = createTable("board", {
  id: integer.primaryKey.autoincrement,
  workspace: integer.notNull.foreignKey.references(workspace.id),
  created_by: integer.notNull.foreignKey.references(user.id),
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  name: text.notNull,
  slug: text.notNull,
  color: text,
  icon: text,
})

export const boardByWorkspaceSlug = createUniqueIndex(
  "board_workspace_slug_idx",
).on(board.workspace, board.slug)
